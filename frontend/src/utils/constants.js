export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const SEVERITY_COLORS = {
  CRITICAL: {
    bg: 'bg-rose-950/40',
    border: 'border-rose-500/50',
    text: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    glow: 'shadow-glow-crimson',
    accent: '#f43f5e',
  },
  HIGH: {
    bg: 'bg-red-950/40',
    border: 'border-red-500/50',
    text: 'text-red-400',
    badge: 'bg-red-500/20 text-red-300 border-red-500/40',
    glow: 'shadow-glow-crimson',
    accent: '#ef4444',
  },
  MEDIUM: {
    bg: 'bg-amber-950/40',
    border: 'border-amber-500/50',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]',
    accent: '#f59e0b',
  },
  LOW: {
    bg: 'bg-cyan-950/40',
    border: 'border-cyan-500/50',
    text: 'text-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    glow: 'shadow-glow-cyan',
    accent: '#06b6d4',
  },
  NONE: {
    bg: 'bg-slate-900/60',
    border: 'border-slate-700/50',
    text: 'text-slate-400',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    glow: '',
    accent: '#64748b',
  },
};

export const DECISION_COLORS = {
  BLOCK: {
    badge: 'bg-red-500/20 text-red-300 border-red-500/50',
    dot: 'bg-red-500',
    text: 'text-red-400',
  },
  ALLOW: {
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
    dot: 'bg-emerald-500',
    text: 'text-emerald-400',
  },
  SANITIZE: {
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    dot: 'bg-amber-500',
    text: 'text-amber-400',
  },
  REQUIRE_APPROVAL: {
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
    dot: 'bg-purple-500',
    text: 'text-purple-400',
  },
  ESCALATE: {
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
    dot: 'bg-orange-500',
    text: 'text-orange-400',
  },
};

export const THREAT_CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'direct_injection', label: 'Direct Prompt Injection' },
  { id: 'indirect_injection', label: 'Indirect Injection' },
  { id: 'jailbreak', label: 'Jailbreak & Bypass' },
  { id: 'data_exfiltration', label: 'DLP & Exfiltration' },
  { id: 'privilege_escalation', label: 'Privilege Escalation' },
  { id: 'taint_violation', label: 'Taint Flow Violation' },
  { id: 'unauthorized_tool', label: 'Tool Policy Breach' },
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Security Dashboard', path: '/', icon: 'LayoutDashboard' },
  { id: 'firewall', label: 'Firewall Gateway', path: '/firewall', icon: 'ShieldAlert' },
  { id: 'threats', label: 'Threat Intel', path: '/threats', icon: 'Radio' },
  { id: 'attacks', label: 'Red Team Benchmark', path: '/attacks', icon: 'Crosshair' },
  { id: 'policies', label: 'Security Policies', path: '/policies', icon: 'FileCode2' },
  { id: 'audit', label: 'Audit Trail & Chain', path: '/audit', icon: 'History' },
  { id: 'settings', label: 'System Settings', path: '/settings', icon: 'Sliders' },
];
