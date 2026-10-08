/**
 * Helper utilities for class names, threat analysis, JSON copy, and color styling
 */
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SEVERITY_COLORS, DECISION_COLORS } from './constants';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getSeverityStyle(severity = 'NONE') {
  const norm = (severity || 'NONE').toUpperCase();
  return SEVERITY_COLORS[norm] || SEVERITY_COLORS.NONE;
}

export function getDecisionStyle(decision = 'ALLOW') {
  const norm = (decision || 'ALLOW').toUpperCase();
  return DECISION_COLORS[norm] || DECISION_COLORS.ALLOW;
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}

export function downloadJsonFile(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
