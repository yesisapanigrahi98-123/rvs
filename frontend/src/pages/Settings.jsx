import React, { useState } from 'react';
import { 
  Sliders, 
  Server, 
  ShieldCheck, 
  Save, 
  User, 
  Lock, 
  Database, 
  Cpu, 
  CheckCircle2, 
  RefreshCw,
  BellRing
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';

export const Settings = () => {
  const { isLivePolling, setIsLivePolling, addNotification } = useSecurity();
  const { user, updateProfile } = useAuth();

  // Settings State
  const [apiUrl, setApiUrl] = useState(API_BASE_URL);
  const [injectionThreshold, setInjectionThreshold] = useState('0.65');
  const [dlpAction, setDlpAction] = useState('REDACT');
  const [maxPromptLength, setMaxPromptLength] = useState('16000');
  const [sandboxTimeout, setSandboxTimeout] = useState('15');
  const [operatorName, setOperatorName] = useState(user?.name || 'Alex Vance');
  const [operatorRole, setOperatorRole] = useState(user?.role || 'SecOps Director');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile({ name: operatorName, role: operatorRole });
    setSavedSuccess(true);
    addNotification({
      title: 'Configuration Saved',
      message: 'System settings and operator profile updated successfully.',
      type: 'success',
    });
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold font-mono text-white flex items-center space-x-2.5">
            <Sliders className="w-6 h-6 text-cyan-400" />
            <span>SYSTEM & GATEWAY SETTINGS</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure backend connection endpoints, firewall thresholds, sandboxing, and operator credentials.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl font-mono text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-glow-cyan flex items-center space-x-2 transition-colors self-start md:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>SAVE CHANGES</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backend Gateway Connection */}
        <div className="rounded-2xl bg-[#0f172a]/90 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-800">
            <Server className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold font-mono text-slate-200">
              GATEWAY CONNECTION & THRESHOLDS
            </h2>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-slate-400 text-[10px] block mb-1">
                API GATEWAY BASE URL
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Proxied through Vite dev server or direct backend at port 8000
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-[10px] block mb-1">
                  INJECTION THRESHOLD (0.0 - 1.0)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={injectionThreshold}
                  onChange={(e) => setInjectionThreshold(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[10px] block mb-1">
                  DLP ACTION ON LEAK
                </label>
                <select
                  value={dlpAction}
                  onChange={(e) => setDlpAction(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500"
                >
                  <option value="REDACT">REDACT / MASK</option>
                  <option value="BLOCK">BLOCK REQUEST</option>
                  <option value="WARN">LOG WARNING ONLY</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-[10px] block mb-1">
                  MAX PROMPT LENGTH (CHARS)
                </label>
                <input
                  type="number"
                  value={maxPromptLength}
                  onChange={(e) => setMaxPromptLength(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[10px] block mb-1">
                  SANDBOX TIMEOUT (SECONDS)
                </label>
                <input
                  type="number"
                  value={sandboxTimeout}
                  onChange={(e) => setSandboxTimeout(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SecOps Operator Credentials */}
        <div className="rounded-2xl bg-[#0f172a]/90 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-800">
            <User className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold font-mono text-slate-200">
              OPERATOR IDENTITY & TELEMETRY SYNC
            </h2>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-slate-400 text-[10px] block mb-1">OPERATOR FULL NAME</label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[10px] block mb-1">ASSIGNED ROLE</label>
              <input
                type="text"
                value={operatorRole}
                onChange={(e) => setOperatorRole(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 block">SECURITY CLEARANCE</span>
              <div className="text-emerald-400 font-bold flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5" />
                <span>LEVEL-4 (TOP SECRET SEC-OPS)</span>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLivePolling}
                  onChange={(e) => setIsLivePolling(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span className="text-slate-300 font-mono text-xs">
                  Enable continuous live telemetry polling (every 6 seconds)
                </span>
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Settings;
