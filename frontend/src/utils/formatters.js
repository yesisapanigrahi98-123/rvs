/**
 * Utility formatters for timestamps, rates, latency, and numbers
 */

export function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return isoString;
  }
}

export function formatRelativeTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);

    if (diffSec < 5) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  } catch {
    return isoString;
  }
}

export function formatPercentage(val, decimals = 1) {
  if (val === null || val === undefined) return '0%';
  const num = typeof val === 'number' ? val : parseFloat(val);
  return `${num.toFixed(decimals)}%`;
}

export function formatLatency(ms) {
  if (ms === null || ms === undefined) return '0.0ms';
  const num = typeof ms === 'number' ? ms : parseFloat(ms);
  if (num < 1) return `${(num * 1000).toFixed(0)}µs`;
  return `${num.toFixed(1)}ms`;
}

export function formatHash(hash, length = 12) {
  if (!hash) return '0x000...';
  if (hash.length <= length * 2) return hash;
  return `${hash.slice(0, length)}...${hash.slice(-length)}`;
}

export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('en-US').format(num);
}
