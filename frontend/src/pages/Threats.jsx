import React, { useState } from 'react';
import { 
  Radio, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Layers,
  Code2,
  X
} from 'lucide-react';
import { useThreats } from '../hooks/useThreats';
import ThreatCard from '../components/ThreatCard';
import ActivityTable from '../components/ActivityTable';
import { THREAT_CATEGORIES } from '../utils/constants';
import { downloadJsonFile } from '../utils/helpers';

export const Threats = () => {
  const { threats, summary, loading, refetch, filters, updateFilters } = useThreats();
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  const handleExport = () => {
    downloadJsonFile(`sentinelflow-threats-${new Date().toISOString().slice(0, 10)}.json`, threats);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold font-mono text-white flex items-center space-x-2.5">
            <Radio className="w-6 h-6 text-rose-500 animate-pulse" />
            <span>THREAT INTELLIGENCE & INTERCEPTION LEDGER</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time feed of detected prompt injections, unauthorized tool calls, and data leaks.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 flex items-center space-x-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT JSON</span>
          </button>

          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Aggregate Counts Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 font-mono">
          <div className="text-[11px] text-slate-400 uppercase">Total Interceptions</div>
          <div className="text-2xl font-bold text-slate-100">{summary?.total_events ?? threats.length}</div>
        </div>

        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1 font-mono">
          <div className="text-[11px] text-rose-400 uppercase">Blocked Threats</div>
          <div className="text-2xl font-bold text-rose-400">{summary?.blocked_count ?? 0}</div>
        </div>

        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1 font-mono">
          <div className="text-[11px] text-amber-400 uppercase">Sanitized Requests</div>
          <div className="text-2xl font-bold text-amber-400">{summary?.sanitized_count ?? 0}</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1 font-mono">
          <div className="text-[11px] text-emerald-400 uppercase">Allowed Traffic</div>
          <div className="text-2xl font-bold text-emerald-400">{summary?.allowed_count ?? 0}</div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-1.5">
          {THREAT_CATEGORIES.map((cat) => {
            const isSelected = (!filters.threat_type && cat.id === 'all') || filters.threat_type === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => updateFilters({ threat_type: cat.id === 'all' ? null : cat.id })}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  isSelected
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* View Switcher */}
        <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-1 self-start md:self-auto">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 text-xs font-mono rounded ${
              viewMode === 'cards' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400'
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 text-xs font-mono rounded ${
              viewMode === 'table' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400'
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {/* Feed Area */}
      {viewMode === 'cards' ? (
        <div>
          {loading ? (
            <div className="py-20 text-center font-mono text-xs text-slate-500">
              Loading threat records...
            </div>
          ) : threats.length === 0 ? (
            <div className="py-20 text-center space-y-2 border border-slate-800 rounded-2xl bg-slate-900/30">
              <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-mono text-slate-400">No threat events matching filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {threats.map((ev) => (
                <ThreatCard
                  key={ev.id}
                  event={ev}
                  onInspect={(threat) => setSelectedThreat(threat)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <ActivityTable events={threats} loading={loading} onRefresh={refetch} />
      )}

      {/* Single Threat Details Modal */}
      {selectedThreat && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold font-mono text-slate-200">
                THREAT INCIDENT #{selectedThreat.id}
              </h3>
              <button
                onClick={() => setSelectedThreat(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Decision:</span>
                <span className="font-bold text-red-400">{selectedThreat.decision}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Severity:</span>
                <span className="text-amber-400">{selectedThreat.severity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Threat Type:</span>
                <span className="text-cyan-300">{selectedThreat.threat_type || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-300">{selectedThreat.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Session ID:</span>
                <span className="text-slate-300">{selectedThreat.session_id}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono text-slate-400">DETAILS & VIOLATIONS</span>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 max-h-60 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{JSON.stringify(selectedThreat.details, null, 2)}</pre>
              </div>
            </div>

            <div className="text-right">
              <button
                onClick={() => setSelectedThreat(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Threats;
