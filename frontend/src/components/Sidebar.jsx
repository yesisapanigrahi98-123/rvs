import React from 'react';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Radio, 
  Crosshair, 
  FileCode2, 
  History, 
  Sliders, 
  ShieldCheck,
  ChevronRight,
  Terminal,
  Activity
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';

export const Sidebar = ({ activePage, setActivePage }) => {
  const { stats, health, activePolicy } = useSecurity();

  const menuItems = [
    { id: 'dashboard', label: 'Security Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'firewall', label: 'Firewall Gateway', icon: ShieldAlert, badge: 'ACTIVE' },
    { id: 'threats', label: 'Threat Intel', icon: Radio, badge: stats?.overview?.blocked_threats ? `${stats.overview.blocked_threats}` : null },
    { id: 'attacks', label: 'Red Team Benchmark', icon: Crosshair, badge: 'TEST' },
    { id: 'policies', label: 'Security Policies', icon: FileCode2, badge: null },
    { id: 'audit', label: 'Audit Trail & Chain', icon: History, badge: stats?.audit_chain?.status === 'HEALTHY' ? 'OK' : 'ALERT' },
    { id: 'settings', label: 'System Settings', icon: Sliders, badge: null },
  ];

  return (
    <aside className="w-64 bg-[#090d16] border-r border-slate-800/80 flex flex-col h-screen select-none shrink-0 sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center space-x-3">
        <div className="relative group">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-cyan-500/50 shadow-glow-cyan flex items-center justify-center transition-transform group-hover:scale-105">
            <img src="/logo.png" alt="SentinelFlow Logo" className="w-8 h-8 object-contain" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#090d16] rounded-full"></span>
        </div>

        <div>
          <div className="flex items-center space-x-1.5">
            <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              SENTINELFLOW
            </span>
          </div>
          <div className="text-[10px] font-mono text-cyan-400/80 tracking-widest flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>AI AGENT FIREWALL</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono tracking-wider uppercase text-slate-500 font-semibold">
          DEFENSE & MONITORING
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-500/40 text-cyan-300 shadow-glow-cyan font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60 hover:bg-slate-900/40'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <span className="font-mono text-xs">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    item.badge === 'ALERT'
                      ? 'bg-rose-950/80 text-rose-400 border border-rose-500/40'
                      : isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Telemetry Quick Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400 flex items-center space-x-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>DEFENSE EFFICACY</span>
            </span>
            <span className="text-emerald-400 font-bold">
              {stats?.overview?.defense_efficacy_rate ?? 100}%
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${stats?.overview?.defense_efficacy_rate ?? 100}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1">
            <span>CHAIN HASH:</span>
            <span className={stats?.audit_chain?.is_valid ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {stats?.audit_chain?.status || 'VERIFYING'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between px-1 text-[10px] font-mono text-slate-500">
          <span className="flex items-center space-x-1">
            <Terminal className="w-3 h-3 text-slate-400" />
            <span>PORT 8000</span>
          </span>
          <span className="text-slate-400">v1.0.0-PROD</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
