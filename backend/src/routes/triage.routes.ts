import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../config/database';
import { triageEngine } from '../services/triageEngine';
import { explainabilityService } from '../services/explainability';
import { riskAssessmentService } from '../services/riskAssessment';
import { auditLoggerService } from '../services/auditLogger';
import { TriageInput, TriageResult } from '../models/types';

const router = Router();

// Validation schema for triage input
const triageInputSchema = z.object({
  patient: z.object({
    name: z.string().min(1),
    age: z.number().min(0).max(150),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  }),
  vitals: z.object({
    bloodPressure: z.object({
      systolic: z.number().min(40).max(300),
      diastolic: z.number().min(20).max(200),
    }),
    pulse: z.number().min(20).max(250),
    temperature: z.number().min(30).max(45),
    spo2: z.number().min(50).max(100),
    respiratoryRate: z.number().min(4).max(60),
  }),
  symptoms: z.object({
    chestPain: z.boolean(),
    breathlessness: z.boolean(),
    bleeding: z.boolean(),
    unconscious: z.boolean(),
    seizure: z.boolean(),
    fever: z.boolean(),
    abdomenPain: z.boolean(),
    trauma: z.boolean(),
    other: z.string().optional(),
  }),
  mode: z.enum(['HOSPITAL', 'AMBULANCE']),
  etaMinutes: z.number().min(1).max(300).optional(),
  operatorName: z.string().optional(),
});

/**
 * POST /api/triage
 * Submit a new triage case
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validatedInput = triageInputSchema.parse(req.body);
    const input: TriageInput = validatedInput;

    // Calculate triage using AI engine
    const triageResult = triageEngine.calculateTriage(input);

    // Generate explainability
    const explainability = explainabilityService.generateExplainability(
      triageResult.priority,
      triageResult.score,
      input
    );

    // Assess deterioration risk
    const riskAssessment = riskAssessmentService.assessRisk(
      triageResult.priority,
      triageResult.score,
      input
    );

    // Handle ambulance mode
    let alertSentAt: string | undefined;
    if (input.mode === 'AMBULANCE') {
      alertSentAt = new Date().toISOString();
    }

    // Prepare database record
    const supabase = getSupabaseClient();
    const dbRecord = {
      priority: triageResult.priority,
      confidence_score: triageResult.confidence,
      total_score: triageResult.score.totalScore,
      vital_score: triageResult.score.vitalScore,
      symptom_score: triageResult.score.symptomScore,
      score_breakdown: triageResult.score.breakdown,
      reasoning: explainability.reasoning,
      why_not_red: explainability.whyNotRed,
      why_not_green: explainability.whyNotGreen,
      bias_note: explainability.biasNote,
      deterioration_risk: riskAssessment.deteriorationRisk,
      risk_timeframe: riskAssessment.riskTimeframe,
      risk_indicators: riskAssessment.riskIndicators,
      preparation_notes: riskAssessment.preparationNotes,
      patient_name: input.patient.name,
      patient_age: input.patient.age,
      patient_gender: input.patient.gender,
      bp_systolic: input.vitals.bloodPressure.systolic,
      bp_diastolic: input.vitals.bloodPressure.diastolic,
      pulse: input.vitals.pulse,
      temperature: input.vitals.temperature,
      spo2: input.vitals.spo2,
      respiratory_rate: input.vitals.respiratoryRate,
      chest_pain: input.symptoms.chestPain,
      breathlessness: input.symptoms.breathlessness,
      bleeding: input.symptoms.bleeding,
      unconscious: input.symptoms.unconscious,
      seizure: input.symptoms.seizure,
      fever: input.symptoms.fever,
      abdomen_pain: input.symptoms.abdomenPain,
      trauma: input.symptoms.trauma,
      other_symptoms: input.symptoms.other || null,
      mode: input.mode,
      eta_minutes: input.etaMinutes || null,
      alert_sent_at: alertSentAt || null,
      operator_name: input.operatorName || null,
      is_overridden: false,
      override_reason: null,
    };

    // Insert into database
    const { data, error } = await supabase
      .from('triage_records')
      .insert(dbRecord)
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      res.status(500).json({ error: 'Failed to save triage record' });
      return;
    }

    // Log audit event
    await auditLoggerService.logTriageCreated(
      data.id,
      triageResult.priority,
      input.mode,
      input.operatorName
    );

    // Construct response
    const result: TriageResult = {
      id: data.id,
      priority: triageResult.priority,
      confidence: triageResult.confidence,
      score: triageResult.score,
      explainability,
      riskAssessment,
      patient: input.patient,
      vitals: input.vitals,
      symptoms: input.symptoms,
      mode: input.mode,
      etaMinutes: input.etaMinutes,
      alertSentAt,
      operatorName: input.operatorName,
      createdAt: data.created_at,
      isOverridden: false,
    };

    res.status(201).json(result);
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    console.error('Triage submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

/**
 * GET /api/triage/:id
 * Retrieve a specific triage record
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('triage_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Triage record not found' });
      return;
    }

    // Map database record to TriageResult
    const result: TriageResult = {
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
    };

    res.json(result);
    return;
  } catch (error) {
    console.error('Fetch triage error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

/**
 * POST /api/triage/:id/override
 * Override the priority of a triage record
 */
router.post('/:id/override', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const overrideSchema = z.object({
      newPriority: z.enum(['RED', 'YELLOW', 'GREEN']),
      reason: z.string().min(5),
      operatorName: z.string().optional(),
    });

    const { newPriority, reason, operatorName } = overrideSchema.parse(req.body);
    const supabase = getSupabaseClient();

    // Fetch current record
    const { data: currentRecord, error: fetchError } = await supabase
      .from('triage_records')
      .select('priority')
      .eq('id', id)
      .single();

    if (fetchError || !currentRecord) {
      res.status(404).json({ error: 'Triage record not found' });
      return;
    }

    const oldPriority = currentRecord.priority;

    // Update record
    const { data, error } = await supabase
      .from('triage_records')
      .update({
        priority: newPriority,
        is_overridden: true,
        override_reason: reason,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: 'Failed to override priority' });
      return;
    }

    // Log audit event
    await auditLoggerService.logPriorityOverride(
      id,
      oldPriority,
      newPriority,
      reason,
      operatorName
    );

    // Return updated record (same mapping as GET endpoint)
    const result: TriageResult = {
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
    };

    res.json(result);
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    console.error('Override error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

export default router;
