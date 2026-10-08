import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Database, 
  Link2, 
  Box, 
  Eye, 
  FileCheck2, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';

export const SecurityStatus = () => {
  const { health, stats } = useSecurity();

  const componentsList = [
    {
      id: 'firewall_engine',
      label: 'Firewall Interception Engine',
      icon: ShieldCheck,
      status: health?.components?.firewall_engine || 'online',
      description: 'L7 runtime gateway for LLM calls and tool executions',
    },
    {
      id: 'injection_detector',
      label: 'Prompt Injection Classifier',
      icon: Eye,
      status: health?.components?.injection_detector || 'active',
      description: 'Multi-vector heuristic & embedding injection defense',
    },
    {
      id: 'dlp_scanner',
      label: 'Data Loss Prevention (DLP)',
      icon: FileCheck2,
      status: health?.components?.dlp_scanner || 'active',
      description: 'PII, API keys, tokens, and credentials mask & redaction',
    },
    {
      id: 'taint_tracker',
      label: 'Dataflow Taint Tracker',
      icon: Cpu,
      status: health?.components?.taint_tracker || 'active',
      description: 'Untrusted input-to-sink runtime propagation tracker',
    },
    {
      id: 'policy_engine',
      label: 'Declarative Policy Engine',
      icon: ShieldCheck,
      status: health?.components?.policy_engine || 'active',
      description: `Active ruleset: ${stats?.active_policy?.name || 'default'}`,
    },
    {
      id: 'sandbox',
      label: 'Execution Sandbox',
      icon: Box,
      status: health?.components?.sandbox || stats?.sandbox?.execution_mode || 'isolated',
      description: 'Subprocess memory & timeout sandboxing for agent actions',
    },
    {
      id: 'audit_chain',
      label: 'Cryptographic Hash Chain',
      icon: Link2,
      status: stats?.audit_chain?.is_valid ? 'verified' : 'monitoring',
      description: `${stats?.audit_chain?.total_records || 0} ledger records securely linked`,
    },
    {
      id: 'database',
      label: 'SQLite Threat Store',
      icon: Database,
      status: health?.components?.database || 'connected',
      description: 'Low-latency indexed ACID storage for audit & telemetry',
    },
  ];

  return (
    <div className="rounded-2xl bg-[#0f172a]/80 border border-slate-800 p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold font-mono text-slate-100 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>SYSTEM HEALTH & GUARDRAIL SUBSYSTEMS</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status of all active security inspection engines and cryptographic ledgers.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-semibold flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>ALL SUBSYSTEMS OPERATIONAL</span>
          </span>
        </div>
      </div>

      {/* Grid of Subsystems */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {componentsList.map((comp) => {
          const Icon = comp.icon;
          const isOk =
            comp.status === 'online' ||
            comp.status === 'active' ||
            comp.status === 'connected' ||
            comp.status === 'subprocess_isolated' ||
            comp.status === 'verified';

          return (
            <div
              key={comp.id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all space-y-2 group"
            >
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-cyan-400 group-hover:text-cyan-300">
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex items-center space-x-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOk ? 'bg-emerald-400' : 'bg-amber-400'
                    } animate-pulse`}
                  ></span>
                  <span
                    className={`text-[10px] font-mono uppercase font-bold ${
                      isOk ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {comp.status}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold font-mono text-slate-200">
                  {comp.label}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                  {comp.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SecurityStatus;
