import { Check } from 'lucide-react';

interface SymptomButtonProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}

const SymptomButton = ({ label, selected, onToggle }: SymptomButtonProps) => (
  <button
    type="button"
    onClick={onToggle}
    className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 font-semibold text-sm transition-all min-h-[48px] ${
      selected
        ? 'border-primary bg-primary text-primary-foreground'
        : 'border-border bg-surface-elevated text-foreground hover:border-primary/50'
    }`}
    role="checkbox"
    aria-checked={selected}
  >
    {selected && <Check size={16} strokeWidth={3} />}
    {label}
  </button>
);

export default SymptomButton;
