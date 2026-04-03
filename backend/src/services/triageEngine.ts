import { Priority, TriageInput, TriageScore, VitalSigns, Symptoms } from '../models/types';

interface ScoreBreakdown {
  category: string;
  points: number;
  reason: string;
}

export class TriageEngine {
  /**
   * Calculate vital signs score (0-40 points)
   */
  private calculateVitalScore(vitals: VitalSigns): { score: number; breakdown: ScoreBreakdown[] } {
    const breakdown: ScoreBreakdown[] = [];
    let score = 0;

    // SpO2 scoring
    if (vitals.spo2 < 85) {
      score += 15;
      breakdown.push({
        category: 'SpO₂',
        points: 15,
        reason: `Critical hypoxia: ${vitals.spo2}% (threshold: <85%)`,
      });
    } else if (vitals.spo2 < 90) {
      score += 10;
      breakdown.push({
        category: 'SpO₂',
        points: 10,
        reason: `Severe hypoxia: ${vitals.spo2}% (threshold: <90%)`,
      });
    } else if (vitals.spo2 < 94) {
      score += 5;
      breakdown.push({
        category: 'SpO₂',
        points: 5,
        reason: `Mild hypoxia: ${vitals.spo2}% (threshold: <94%)`,
      });
    }

    // Pulse scoring
    if (vitals.pulse > 140 || vitals.pulse < 40) {
      score += 12;
      breakdown.push({
        category: 'Pulse',
        points: 12,
        reason: `Critical heart rate: ${vitals.pulse} bpm (threshold: >140 or <40)`,
      });
    } else if (vitals.pulse > 120 || vitals.pulse < 50) {
      score += 7;
      breakdown.push({
        category: 'Pulse',
        points: 7,
        reason: `Abnormal heart rate: ${vitals.pulse} bpm (threshold: >120 or <50)`,
      });
    } else if (vitals.pulse > 100 || vitals.pulse < 60) {
      score += 3;
      breakdown.push({
        category: 'Pulse',
        points: 3,
        reason: `Elevated heart rate: ${vitals.pulse} bpm (threshold: >100 or <60)`,
      });
    }

    // Blood Pressure scoring (using systolic)
    if (vitals.bloodPressure.systolic > 200 || vitals.bloodPressure.systolic < 70) {
      score += 12;
      breakdown.push({
        category: 'Blood Pressure',
        points: 12,
        reason: `Critical BP: ${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg (threshold: >200 or <70 systolic)`,
      });
    } else if (vitals.bloodPressure.systolic > 180 || vitals.bloodPressure.systolic < 90) {
      score += 7;
      breakdown.push({
        category: 'Blood Pressure',
        points: 7,
        reason: `Severe hypertension/hypotension: ${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg (threshold: >180 or <90 systolic)`,
      });
    } else if (vitals.bloodPressure.systolic > 140 || vitals.bloodPressure.systolic < 100) {
      score += 3;
      breakdown.push({
        category: 'Blood Pressure',
        points: 3,
        reason: `Elevated BP: ${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg (threshold: >140 or <100 systolic)`,
      });
    }

    // Respiratory Rate scoring
    if (vitals.respiratoryRate > 30 || vitals.respiratoryRate < 8) {
      score += 10;
      breakdown.push({
        category: 'Respiratory Rate',
        points: 10,
        reason: `Critical respiratory distress: ${vitals.respiratoryRate} breaths/min (threshold: >30 or <8)`,
      });
    } else if (vitals.respiratoryRate > 24 || vitals.respiratoryRate < 10) {
      score += 5;
      breakdown.push({
        category: 'Respiratory Rate',
        points: 5,
        reason: `Abnormal respiratory rate: ${vitals.respiratoryRate} breaths/min (threshold: >24 or <10)`,
      });
    }

    // Temperature scoring
    if (vitals.temperature > 40) {
      score += 8;
      breakdown.push({
        category: 'Temperature',
        points: 8,
        reason: `Hyperpyrexia: ${vitals.temperature}°C (threshold: >40°C)`,
      });
    } else if (vitals.temperature > 39) {
      score += 4;
      breakdown.push({
        category: 'Temperature',
        points: 4,
        reason: `High fever: ${vitals.temperature}°C (threshold: >39°C)`,
      });
    } else if (vitals.temperature < 35) {
      score += 6;
      breakdown.push({
        category: 'Temperature',
        points: 6,
        reason: `Hypothermia: ${vitals.temperature}°C (threshold: <35°C)`,
      });
    }

    // Clamp vital score to stated max of 40
    return { score: Math.min(score, 40), breakdown };
  }

  /**
   * Calculate symptom score (0-40 points)
   */
  private calculateSymptomScore(symptoms: Symptoms): {
    score: number;
    breakdown: ScoreBreakdown[];
    hasRedFlag: boolean;
  } {
    const breakdown: ScoreBreakdown[] = [];
    let score = 0;
    let hasRedFlag = false;

    // RED FLAG symptoms (auto-escalate to RED priority)
    if (symptoms.unconscious) {
      score += 40;
      hasRedFlag = true;
      breakdown.push({
        category: 'Consciousness',
        points: 40,
        reason: 'Patient unconscious (RED FLAG - immediate intervention required)',
      });
    }

    if (symptoms.seizure) {
      score += 38;
      hasRedFlag = true;
      breakdown.push({
        category: 'Neurological',
        points: 38,
        reason: 'Active seizure (RED FLAG - emergency)',
      });
    }

    if (symptoms.chestPain) {
      score += 35;
      hasRedFlag = true;
      breakdown.push({
        category: 'Cardiac',
        points: 35,
        reason: 'Chest pain (RED FLAG - potential cardiac emergency)',
      });
    }

    // HIGH SEVERITY symptoms
    if (symptoms.breathlessness && !hasRedFlag) {
      score += 20;
      breakdown.push({
        category: 'Respiratory',
        points: 20,
        reason: 'Severe breathlessness (respiratory distress)',
      });
    }

    if (symptoms.trauma && !hasRedFlag) {
      score += 18;
      breakdown.push({
        category: 'Trauma',
        points: 18,
        reason: 'Major trauma reported (potential internal injuries)',
      });
    }

    // MODERATE SEVERITY symptoms
    if (symptoms.bleeding && !hasRedFlag) {
      score += 10;
      breakdown.push({
        category: 'Hemorrhage',
        points: 10,
        reason: 'Active bleeding reported',
      });
    }

    if (symptoms.fever && !hasRedFlag) {
      score += 8;
      breakdown.push({
        category: 'Infection',
        points: 8,
        reason: 'Fever present (potential infection)',
      });
    }

    if (symptoms.abdomenPain && !hasRedFlag) {
      score += 7;
      breakdown.push({
        category: 'Abdominal',
        points: 7,
        reason: 'Abdominal pain (requires evaluation)',
      });
    }

    if (symptoms.other && !hasRedFlag) {
      score += 5;
      breakdown.push({
        category: 'Other',
        points: 5,
        reason: `Additional symptoms: ${symptoms.other}`,
      });
    }

    // Clamp symptom score to stated max of 40
    return { score: Math.min(score, 40), breakdown, hasRedFlag };
  }

  /**
   * Calculate confidence score based on completeness and score certainty
   */
  private calculateConfidence(totalScore: number, vitalScore: number, symptomScore: number): number {
    // Base confidence: 70%
    let confidence = 70;

    // Add confidence based on total score strength (up to 20%)
    // Higher scores = more certainty about severity
    confidence += (totalScore / 100) * 20;

    // Add confidence if both vital and symptom data contribute (up to 10%)
    if (vitalScore > 0 && symptomScore > 0) {
      confidence += 10;
    }

    // Cap at 98% (never 100% to maintain humility in AI decisions)
    return Math.min(Math.round(confidence), 98);
  }

  /**
   * Determine priority based on total score and red flags
   */
  private determinePriority(totalScore: number, hasRedFlag: boolean): Priority {
    if (hasRedFlag || totalScore >= 60) {
      return 'RED';
    } else if (totalScore >= 30) {
      return 'YELLOW';
    } else {
      return 'GREEN';
    }
  }

  /**
   * Main triage calculation method
   */
  public calculateTriage(input: TriageInput): {
    priority: Priority;
    confidence: number;
    score: TriageScore;
  } {
    // Calculate vital signs score
    const vitalResult = this.calculateVitalScore(input.vitals);

    // Calculate symptom score
    const symptomResult = this.calculateSymptomScore(input.symptoms);

    // Calculate total score
    const totalScore = vitalResult.score + symptomResult.score;

    // Combine breakdowns
    const breakdown = [...vitalResult.breakdown, ...symptomResult.breakdown];

    // Determine priority
    const priority = this.determinePriority(totalScore, symptomResult.hasRedFlag);

    // Calculate confidence
    const confidence = this.calculateConfidence(totalScore, vitalResult.score, symptomResult.score);

    return {
      priority,
      confidence,
      score: {
        totalScore,
        vitalScore: vitalResult.score,
        symptomScore: symptomResult.score,
        breakdown,
      },
    };
  }
}

export const triageEngine = new TriageEngine();
