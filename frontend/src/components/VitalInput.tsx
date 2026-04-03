interface VitalInputProps {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}

const VitalInput = ({ label, unit, value, onChange, placeholder, error }: VitalInputProps) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-semibold text-muted-foreground">{label}</label>
    <div className="relative">
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-14 text-xl font-semibold rounded-lg border-2 px-4 pr-16 bg-surface-elevated text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${error ? 'border-triage-critical' : 'border-border'}`}
        aria-label={label}
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">{unit}</span>
    </div>
    {error && <p className="text-xs triage-critical-text font-medium" role="alert">{error}</p>}
  </div>
);

export default VitalInput;
