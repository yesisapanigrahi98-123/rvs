import React, { useState } from 'react';
import { 
  Crosshair, 
  Terminal, 
  Play, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check 
} from 'lucide-react';
import { getSeverityStyle, copyToClipboard } from '../utils/helpers';
import { formatLatency } from '../utils/formatters';

export const AttackCard = ({ attackCase, onExecute, executing = false, lastResult = null }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const severityStyle = getSeverityStyle(attackCase.severity);

  const handleCopy = async () => {
    const ok = await copyToClipboard(attackCase.payload);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#0f172a]/95 to-[#090d16]/95 border border-slate-800 hover:border-slate-700/80 p-5 space-y-4 transition-all shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
              {attackCase.category}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${severityStyle.badge}`}
            >
              {attackCase.severity}
            </span>
            {attackCase.target_tool && (
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                TARGET: {attackCase.target_tool}
              </span>
            )}
          </div>

          <h3 className="text-sm font-bold text-slate-100 font-mono tracking-tight pt-1">
            {attackCase.name}
          </h3>
        </div>

        <button
          onClick={() => onExecute && onExecute(attackCase)}
          disabled={executing}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-glow-crimson transition-all disabled:opacity-50"
        >
          {executing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>TESTING...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>TEST RUN</span>
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed font-sans">
        {attackCase.description}
      </p>

      {/* Payload snippet preview */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span className="flex items-center space-x-1">
            <Terminal className="w-3 h-3 text-cyan-400" />
            <span>ADVERSARIAL PAYLOAD</span>
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="hover:text-cyan-400 flex items-center space-x-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="hover:text-slate-300 text-cyan-400 font-semibold"
            >
              {expanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>

        <div
          className={`p-3 rounded-xl bg-slate-950 border border-slate-800/90 font-mono text-xs text-rose-300/90 overflow-x-auto ${
            expanded ? 'max-h-60' : 'max-h-16'
          } overflow-y-auto`}
        >
          <pre className="whitespace-pre-wrap">{attackCase.payload}</pre>
        </div>
      </div>

      {/* Execution Feedback / Last Result */}
      {lastResult && (
        <div
          className={`p-3 rounded-xl border text-xs font-mono space-y-1.5 ${
            lastResult.passed
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center space-x-1.5">
              {lastResult.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>
                {lastResult.passed ? 'FIREWALL BLOCKED ATTACK (DEFENSE SUCCESS)' : 'BYPASS DETECTED (DEFENSE FAILED)'}
              </span>
            </span>
            <span className="text-[10px] text-slate-400">
              {formatLatency(lastResult.latency_ms)}
            </span>
          </div>

          <div className="text-[11px] opacity-90 pl-5">
            Decision: <strong>{lastResult.firewall_decision}</strong> | Severity: <strong>{lastResult.severity}</strong>
          </div>
          {lastResult.reason && (
            <div className="text-[10px] opacity-75 pl-5 italic">
              "{lastResult.reason}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttackCard;
