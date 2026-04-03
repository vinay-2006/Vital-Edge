import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../config/database';
import { csvExporterService } from '../services/csvExporter';
import { auditLoggerService } from '../services/auditLogger';
import { TriageResult } from '../models/types';

const router = Router();

/**
 * GET /api/export/csv
 * Export triage records to CSV
 */
router.get('/csv', async (req: Request, res: Response): Promise<void> => {
  try {
    const querySchema = z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      operatorName: z.string().optional(),
    });

    const { startDate, endDate, operatorName } = querySchema.parse(req.query);
    const supabase = getSupabaseClient();

    // Build query
    let query = supabase.from('triage_records').select('*').order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: records, error } = await query;

    if (error) {
      console.error('Export query error:', error);
      res.status(500).json({ error: 'Failed to fetch records for export' });
      return;
    }

    const allRecords = records || [];

    // Map to TriageResult
    const triageResults: TriageResult[] = allRecords.map((data) => ({
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

    // Generate CSV
    const csv = csvExporterService.exportToCsv(triageResults);
    const filename = csvExporterService.generateFilename();

    // Log audit event
    await auditLoggerService.logRecordExport(
      triageResults.length,
      startDate,
      endDate,
      operatorName
    );

    // Send CSV file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
      return;
    }
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

export default router;
