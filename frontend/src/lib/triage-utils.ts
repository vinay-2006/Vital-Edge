import { TriagePriority } from './types';

export const priorityConfig: Record<TriagePriority, { label: string; className: string; bgSoft: string; textClass: string }> = {
  CRITICAL: { label: 'CRITICAL', className: 'triage-critical', bgSoft: 'triage-critical-bg-soft', textClass: 'triage-critical-text' },
  MODERATE: { label: 'MODERATE', className: 'triage-moderate', bgSoft: 'triage-moderate-bg-soft', textClass: 'triage-moderate-text' },
  STABLE: { label: 'STABLE', className: 'triage-stable', bgSoft: 'triage-stable-bg-soft', textClass: 'triage-stable-text' },
};

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
