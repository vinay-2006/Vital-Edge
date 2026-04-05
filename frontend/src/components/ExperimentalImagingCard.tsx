import { useState, useRef } from 'react';
import { Microscope, AlertTriangle, FileText, Loader2, UploadCloud, CheckCircle2 } from 'lucide-react';
import { apiClient, AnalyzeImagingResponse } from '@/lib/api-client';
import { TriageResult } from '@/lib/types';
import { toDBPriority } from '@/lib/priority-mapper';

interface ExperimentalImagingCardProps {
  result: TriageResult;
}

type PipelineState = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

export const ExperimentalImagingCard = ({ result }: ExperimentalImagingCardProps) => {
  const [analysis, setAnalysis] = useState<AnalyzeImagingResponse | null>(null);
  const [pipelineState, setPipelineState] = useState<PipelineState>('idle');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('image/')) {
      setError('Invalid file type. Please upload a JPG or PNG.');
      setPipelineState('error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit.');
      setPipelineState('error');
      return;
    }

    setPipelineState('uploading');
    setError(null);
    
    try {
      const activeSymptoms = Object.entries(result.symptoms)
        .filter(([_, value]) => value === true)
        .map(([key]) => key);

      if (result.symptoms.other) {
        activeSymptoms.push(result.symptoms.other);
      }

      setPipelineState('processing');
      const response = await apiClient.analyzeImaging(
        {
          triage_level: toDBPriority(result.priority),
          vitals: result.vitals,
          symptoms: activeSymptoms,
        },
        file
      );
      setAnalysis(response);
      setPipelineState('complete');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Unknown error during imaging simulation');
      setPipelineState('error');
    }
  };

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm border-2 border-dashed border-blue-500/30 overflow-hidden relative">
      <div className="absolute top-0 right-0 bg-blue-500/10 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-bl-lg">
        AI ASSISTED DIAGNOSTICS
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Microscope size={20} className="text-blue-700" />
        </div>
        <h3 className="text-base font-bold text-foreground">Imaging &amp; Diagnostics Module</h3>
      </div>

      {(pipelineState === 'idle' || pipelineState === 'error') && !analysis && (
        <div className="bg-blue-50/50 p-4 rounded-lg flex flex-col items-center justify-center gap-3 border border-blue-100 py-8">
          <p className="text-sm text-center text-muted-foreground w-full mb-2">
            Patient assigned {result.priority} priority. 
            Upload relevant patient imaging (Mock DICOM/JPG) to automate heuristic risk analysis.
          </p>
          
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload} 
            accept="image/jpeg, image/png"
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <UploadCloud size={20} /> Upload Patient Imaging
          </button>

          {error && (
            <p className="text-xs text-red-600 font-medium break-words w-full p-2 bg-red-50 rounded mt-2 border border-red-100 text-center">
              {error}
            </p>
          )}
        </div>
      )}

      {(pipelineState === 'uploading' || pipelineState === 'processing') && (
        <div className="flex flex-col items-center justify-center py-10 gap-4 text-blue-600 bg-blue-50/30 rounded-lg border border-blue-100">
          <Loader2 size={36} className="animate-spin" />
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-blue-900">
              {pipelineState === 'uploading' ? 'Uploading Image Payload...' : 'Processing Pipeline Execution...'}
            </p>
            <p className="text-xs text-blue-600/80">
              {pipelineState === 'uploading' 
                ? 'Transferring to cloud intake layer' 
                : 'Fusing image metrics with clinical rule weights'}
            </p>
          </div>
        </div>
      )}

      {pipelineState === 'complete' && analysis && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
            <CheckCircle2 size={16} /> Analysis Complete
            <span className="text-[10px] text-slate-400 font-mono ml-auto bg-slate-50 px-2 py-0.5 rounded border">
              latency: {analysis.processing_time_ms}ms
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className={`p-3 rounded-lg border flex-1 ${analysis.imaging_recommended ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
              <p className="text-xs font-bold text-muted-foreground uppercase">Imaging Recommendation</p>
              <p className={`text-sm sm:text-base font-bold mt-1 ${analysis.imaging_recommended ? 'text-amber-800' : 'text-slate-800'}`}>
                {analysis.imaging_recommended ? 'Imaging Suggested (High Priority)' : 'Not Recommended'}
              </p>
              <p className="text-xs mt-1 text-slate-600">{analysis.reason}</p>
            </div>
            
            {/* If no analysis could be generated (e.g. fallback mode) */}
            {!analysis.analysis && analysis.note && (
               <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex-1 flex items-center justify-center text-sm font-medium text-slate-500 italic">
                 {analysis.note}
               </div>
            )}

            {analysis.analysis && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex-1">
                <p className="text-[10px] font-semibold text-blue-600/80 uppercase tracking-wider mb-2 border-b border-blue-200/50 pb-1">
                  Signals fused for heuristic classification
                </p>
                <p className="text-xs font-bold text-muted-foreground uppercase">Algorithmic Output</p>
                <p className="text-sm sm:text-base font-bold text-indigo-900 mt-1 capitalize leading-tight">
                  {analysis.analysis.possible_condition.replace(/_/g, ' ')}
                </p>
                
                <div className="flex flex-col mt-3 gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold bg-indigo-600 px-2 py-0.5 rounded text-white shadow-sm">
                      Confidence: {Math.round(analysis.analysis.confidence * 100)}%
                    </span>
                    <span className="text-[10px] font-medium bg-white text-slate-600 px-2 py-0.5 rounded border shadow-sm">
                      Clinical: {analysis.analysis.explanation.clinical_weight * 100}% | Image: {analysis.analysis.explanation.image_weight * 100}%
                    </span>
                  </div>

                  <div className="bg-white/60 p-1.5 rounded border border-blue-100 text-[10px] font-mono text-slate-600 break-all space-y-0.5">
                    <p>» METRICS: variance={(analysis.analysis.image_metrics.variance).toFixed(3)}, contrast={(analysis.analysis.image_metrics.contrast).toFixed(3)}</p>
                    <p>» INFLUENCE: {analysis.analysis.explanation.image_influence.toUpperCase()}</p>
                  </div>

                  <p className="text-[10px] text-blue-700/70 leading-tight italic">
                    * We compute image signal characteristics and combine them with clinical risk to assist decision-making. No definitive diagnosis provided.
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
