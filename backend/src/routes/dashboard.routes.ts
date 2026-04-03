import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../config/database';
import { DashboardSummary, TriageResult } from '../models/types';

const router = Router();

/**
 * GET /api/dashboard/summary
 * Get dashboard summary with today's statistics
 */
router.get('/summary', async (_req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabaseClient();

    // Get yesterday's midnight (start of yesterday) to cover today + yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayStr = yesterday.toISOString();

    // Query all records from yesterday onwards (today + yesterday)
    const { data: records, error } = await supabase
      .from('triage_records')
      .select('*')
      .gte('created_at', yesterdayStr)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Dashboard query error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
      return;
    }

    const allRecords = records || [];

    // Calculate statistics
    const totalToday = allRecords.length;
    const red = allRecords.filter((r) => r.priority === 'RED').length;
    const yellow = allRecords.filter((r) => r.priority === 'YELLOW').length;
    const green = allRecords.filter((r) => r.priority === 'GREEN').length;

    const averageConfidence =
      totalToday > 0
        ? Math.round(
            allRecords.reduce((sum, r) => sum + r.confidence_score, 0) / totalToday
          )
        : 0;

    const highRiskCount = allRecords.filter(
      (r) => r.deterioration_risk === 'HIGH'
    ).length;

    const ambulanceModeCount = allRecords.filter((r) => r.mode === 'AMBULANCE').length;

    // Get recent 30 entries (today + yesterday) and map to TriageResult
    const recentEntries: TriageResult[] = allRecords.slice(0, 30).map((data) => ({
      id: data.id,
      priority: data.priority,
      confidence: data.confidence_score,
      score: {
        totalScore: data.total_score,
        vitalScore: data.vital_score,
        symptomScore: data.symptom_score,
        breakdown: data.score_breakdown,
      },
      explainability: {
        reasoning: data.reasoning,
        whyNotRed: data.why_not_red,
        whyNotGreen: data.why_not_green,
        biasNote: data.bias_note,
      },
      riskAssessment: {
        deteriorationRisk: data.deterioration_risk,
        riskTimeframe: data.risk_timeframe,
        riskIndicators: data.risk_indicators,
        preparationNotes: data.preparation_notes,
      },
      patient: {
        name: data.patient_name,
        age: data.patient_age,
        gender: data.patient_gender,
      },
      vitals: {
        bloodPressure: {
          systolic: data.bp_systolic,
          diastolic: data.bp_diastolic,
        },
        pulse: data.pulse,
        temperature: data.temperature,
        spo2: data.spo2,
        respiratoryRate: data.respiratory_rate,
      },
      symptoms: {
        chestPain: data.chest_pain,
        breathlessness: data.breathlessness,
        bleeding: data.bleeding,
        unconscious: data.unconscious,
        seizure: data.seizure,
        fever: data.fever,
        abdomenPain: data.abdomen_pain,
        trauma: data.trauma,
        other: data.other_symptoms,
      },
      mode: data.mode,
      etaMinutes: data.eta_minutes,
      alertSentAt: data.alert_sent_at,
      operatorName: data.operator_name,
      createdAt: data.created_at,
      isOverridden: data.is_overridden,
      overrideReason: data.override_reason,
    }));

    const summary: DashboardSummary = {
      totalToday,
      red,
      yellow,
      green,
      averageConfidence,
      highRiskCount,
      ambulanceModeCount,
      recentEntries,
    };

    res.json(summary);
    return;
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

export default router;
