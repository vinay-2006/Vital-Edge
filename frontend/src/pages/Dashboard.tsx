import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, Shield, Heart, Plus, Download, Activity, Ambulance } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { apiClient } from '@/lib/api-client';
import { DashboardSummary } from '@/lib/types';
import { priorityConfig, formatDateTime } from '@/lib/triage-utils';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await apiClient.getDashboard();
      setData(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const blob = await apiClient.exportCSV();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `triage-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export CSV: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">Loading…</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-lg text-red-600">Error: {error}</p>
        <button onClick={loadDashboard} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold">
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const chartData = [
    { name: 'Critical', count: data.red, fill: 'hsl(0, 84%, 60%)' },
    { name: 'Moderate', count: data.yellow, fill: 'hsl(38, 92%, 50%)' },
    { name: 'Stable', count: data.green, fill: 'hsl(160, 84%, 39%)' },
  ];

  const metrics = [
    { label: 'Total (2 Days)', value: data.totalToday, icon: <Users size={22} />, bgClass: 'bg-primary/10 text-primary' },
    { label: 'Critical', value: data.red, icon: <AlertTriangle size={22} />, bgClass: 'triage-critical-bg-soft triage-critical-text' },
    { label: 'Moderate', value: data.yellow, icon: <Shield size={22} />, bgClass: 'triage-moderate-bg-soft triage-moderate-text' },
    { label: 'Stable', value: data.green, icon: <Heart size={22} />, bgClass: 'triage-stable-bg-soft triage-stable-text' },
  ];

  const additionalMetrics = [
    { label: 'Avg Confidence', value: `${data.averageConfidence}%`, icon: <Activity size={22} />, bgClass: 'bg-blue-100 text-blue-700' },
    { label: 'High Risk', value: data.highRiskCount, icon: <AlertTriangle size={22} />, bgClass: 'bg-orange-100 text-orange-700' },
    { label: 'Ambulance Mode', value: data.ambulanceModeCount, icon: <Ambulance size={22} />, bgClass: 'bg-red-100 text-red-700' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            disabled={exporting || data.totalToday === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm min-h-[44px] hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm min-h-[44px]"
          >
            <Plus size={18} /> New Triage
          </button>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="bg-card rounded-xl p-4 shadow-sm border border-border">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${m.bgClass}`}>
              {m.icon}
            </div>
            <p className="text-2xl font-black text-foreground">{m.value}</p>
            <p className="text-xs font-semibold text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {additionalMetrics.map(m => (
          <div key={m.label} className="bg-card rounded-xl p-4 shadow-sm border border-border">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${m.bgClass}`}>
                {m.icon}
              </div>
              <div>
                <p className="text-2xl font-black text-foreground">{m.value}</p>
                <p className="text-xs font-semibold text-muted-foreground">{m.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Priority Distribution</h3>
        {data.totalToday > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-8">No data yet. Run your first triage.</p>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider p-4 pb-2">Recent Entries (Last 30 · Today &amp; Yesterday)</h3>
        {data.recentEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Priority</th>
                  <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Confidence</th>
                  <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Risk</th>
                  <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Mode</th>
                  <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEntries.map(entry => {
                  const pc = priorityConfig[entry.priority] ?? priorityConfig['STABLE'];
                  return (
                    <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                      <td className="px-4 py-3 font-semibold text-foreground">{entry.patient.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${pc.className}`}>
                          {pc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-medium">{entry.confidence}%</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${
                          entry.riskAssessment.deteriorationRisk === 'HIGH' ? 'text-red-600' :
                          entry.riskAssessment.deteriorationRisk === 'MEDIUM' ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {entry.riskAssessment.deteriorationRisk}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {entry.mode === 'AMBULANCE' ? (
                          <span className="text-xs font-semibold text-red-600">🚑 AMB</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">🏥 HOS</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-medium whitespace-nowrap">{formatDateTime(entry.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8 px-4">No entries yet</p>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
