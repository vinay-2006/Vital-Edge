import { TriagePriority } from './types';

export const priorityConfig: Record<TriagePriority, { label: string; className: string; bgSoft: string; textClass: string }> = {
  CRITICAL: { label: 'CRITICAL', className: 'triage-critical', bgSoft: 'triage-critical-bg-soft', textClass: 'triage-critical-text' },
  MODERATE: { label: 'MODERATE', className: 'triage-moderate', bgSoft: 'triage-moderate-bg-soft', textClass: 'triage-moderate-text' },
  STABLE: { label: 'STABLE', className: 'triage-stable', bgSoft: 'triage-stable-bg-soft', textClass: 'triage-stable-text' },
};

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Today ${timeStr}`;
  if (isYesterday) return `Yesterday ${timeStr}`;
  // fallback for any edge case
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + timeStr;
}
