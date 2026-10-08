import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Shield, 
  Clock, 
  Activity, 
  Layers, 
  ChevronRight, 
  Copy, 
  Check 
} from 'lucide-react';
import { getSeverityStyle, getDecisionStyle, copyToClipboard } from '../utils/helpers';
import { formatRelativeTime, formatLatency } from '../utils/formatters';

export const ThreatCard = ({ event, onInspect }) => {
  const [copied, setCopied] = React.useState(false);

  const severityStyle = getSeverityStyle(event.severity);
  const decisionStyle = getDecisionStyle(event.decision);

  const handleCopy = async (e) => {
    e.stopPropagation();
    const success = await copyToClipboard(JSON.stringify(event, null, 2));
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      onClick={() => onInspect && onInspect(event)}
      className="group relative rounded-xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 p-4 transition-all duration-200 cursor-pointer space-y-3"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Decision Pill */}
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${decisionStyle.badge}`}
          >
            {event.decision}
          </span>

          {/* Severity Pill */}
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${severityStyle.badge}`}
          >
            {event.severity}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-slate-500 text-xs font-mono">
          <Clock className="w-3 h-3" />
          <span>{formatRelativeTime(event.timestamp)}</span>
          <button
            onClick={handleCopy}
            title="Copy raw event JSON"
            className="p-1 hover:text-cyan-400 text-slate-500 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Threat Info */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold font-mono text-slate-200 group-hover:text-cyan-300 transition-colors">
            {event.threat_type || event.event_type}
          </div>
          <span className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>{formatLatency(event.latency_ms)}</span>
          </span>
        </div>

        {event.details?.reason ? (
          <p className="text-xs text-slate-400 line-clamp-2 font-sans">
            {event.details.reason}
          </p>
        ) : (
          <p className="text-xs text-slate-500 italic font-mono">
            Interception evaluated without explicit violation details.
          </p>
        )}
      </div>

      {/* Footer Meta */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <div className="flex items-center space-x-3 truncate">
          <span className="truncate max-w-[140px]" title={event.session_id}>
            SES: <span className="text-slate-400">{event.session_id}</span>
          </span>
          <span className="truncate max-w-[120px]" title={event.agent_id}>
            AGT: <span className="text-slate-400">{event.agent_id}</span>
          </span>
        </div>

        <span className="flex items-center text-cyan-400/80 group-hover:text-cyan-300 text-xs font-mono font-medium">
          <span>Details</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </div>
  );
};

export default ThreatCard;
