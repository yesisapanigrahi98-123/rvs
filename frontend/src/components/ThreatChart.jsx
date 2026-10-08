import React, { useState } from 'react';
import { BarChart3, PieChart, ShieldAlert, Sparkles } from 'lucide-react';
import { SEVERITY_COLORS } from '../utils/constants';

export const ThreatChart = ({ threatCategories = {}, severityDistribution = {} }) => {
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'severity'

  const categoriesEntries = Object.entries(threatCategories || {});
  const severityEntries = Object.entries(severityDistribution || {});

  const totalThreats = categoriesEntries.reduce((acc, [, val]) => acc + val, 0);
  const totalSeverities = severityEntries.reduce((acc, [, val]) => acc + val, 0);

  const colorsMap = {
    CRITICAL: '#f43f5e',
    HIGH: '#ef4444',
    MEDIUM: '#f59e0b',
    LOW: '#06b6d4',
    NONE: '#64748b',
    direct_injection: '#ef4444',
    indirect_injection: '#f97316',
    jailbreak: '#ec4899',
    dlp_violation: '#eab308',
    taint_alert: '#a855f7',
    tool_call_breach: '#06b6d4',
    policy_violation: '#3b82f6',
  };

  return (
    <div className="rounded-2xl bg-[#0f172a]/80 border border-slate-800 p-6 space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold font-mono text-slate-100 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>THREAT VECTOR DISTRIBUTION</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time classification breakdown of blocked and intercepted events.
          </p>
        </div>

        <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-1 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
              activeTab === 'categories'
                ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            By Attack Category
          </button>
          <button
            onClick={() => setActiveTab('severity')}
            className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
              activeTab === 'severity'
                ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            By Threat Severity
          </button>
        </div>
      </div>

      {/* Categories View */}
      {activeTab === 'categories' && (
        <div>
          {categoriesEntries.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-mono text-slate-400">
                No active threat vector violations recorded yet.
              </p>
              <p className="text-xs text-slate-500">
                Run an adversarial test case from the Red Team Benchmark to generate threat vectors.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {categoriesEntries.map(([category, count]) => {
                const percentage = totalThreats > 0 ? ((count / totalThreats) * 100).toFixed(1) : 0;
                const barColor = colorsMap[category] || '#06b6d4';

                return (
                  <div key={category} className="space-y-1.5 font-mono">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-semibold uppercase">
                        {category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-slate-400">
                        <strong className="text-cyan-400 font-bold">{count}</strong> ({percentage}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-2.5 rounded-full transition-all duration-700"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: barColor,
                          boxShadow: `0 0 10px ${barColor}80`,
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Severity View */}
      {activeTab === 'severity' && (
        <div>
          {severityEntries.length === 0 ? (
            <div className="py-12 text-center text-sm font-mono text-slate-400">
              No severity distribution data available.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'].map((sev) => {
                const count = severityDistribution[sev] || 0;
                const percentage = totalSeverities > 0 ? ((count / totalSeverities) * 100).toFixed(0) : 0;
                const sevConfig = SEVERITY_COLORS[sev] || SEVERITY_COLORS.NONE;

                return (
                  <div
                    key={sev}
                    className={`p-4 rounded-xl border ${sevConfig.border} ${sevConfig.bg} space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-mono font-bold ${sevConfig.text}`}>{sev}</span>
                      <span className="text-[10px] font-mono text-slate-400">{percentage}%</span>
                    </div>
                    <div className="text-2xl font-extrabold font-mono text-slate-100">
                      {count}
                    </div>
                    <div className="w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%`, backgroundColor: sevConfig.accent }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ThreatChart;
