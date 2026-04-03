import { useState } from 'react';
import { Microscope, AlertTriangle, FileText, Loader2, Play } from 'lucide-react';
import { apiClient, AnalyzeImagingResponse } from '@/lib/api-client';
import { TriageResult } from '@/lib/types';
import { toDBPriority } from '@/lib/priority-mapper';

interface ExperimentalImagingCardProps {
  result: TriageResult;
}

export const ExperimentalImagingCard = ({ result }: ExperimentalImagingCardProps) => {
  const [analysis, setAnalysis] = useState<AnalyzeImagingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunDiagnostics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const activeSymptoms = Object.entries(result.symptoms)
        .filter(([_, value]) => value === true)
        .map(([key]) => key);

      if (result.symptoms.other) {
        activeSymptoms.push(result.symptoms.other);
      }

      // We pass 'test-data/sample-images/stroke-like.jpg' per the experimental module's mock files
      const response = await apiClient.analyzeImaging(
        {
          triage_level: toDBPriority(result.priority),
          vitals: result.vitals,
          symptoms: activeSymptoms,
        },
        'test-data/sample-images/stroke-like.jpg'
      );
      setAnalysis(response);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Unknown error during imaging simulation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm border-2 border-dashed border-blue-500/30 overflow-hidden relative">
      <div className="absolute top-0 right-0 bg-blue-500/10 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-bl-lg">
        EXPERIMENTAL MODULE
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Microscope size={20} className="text-blue-700" />
        </div>
        <h3 className="text-base font-bold text-foreground">AI-Assisted Diagnostics</h3>
      </div>

      {!analysis && !isLoading && (
        <div className="bg-blue-50/50 p-4 rounded-lg flex flex-col items-start gap-3 border border-blue-100">
          <p className="text-sm text-muted-foreground w-full">
            The patient has been assigned a CRITICAL priority. You can run the experimental 
            Imaging &amp; Diagnostics AI module locally to scan mock CT/MRI data and generate assistive insights.
          </p>
          <button
            onClick={handleRunDiagnostics}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            <Play size={16} /> Run Diagnostics (Mock Scan)
          </button>
          {error && (
            <p className="text-xs text-red-600 font-medium break-words w-full p-2 bg-red-50 rounded">
              {error}
            </p>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-blue-600">
          <Loader2 size={32} className="animate-spin" />
          <p className="text-sm font-semibold">Simulating DICOM Intake &amp; AI Analysis...</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          {/* Primary Result Banner */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className={`p-3 rounded-lg border flex-1 ${analysis.imaging_recommended ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
              <p className="text-xs font-bold text-muted-foreground uppercase">Imaging Recommendation</p>
              <p className={`text-sm sm:text-base font-bold mt-1 ${analysis.imaging_recommended ? 'text-amber-800' : 'text-slate-800'}`}>
                {analysis.imaging_recommended ? 'Imaging Suggested (High Priority)' : 'Not Recommended'}
              </p>
              <p className="text-xs mt-1 text-slate-600">{analysis.reason}</p>
            </div>
            
            {analysis.analysis && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex-1">
                <p className="text-[10px] font-semibold text-blue-600/80 uppercase tracking-wider mb-2 border-b border-blue-200/50 pb-1">
                  Scan processed through AI pipeline (simulated inference)
                </p>
                <p className="text-xs font-bold text-muted-foreground uppercase">AI Finding</p>
                <p className="text-sm sm:text-base font-bold text-blue-800 mt-1 capitalize">{analysis.analysis.possible_condition.replace(/_/g, ' ')}</p>
                <div className="flex flex-col mt-2 gap-1.5">
                  <div>
                    <span className="text-xs font-semibold bg-white border border-blue-100 px-2 py-0.5 rounded text-blue-700 shadow-sm">
                      Confidence: {Math.round(analysis.analysis.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-[10px] text-blue-600/80 leading-tight italic">
                    * Confidence reflects model certainty based on pattern match, not clinical accuracy.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* AI Report */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-muted px-3 py-2 border-b border-border flex items-center gap-2">
              <FileText size={16} className="text-muted-foreground" />
              <span className="text-sm font-bold">Assistive Clinical Report</span>
            </div>
            <div className="p-4 space-y-4 bg-card text-sm">
              <div>
                <p className="font-semibold text-foreground mb-1">Summary</p>
                <p className="text-muted-foreground leading-relaxed">{analysis.report.summary}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-foreground mb-1">Key Findings</p>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                    {analysis.report.findings.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Action Items &amp; Recommendation</p>
                  <p className="text-muted-foreground">{analysis.report.recommendation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Impact */}
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex flex-col gap-2">
            <p className="text-sm font-bold text-emerald-800">Operational &amp; Workflow Impact</p>
            <ul className="text-xs text-emerald-800 list-disc pl-4 space-y-1 font-medium">
              <li>Early AI-assisted review reduces initial interpretation delay in high-load settings.</li>
              <li>Acts as a pre-read layer during high patient load, not a replacement for full radiologist review.</li>
            </ul>
          </div>

          {/* Safety Disclaimer */}
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-2">
            <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-red-800">CLINICAL SAFETY DISCLAIMER</p>
              <ul className="text-xs text-red-700 list-disc pl-3">
                {analysis.safety_disclaimer.map((disc, idx) => (
                  <li key={idx} className="leading-tight">{disc}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
