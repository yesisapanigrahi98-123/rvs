import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Link2, 
  Crosshair, 
  FileCode2, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Play
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { useDashboard } from '../hooks/useDashboard';
import firewallService from '../services/firewallService';
import DashboardCard from '../components/DashboardCard';
import SecurityStatus from '../components/SecurityStatus';
import ThreatChart from '../components/ThreatChart';
import ActivityTable from '../components/ActivityTable';
import ThreatCard from '../components/ThreatCard';
import FirewallInterceptorSimulator from '../components/simulator/FirewallInterceptorSimulator';
import ErrorBoundary from '../components/ErrorBoundary';
import { formatPercentage } from '../utils/formatters';

export const Dashboard = ({ onNavigate }) => {
  const { stats, health, refresh, addNotification } = useSecurity();
  const { recentThreats, loading: threatsLoading, refetch: refetchThreats } = useDashboard();


  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Welcome */}
      <div className="relative rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 p-6 shadow-glow-cyan overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-cyan-500/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                ACTIVE DEFENSE GRID
              </span>
              <span className="text-xs text-slate-400 font-mono">
                RUNTIME GUARDRAILS v1.0.0
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              SENTINELFLOW SECURITY COMMAND CENTER
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl font-sans">
              Autonomous multi-vector guardrail engine defending AI agents against prompt injection, data exfiltration, unauthorized tool calls, and jailbreaks.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate && onNavigate('firewall')}
              className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-black shadow-glow-cyan transition-all flex items-center space-x-2"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>TEST GATEWAY</span>
            </button>
            <button
              onClick={() => onNavigate && onNavigate('attacks')}
              className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center space-x-2"
            >
              <Crosshair className="w-4 h-4 text-rose-400" />
              <span>RUN BENCHMARK</span>
            </button>
          </div>
        </div>
      </div>

      {/* Holistic Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <DashboardCard
          title="Total Inspections"
          value={stats?.overview?.total_inspections ?? 0}
          subvalue="Interception requests"
          icon={Activity}
          variant="cyan"
          badge="REAL-TIME"
        />

        <DashboardCard
          title="Blocked Threats"
          value={stats?.overview?.blocked_threats ?? 0}
          subvalue="Adversarial payloads"
          icon={ShieldAlert}
          variant="crimson"
          trend={{ type: 'down', label: 'Neutralized' }}
        />

        <DashboardCard
          title="Defense Efficacy"
          value={formatPercentage(stats?.overview?.defense_efficacy_rate ?? 100)}
          subvalue="Intervention accuracy"
          icon={ShieldCheck}
          variant="emerald"
          badge="PASS"
        />

        <DashboardCard
          title="Audit Hash Chain"
          value={stats?.audit_chain?.status || 'HEALTHY'}
          subvalue={`${stats?.audit_chain?.total_records ?? 0} blocks verified`}
          icon={Link2}
          variant={stats?.audit_chain?.is_valid ? 'emerald' : 'crimson'}
        />

        <DashboardCard
          title="Red Team ASR"
          value={formatPercentage(stats?.latest_redteam_benchmark?.asr_score ?? 0)}
          subvalue="Attack Success Rate"
          icon={Crosshair}
          variant={stats?.latest_redteam_benchmark?.asr_score > 0 ? 'amber' : 'emerald'}
        />

        <DashboardCard
          title="Active Policy"
          value={(stats?.active_policy?.name || 'default').toUpperCase()}
          subvalue="Runtime protection"
          icon={FileCode2}
          variant="purple"
          onClick={() => onNavigate && onNavigate('policies')}
        />
      </div>

      {/* Live Firewall Interceptor Simulator with Security Override & Audit Timeline */}
      <ErrorBoundary>
        <FirewallInterceptorSimulator
          onRefreshTelemetry={async () => {
            await refresh?.();
            await refetchThreats?.();
          }}
          addNotification={addNotification}
        />
      </ErrorBoundary>

      {/* Threat Vector Distribution Chart */}
      <ThreatChart
        threatCategories={stats?.threat_categories || {}}
        severityDistribution={stats?.severity_distribution || {}}
      />

      {/* Component Level Health Grid */}
      <SecurityStatus />

      {/* Recent Interception Activity Table */}
      <ActivityTable
        events={recentThreats}
        loading={threatsLoading}
        onRefresh={refetchThreats}
      />
    </div>
  );
};

export default Dashboard;
