import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Bell, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  ChevronDown, 
  Check, 
  AlertTriangle, 
  Info,
  User,
  ExternalLink
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { useAuth } from '../context/AuthContext';
import { formatRelativeTime } from '../utils/formatters';

export const Navbar = ({ onOpenPolicyModal }) => {
  const { 
    stats, 
    health, 
    activePolicy, 
    switchActivePolicy, 
    isLivePolling, 
    setIsLivePolling, 
    refresh,
    notifications,
    removeNotification
  } = useSecurity();

  const { user } = useAuth();
  const [showPolicyMenu, setShowPolicyMenu] = useState(false);
  const [showNotifsMenu, setShowNotifsMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const availablePolicies = ['default', 'strict_enterprise', 'lenient_sandbox'];

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handlePolicySelect = async (policyName) => {
    setShowPolicyMenu(false);
    if (policyName !== activePolicy) {
      await switchActivePolicy(policyName);
    }
  };

  const unreadCount = notifications.length;

  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-3.5 transition-all">
      <div className="flex items-center justify-between">
        {/* Left Section: Mobile Brand or Status */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                health?.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                health?.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 hidden sm:inline-block">
              GATEWAY STATUS: <strong className="text-emerald-400 font-semibold">{health?.status || 'ONLINE'}</strong>
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden md:block"></div>

          {/* Active Policy Selector */}
          <div className="relative">
            <button
              onClick={() => setShowPolicyMenu(!showPolicyMenu)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 hover:border-cyan-500/50 text-xs font-mono text-slate-300 transition-colors"
            >
              <span className="text-slate-500">POLICY:</span>
              <span className="text-cyan-400 font-bold uppercase">{activePolicy}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showPolicyMenu && (
              <div className="absolute left-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1.5 mb-1">
                  Active Guardrail Policy
                </div>
                {availablePolicies.map((pol) => (
                  <button
                    key={pol}
                    onClick={() => handlePolicySelect(pol)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg font-mono text-left transition-colors ${
                      activePolicy === pol
                        ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-bold'
                        : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <span>{pol}</span>
                    {activePolicy === pol && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Polling toggle, Refresh, Notifications, User */}
        <div className="flex items-center space-x-3">
          {/* Live Telemetry Polling Toggle */}
          <button
            onClick={() => setIsLivePolling(!isLivePolling)}
            title={isLivePolling ? 'Live Telemetry Active (Polling)' : 'Live Polling Paused'}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
              isLivePolling
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            {isLivePolling ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">{isLivePolling ? 'LIVE SYNC' : 'PAUSED'}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={handleManualRefresh}
            title="Force refresh metrics"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifsMenu(!showNotifsMenu)}
              className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifsMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="text-xs font-mono font-bold text-slate-200">INTERCEPTION ALERTS</span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    {unreadCount} Recent
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500 font-mono">
                      No security alerts at this time.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-lg border text-xs font-mono space-y-1 ${
                          n.type === 'error'
                            ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                            : n.type === 'warning'
                            ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                            : 'bg-slate-800/60 border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center space-x-1.5">
                            {n.type === 'error' && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                            {n.type === 'info' && <Info className="w-3 h-3 text-cyan-400" />}
                            <span>{n.title}</span>
                          </span>
                          <button
                            onClick={() => removeNotification(n.id)}
                            className="text-slate-500 hover:text-slate-300 text-[10px]"
                          >
                            ×
                          </button>
                        </div>
                        <p className="text-[11px] opacity-80">{n.message}</p>
                        <div className="text-[10px] text-slate-500 text-right">
                          {formatRelativeTime(n.timestamp)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Badge */}
          <div className="hidden sm:flex items-center space-x-2.5 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-cyan-500/40 bg-slate-800 flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User className="w-4 h-4 text-cyan-400" />
              )}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-slate-200">{user?.name}</div>
              <div className="text-[10px] font-mono text-cyan-400/90">{user?.role}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
