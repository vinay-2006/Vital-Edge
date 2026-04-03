import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Zap } from 'lucide-react';
import VitalInput from '@/components/VitalInput';
import SymptomButton from '@/components/SymptomButton';
import { AmbulanceModeToggle } from '@/components/AmbulanceModeToggle';
import { apiClient } from '@/lib/api-client';
import { PatientInfo, VitalSigns, Symptoms, TriageInput as TriageInputType, Mode } from '@/lib/types';

const TriageInputPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('HOSPITAL');
  const [etaMinutes, setEtaMinutes] = useState(15);

  const [patient, setPatient] = useState<PatientInfo>({
    name: '',
    age: 0,
    gender: 'MALE',
  });

  const [vitals, setVitals] = useState({
    bpSystolic: '',
    bpDiastolic: '',
    pulse: '',
    temperature: '',
    spo2: '',
    respiratoryRate: '',
  });

  const [symptoms, setSymptoms] = useState<Symptoms>({
    chestPain: false,
    breathlessness: false,
    bleeding: false,
    unconscious: false,
    seizure: false,
    fever: false,
    abdomenPain: false,
    trauma: false,
    other: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateVital = (key: string) => (value: string) => {
    setVitals(prev => ({ ...prev, [key]: value }));
  };

  const toggleSymptom = (key: keyof Symptoms) => {
    if (key === 'other') return; // 'other' is a string field, not a boolean toggle
    setSymptoms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!patient.name.trim()) e.name = 'Patient name required';
    if (!patient.age || patient.age < 0 || patient.age > 150) e.age = 'Enter valid age (0-150)';
    if (!vitals.bpSystolic) e.bpSystolic = 'Systolic BP required';
    if (!vitals.bpDiastolic) e.bpDiastolic = 'Diastolic BP required';
    if (!vitals.pulse) e.pulse = 'Pulse required';
    if (!vitals.temperature) e.temperature = 'Temperature required';
    if (!vitals.spo2) e.spo2 = 'SpO₂ required';
    if (!vitals.respiratoryRate) e.respiratoryRate = 'Respiratory rate required';

    if (mode === 'AMBULANCE' && (!etaMinutes || etaMinutes < 1)) {
      e.eta = 'ETA required for ambulance mode';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // Convert string vitals to numbers
      const vitalSigns: VitalSigns = {
        bloodPressure: {
          systolic: parseFloat(vitals.bpSystolic),
          diastolic: parseFloat(vitals.bpDiastolic),
        },
        pulse: parseFloat(vitals.pulse),
        temperature: parseFloat(vitals.temperature),
        spo2: parseFloat(vitals.spo2),
        respiratoryRate: parseFloat(vitals.respiratoryRate),
      };

      const triageInput: TriageInputType = {
        patient,
        vitals: vitalSigns,
        symptoms,
        mode,
        ...(mode === 'AMBULANCE' && { etaMinutes }),
      };

      const result = await apiClient.submitTriage(triageInput);
      navigate('/result', { state: { result } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Triage failed. Please try again.';
      setErrors({ submit: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-5">
      {/* Ambulance Mode Toggle */}
      <AmbulanceModeToggle
        mode={mode}
        etaMinutes={etaMinutes}
        onModeChange={setMode}
        onEtaChange={setEtaMinutes}
      />

      {/* Patient Info */}
      <section className="bg-card rounded-xl p-4 shadow-sm border border-border">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Patient Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-muted-foreground">Name</label>
            <input
              type="text"
              value={patient.name}
              onChange={e => setPatient(p => ({ ...p, name: e.target.value }))}
              placeholder="Patient name"
              className={`h-14 text-lg font-semibold rounded-lg border-2 px-4 bg-surface-elevated text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${errors.name ? 'border-triage-critical' : 'border-border'}`}
            />
            {errors.name && <p className="text-xs triage-critical-text font-medium">{errors.name}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-muted-foreground">Age</label>
            <input
              type="number"
              inputMode="numeric"
              value={patient.age || ''}
              onChange={e => setPatient(p => ({ ...p, age: parseInt(e.target.value) || 0 }))}
              placeholder="Age"
              className={`h-14 text-lg font-semibold rounded-lg border-2 px-4 bg-surface-elevated text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${errors.age ? 'border-triage-critical' : 'border-border'}`}
            />
            {errors.age && <p className="text-xs triage-critical-text font-medium">{errors.age}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-muted-foreground">Gender</label>
            <select
              value={patient.gender}
              onChange={e => setPatient(p => ({ ...p, gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER' }))}
              className="h-14 text-lg font-semibold rounded-lg border-2 border-border px-4 bg-surface-elevated text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </section>

      {/* Vitals */}
      <section className="bg-card rounded-xl p-4 shadow-sm border border-border">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Vitals</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <VitalInput label="BP (Systolic)" unit="mmHg" value={vitals.bpSystolic} onChange={updateVital('bpSystolic')} placeholder="120" error={errors.bpSystolic} />
          <VitalInput label="BP (Diastolic)" unit="mmHg" value={vitals.bpDiastolic} onChange={updateVital('bpDiastolic')} placeholder="80" error={errors.bpDiastolic} />
          <VitalInput label="Pulse" unit="bpm" value={vitals.pulse} onChange={updateVital('pulse')} placeholder="72" error={errors.pulse} />
          <VitalInput label="Temperature" unit="°C" value={vitals.temperature} onChange={updateVital('temperature')} placeholder="37.0" error={errors.temperature} />
          <VitalInput label="SpO₂" unit="%" value={vitals.spo2} onChange={updateVital('spo2')} placeholder="98" error={errors.spo2} />
          <VitalInput label="Respiratory Rate" unit="/min" value={vitals.respiratoryRate} onChange={updateVital('respiratoryRate')} placeholder="16" error={errors.respiratoryRate} />
        </div>
      </section>

      {/* Symptoms */}
      <section className="bg-card rounded-xl p-4 shadow-sm border border-border">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Symptoms</h2>
        <div className="flex flex-wrap gap-2">
          <SymptomButton label="Chest Pain" selected={symptoms.chestPain} onToggle={() => toggleSymptom('chestPain')} />
          <SymptomButton label="Breathlessness" selected={symptoms.breathlessness} onToggle={() => toggleSymptom('breathlessness')} />
          <SymptomButton label="Bleeding" selected={symptoms.bleeding} onToggle={() => toggleSymptom('bleeding')} />
          <SymptomButton label="Unconscious" selected={symptoms.unconscious} onToggle={() => toggleSymptom('unconscious')} />
          <SymptomButton label="Seizure" selected={symptoms.seizure} onToggle={() => toggleSymptom('seizure')} />
          <SymptomButton label="Fever" selected={symptoms.fever} onToggle={() => toggleSymptom('fever')} />
          <SymptomButton label="Abdominal Pain" selected={symptoms.abdomenPain} onToggle={() => toggleSymptom('abdomenPain')} />
          <SymptomButton label="Trauma" selected={symptoms.trauma} onToggle={() => toggleSymptom('trauma')} />
        </div>
        <div className="mt-3">
          <label className="text-sm font-semibold text-muted-foreground">Other Symptoms</label>
          <input
            type="text"
            value={symptoms.other || ''}
            onChange={e => setSymptoms(prev => ({ ...prev, other: e.target.value }))}
            placeholder="Describe any other symptoms..."
            className="w-full h-12 rounded-lg border-2 border-border px-4 bg-surface-elevated text-foreground focus:outline-none focus:ring-2 focus:ring-primary mt-1"
          />
        </div>
      </section>

      {/* Submit */}
      {errors.submit && <p className="text-center text-sm triage-critical-text font-semibold">{errors.submit}</p>}
      {errors.eta && <p className="text-center text-sm triage-critical-text font-semibold">{errors.eta}</p>}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full h-16 rounded-xl bg-primary text-primary-foreground text-lg font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-60 min-h-[48px]"
      >
        {loading ? (
          <>
            <Loader2 size={22} className="animate-spin" />
            Analyzing…
          </>
        ) : (
          <>
            <Zap size={22} />
            Run Triage
          </>
        )}
      </button>
    </div>
  );
};

export default TriageInputPage;
