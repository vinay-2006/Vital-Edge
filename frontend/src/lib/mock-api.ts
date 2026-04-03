import { TriageInput, TriageResult, DashboardSummary, TriagePriority } from './types';

function analyzeTriage(input: TriageInput): { priority: TriagePriority; confidence: number; reasoning: string[] } {
  const reasoning: string[] = [];
  let score = 0;

  const spo2 = Number(input.vitals.spo2);
  const pulse = Number(input.vitals.pulse);
  const systolic = Number(input.vitals.bpSystolic);
  const temp = Number(input.vitals.temperature);
  const rr = Number(input.vitals.respiratoryRate);

  if (spo2 && spo2 < 90) { score += 3; reasoning.push(`Critical SpO₂ level: ${spo2}%`); }
  else if (spo2 && spo2 < 94) { score += 1; reasoning.push(`Low SpO₂: ${spo2}%`); }

  if (pulse && (pulse > 120 || pulse < 50)) { score += 2; reasoning.push(`Abnormal pulse: ${pulse} bpm`); }

  if (systolic && (systolic > 180 || systolic < 90)) { score += 2; reasoning.push(`Abnormal BP: ${systolic}/${input.vitals.bpDiastolic} mmHg`); }

  if (temp && temp > 39) { score += 1; reasoning.push(`High temperature: ${temp}°C`); }

  if (rr && (rr > 24 || rr < 10)) { score += 2; reasoning.push(`Abnormal respiratory rate: ${rr}/min`); }

  const criticalSymptoms = ['Chest Pain', 'Unconscious', 'Seizure'];
  const moderateSymptoms = ['Breathlessness', 'Bleeding', 'Trauma'];

  input.symptoms.forEach(s => {
    if (criticalSymptoms.includes(s)) { score += 3; reasoning.push(`${s} reported`); }
    else if (moderateSymptoms.includes(s)) { score += 1; reasoning.push(`${s} reported`); }
    else { reasoning.push(`${s} reported`); }
  });

  let priority: TriagePriority = 'STABLE';
  if (score >= 5) priority = 'CRITICAL';
  else if (score >= 2) priority = 'MODERATE';

  const confidence = Math.min(98, 70 + score * 4 + Math.floor(Math.random() * 10));

  if (reasoning.length === 0) reasoning.push('Vitals within normal range');

  return { priority, confidence, reasoning };
}

let storedResults: TriageResult[] = [];

export async function postTriage(input: TriageInput): Promise<TriageResult> {
  await new Promise(r => setTimeout(r, 1500));
  const analysis = analyzeTriage(input);
  const result: TriageResult = {
    id: crypto.randomUUID(),
    patient: input.patient,
    priority: analysis.priority,
    confidence: analysis.confidence,
    reasoning: analysis.reasoning,
    timestamp: new Date().toISOString(),
    vitals: input.vitals,
    symptoms: input.symptoms,
  };
  storedResults = [result, ...storedResults].slice(0, 50);
  return result;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await new Promise(r => setTimeout(r, 300));
  return {
    totalToday: storedResults.length,
    critical: storedResults.filter(r => r.priority === 'CRITICAL').length,
    moderate: storedResults.filter(r => r.priority === 'MODERATE').length,
    stable: storedResults.filter(r => r.priority === 'STABLE').length,
    recentEntries: storedResults.slice(0, 10),
  };
}
