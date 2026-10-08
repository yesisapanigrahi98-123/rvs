import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Clock, 
  Copy, 
  Check, 
  X, 
  Activity, 
  Code2, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { getSeverityStyle, getDecisionStyle, copyToClipboard } from '../utils/helpers';
import { formatDateTime, formatLatency } from '../utils/formatters';

export const ActivityTable = ({
  events = [],
  loading = false,
  totalCount,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [copied, setCopied] = useState(false);

  // Client-side search and filtering
  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      searchTerm === '' ||
      ev.threat_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.event_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.session_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.details?.reason?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDecision =
      decisionFilter === 'ALL' || ev.decision === decisionFilter;

    const matchesSeverity =
      severityFilter === 'ALL' || ev.severity === severityFilter;

    return matchesSearch && matchesDecision && matchesSeverity;
  });

  const handleCopyModalJson = async () => {
    if (!selectedEvent) return;
    const ok = await copyToClipboard(JSON.stringify(selectedEvent, null, 2));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl bg-[#0f172a]/90 border border-slate-800 overflow-hidden space-y-4 p-5">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold font-mono text-slate-100 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>INTERCEPTION LOGS & RECENT ACTIVITY</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full audit log of real-time firewall inspections, tool calls, and output sanitizations.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search threat, session..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500/50 text-xs text-slate-200 placeholder-slate-500 font-mono outline-none transition-colors"
            />
          </div>

          {/* Decision Filter */}
          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono outline-none hover:border-slate-700"
          >
            <option value="ALL">Decision: All</option>
            <option value="BLOCK">BLOCK</option>
            <option value="ALLOW">ALLOW</option>
            <option value="SANITIZE">SANITIZE</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono outline-none hover:border-slate-700"
          >
            <option value="ALL">Severity: All</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
            <option value="NONE">NONE</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Event / Threat Vector</th>
              <th className="py-3 px-4">Decision</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Session & Agent</th>
              <th className="py-3 px-4 text-right">Latency</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                  Loading security events from gateway...
                </td>
              </tr>
            ) : filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                  No security events matching current criteria.
                </td>
              </tr>
            ) : (
              filteredEvents.map((ev) => {
                const sevStyle = getSeverityStyle(ev.severity);
                const decStyle = getDecisionStyle(ev.decision);

                return (
                  <tr
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="hover:bg-slate-850/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {formatDateTime(ev.timestamp)}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-200">
                      <div className="flex items-center space-x-2">
                        <span className="truncate max-w-[200px]" title={ev.threat_type || ev.event_type}>
                          {ev.threat_type || ev.event_type}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${decStyle.badge}`}
                      >
                        {ev.decision}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${sevStyle.badge}`}
                      >
                        {ev.severity}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      <div className="text-[11px] truncate max-w-[130px]" title={ev.session_id}>
                        {ev.session_id}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                        {ev.agent_id}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right text-slate-400 whitespace-nowrap">
                      {formatLatency(ev.latency_ms)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(ev);
                        }}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                        title="View Raw Inspection JSON"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-1 pt-2">
        <span>Showing {filteredEvents.length} events</span>
        <span>ACID Cryptographic Log Store</span>
      </div>

      {/* Raw Event Inspection Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Code2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold font-mono text-slate-200">
                  EVENT PAYLOAD INSPECTOR #{selectedEvent.id}
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyModalJson}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center space-x-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px]">DECISION</div>
                <div className="font-bold text-slate-200 mt-0.5">{selectedEvent.decision}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px]">SEVERITY</div>
                <div className="font-bold text-slate-200 mt-0.5">{selectedEvent.severity}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px]">LATENCY</div>
                <div className="font-bold text-cyan-400 mt-0.5">{formatLatency(selectedEvent.latency_ms)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[10px]">EVENT TYPE</div>
                <div className="font-bold text-slate-200 mt-0.5 truncate">{selectedEvent.event_type}</div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono text-slate-400">RAW JSON TELEMETRY</div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 max-h-80 overflow-y-auto">
                <pre className="text-xs font-mono text-cyan-300 whitespace-pre-wrap">
                  {JSON.stringify(selectedEvent, null, 2)}
                </pre>
              </div>
            </div>

            <div className="text-right">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-200 transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityTable;
