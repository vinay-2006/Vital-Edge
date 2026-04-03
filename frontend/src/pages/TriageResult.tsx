import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown, Shield, AlertTriangle, Heart } from 'lucide-react';
import { TriageResult as TriageResultType, TriagePriority } from '@/lib/types';
import { ExplainabilityPanel } from '@/components/ExplainabilityPanel';
import { RiskAssessmentCard } from '@/components/RiskAssessmentCard';
import { ExperimentalImagingCard } from '@/components/ExperimentalImagingCard';
import { priorityConfig, formatTime } from '@/lib/triage-utils';
import { apiClient } from '@/lib/api-client';

const priorityIcons: Record<TriagePriority, React.ReactNode> = {
  CRITICAL: <AlertTriangle size={32} />,
  MODERATE: <Shield size={32} />,
  STABLE: <Heart size={32} />,
};

const TriageResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result as TriageResultType | undefined;
  const [overridePriority, setOverridePriority] = useState<TriagePriority | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverride, setShowOverride] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [overriding, setOverriding] = useState(false);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-lg text-muted-foreground">No triage result found</p>
        <button onClick={() => navigate('/')} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold">
          Go to Triage
        </button>
      </div>
    );
  }

  const activePriority = overridePriority || result.priority;
  const config = priorityConfig[activePriority];

  const handleOverride = async () => {
    if (!overridePriority || !overrideReason.trim()) {
      alert('Please select a priority and provide a reason for override');
      return;
    }

    setOverriding(true);
    try {
      await apiClient.overridePriority(result.id, overridePriority, overrideReason);
      alert('Priority override saved successfully');
      setShowOverride(false);
    } catch (error) {
      alert('Failed to save override: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setOverriding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-semibold text-sm min-h-[44px]">
        <ArrowLeft size={18} /> New Triage
      </button>

      {/* Priority Banner */}
      <div className={`${config.className} rounded-2xl p-6 text-center space-y-2`}>
        <div className="flex justify-center">{priorityIcons[activePriority]}</div>
        <h2 className="text-3xl font-black tracking-wider">{config.label}</h2>
        <p className="text-lg font-semibold opacity-90">Priority Level</p>
        <div className="inline-block bg-black/20 rounded-full px-4 py-1 text-sm font-bold">
          Confidence: {result.confidence}%
        </div>
        {result.mode === 'AMBULANCE' && (
          <div className="inline-block ml-2 bg-red-600/80 rounded-full px-4 py-1 text-sm font-bold text-white">
            🚑 AMBULANCE MODE {result.etaMinutes && `• ETA: ${result.etaMinutes} min`}
          </div>
        )}
        {overridePriority && (
          <p className="text-xs opacity-75 font-medium">Overridden from {result.priority}</p>
        )}
        {result.isOverridden && (
          <p className="text-xs opacity-75 font-medium bg-black/20 inline-block px-3 py-1 rounded-full">
            ⚠️ Override Applied: {result.overrideReason}
          </p>
        )}
      </div>

      {/* Patient */}
      <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Patient</h3>
        <p className="text-lg font-bold text-foreground">{result.patient.name}</p>
        <p className="text-sm text-muted-foreground">
          {result.patient.age} yrs • {result.patient.gender} • {formatTime(result.createdAt)}
        </p>
        {result.operatorName && (
          <p className="text-xs text-muted-foreground mt-1">Operator: {result.operatorName}</p>
        )}
      </div>

      {/* Vitals Summary */}
      <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Vital Signs</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">BP:</span>{' '}
            <span className="font-semibold text-foreground">
              {result.vitals.bloodPressure.systolic}/{result.vitals.bloodPressure.diastolic} mmHg
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Pulse:</span>{' '}
            <span className="font-semibold text-foreground">{result.vitals.pulse} bpm</span>
          </div>
          <div>
            <span className="text-muted-foreground">SpO₂:</span>{' '}
            <span className="font-semibold text-foreground">{result.vitals.spo2}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Temp:</span>{' '}
            <span className="font-semibold text-foreground">{result.vitals.temperature}°C</span>
          </div>
          <div>
            <span className="text-muted-foreground">RR:</span>{' '}
            <span className="font-semibold text-foreground">{result.vitals.respiratoryRate}/min</span>
          </div>
        </div>
      </div>

      {/* Explainability Panel */}
      <ExplainabilityPanel explainability={result.explainability} priority={result.priority} />

      {/* Risk Assessment Card */}
      <RiskAssessmentCard riskAssessment={result.riskAssessment} />

      {/* Experimental Imaging Engine (CRITICAL ONLY) */}
      {result.priority === 'CRITICAL' && (
        <ExperimentalImagingCard result={result} />
      )}

      {/* Score Breakdown */}
      <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Score Breakdown</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-foreground">Total Score:</span>
            <span className="text-xl font-bold text-primary">{Math.min(result.score.totalScore, 80)}/80</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Vital Signs Score:</span>
            <span className="font-semibold text-foreground">{Math.min(result.score.vitalScore, 40)}/40</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Symptom Score:</span>
            <span className="font-semibold text-foreground">{Math.min(result.score.symptomScore, 40)}/40</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <button
            onClick={() => setShowOverride(!showOverride)}
            className="w-full h-14 rounded-xl border-2 border-border bg-card text-foreground font-semibold flex items-center justify-center gap-2 hover:bg-accent transition-colors"
          >
            Override Priority <ChevronDown size={16} />
          </button>
          {showOverride && (
            <div className="mt-2 bg-card rounded-xl border border-border shadow-lg p-4 space-y-3">
              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-2 block">New Priority</label>
                <div className="flex gap-2">
                  {(['CRITICAL', 'MODERATE', 'STABLE'] as TriagePriority[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setOverridePriority(p)}
                      className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm ${
                        overridePriority === p
                          ? priorityConfig[p].className
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {priorityConfig[p].label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-2 block">Reason for Override</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Explain why you're overriding the AI decision..."
                  className="w-full h-20 rounded-lg border-2 border-border px-3 py-2 bg-surface-elevated text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <button
                onClick={handleOverride}
                disabled={overriding || !overridePriority || !overrideReason.trim()}
                className="w-full h-12 rounded-lg bg-orange-600 text-white font-bold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {overriding ? 'Saving Override...' : 'Save Override'}
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => { setConfirmed(true); setTimeout(() => navigate('/dashboard'), 800); }}
          disabled={confirmed}
          className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {confirmed ? <><Check size={20} /> Saved</> : 'Confirm & Go to Dashboard'}
        </button>
      </div>
    </div>
  );
};

export default TriageResultPage;
