import {
  Priority,
  DeteriorationRisk,
  TriageInput,
  TriageScore,
  RiskAssessment,
} from '../models/types';

export class RiskAssessmentService {
  /**
   * Calculate deterioration risk level
   */
  private calculateDeteriorationRisk(
    priority: Priority,
    score: TriageScore,
    input: TriageInput
  ): DeteriorationRisk {
    // RED priority with multiple critical factors = HIGH risk
    if (priority === 'RED') {
      const criticalFactors = score.breakdown.filter((item) => item.points >= 15).length;
      if (criticalFactors >= 2 || score.totalScore >= 75) {
        return 'HIGH';
      }
      return 'MEDIUM';
    }

    // YELLOW priority with trending indicators = MEDIUM risk
    if (priority === 'YELLOW') {
      // Check for progressive conditions
      if (input.symptoms.breathlessness || input.vitals.spo2 < 92) {
        return 'MEDIUM';
      }
      if (input.symptoms.bleeding || input.symptoms.trauma) {
        return 'MEDIUM';
      }
      return 'LOW';
    }

    // GREEN priority = LOW risk (but monitor)
    return 'LOW';
  }

  /**
   * Estimate timeframe for potential deterioration
   */
  private estimateRiskTimeframe(risk: DeteriorationRisk, input: TriageInput): string {
    if (risk === 'HIGH') {
      // Critical conditions can deteriorate rapidly
      if (input.symptoms.unconscious || input.vitals.spo2 < 85) {
        return '5-15 minutes';
      }
      return '15-30 minutes';
    }

    if (risk === 'MEDIUM') {
      // Moderate conditions may worsen within an hour
      if (input.symptoms.breathlessness || input.symptoms.chestPain) {
        return '30-60 minutes';
      }
      return '1-2 hours';
    }

    // Low risk conditions are generally stable
    return '> 2 hours';
  }

  /**
   * Identify specific risk indicators
   */
  private identifyRiskIndicators(
    input: TriageInput
  ): string[] {
    const indicators: string[] = [];

    // Hypoxia progression risk
    if (input.vitals.spo2 < 94) {
      indicators.push('Hypoxia progression risk - monitor O₂ saturation closely');
    }

    // Cardiac instability
    if (
      input.symptoms.chestPain ||
      input.vitals.pulse > 120 ||
      input.vitals.pulse < 50
    ) {
      indicators.push('Cardiac instability - potential arrhythmia or infarction');
    }

    // Hemodynamic instability
    if (
      input.vitals.bloodPressure.systolic > 180 ||
      input.vitals.bloodPressure.systolic < 90
    ) {
      indicators.push('Hemodynamic instability - BP fluctuation risk');
    }

    // Respiratory failure risk
    if (input.symptoms.breathlessness || input.vitals.respiratoryRate > 24) {
      indicators.push('Respiratory failure risk - prepare for ventilation support');
    }

    // Hemorrhagic shock risk
    if (input.symptoms.bleeding || input.symptoms.trauma) {
      indicators.push('Hemorrhagic shock risk - monitor vital signs and perfusion');
    }

    // Neurological deterioration
    if (input.symptoms.unconscious || input.symptoms.seizure) {
      indicators.push('Neurological deterioration - GCS monitoring required');
    }

    // Septic shock risk
    if (
      input.symptoms.fever &&
      (input.vitals.pulse > 100 || input.vitals.bloodPressure.systolic < 100)
    ) {
      indicators.push('Septic shock risk - infection with hemodynamic compromise');
    }

    // Hypothermia complications
    if (input.vitals.temperature < 35) {
      indicators.push('Hypothermia complications - rewarming protocols needed');
    }

    // If no specific indicators, add general monitoring
    if (indicators.length === 0) {
      indicators.push('General patient monitoring - vital signs trending stable');
    }

    return indicators;
  }

  /**
   * Generate preparation notes for medical staff
   */
  private generatePreparationNotes(
    priority: Priority,
    risk: DeteriorationRisk,
    input: TriageInput
  ): string[] {
    const notes: string[] = [];

    // Equipment preparation based on priority
    if (priority === 'RED') {
      notes.push('🚨 CRITICAL: Prepare resuscitation bay immediately');

      if (input.vitals.spo2 < 90 || input.symptoms.breathlessness) {
        notes.push('Equipment: High-flow oxygen, bag-valve mask, intubation kit');
      }

      if (input.symptoms.chestPain) {
        notes.push('Equipment: ECG monitor, defibrillator, cardiac crash cart');
      }

      if (input.symptoms.unconscious) {
        notes.push('Equipment: Airway management kit, suction, IV access');
      }

      if (input.symptoms.bleeding || input.symptoms.trauma) {
        notes.push('Equipment: Hemorrhage control kit, blood products, fluid warmers');
      }
    }

    if (priority === 'YELLOW') {
      notes.push('⚠️ URGENT: Prepare treatment room with monitoring');

      if (input.vitals.spo2 < 94) {
        notes.push('Equipment: Nasal cannula, pulse oximeter, oxygen supply');
      }

      if (input.symptoms.fever) {
        notes.push('Medications: Antipyretics, IV fluids, blood culture kit');
      }

      if (input.symptoms.abdomenPain) {
        notes.push('Imaging: Prepare for abdominal ultrasound or CT scan');
      }
    }

    if (priority === 'GREEN') {
      notes.push('✅ STABLE: Standard examination room suitable');
      notes.push('Equipment: Basic vitals monitoring, routine examination tools');
    }

    // Team alerts based on risk
    if (risk === 'HIGH') {
      notes.push('Alert: Senior physician, specialist consult on standby');
    }

    // Specialty team alerts
    if (input.symptoms.chestPain || input.vitals.pulse > 140) {
      notes.push('Team: Cardiology consultation recommended');
    }

    if (input.symptoms.trauma) {
      notes.push('Team: Trauma surgery team notification');
    }

    if (input.symptoms.unconscious || input.symptoms.seizure) {
      notes.push('Team: Neurology consultation, CT scan coordination');
    }

    // Lab preparation
    if (priority !== 'GREEN') {
      notes.push('Labs: CBC, electrolytes, lactate, blood gas (as indicated)');
    }

    // Ambulance mode specific
    if (input.mode === 'AMBULANCE' && input.etaMinutes) {
      notes.push(`⏱️ ETA: ${input.etaMinutes} minutes - prepare receiving team`);
    }

    return notes;
  }

  /**
   * Generate complete risk assessment
   */
  public assessRisk(
    priority: Priority,
    score: TriageScore,
    input: TriageInput
  ): RiskAssessment {
    const deteriorationRisk = this.calculateDeteriorationRisk(priority, score, input);
    const riskTimeframe = this.estimateRiskTimeframe(deteriorationRisk, input);
    const riskIndicators = this.identifyRiskIndicators(input);
    const preparationNotes = this.generatePreparationNotes(priority, deteriorationRisk, input);

    return {
      deteriorationRisk,
      riskTimeframe,
      riskIndicators,
      preparationNotes,
    };
  }
}

export const riskAssessmentService = new RiskAssessmentService();
