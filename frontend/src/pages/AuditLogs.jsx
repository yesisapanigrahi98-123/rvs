import React, { useState, useEffect } from 'react';
import { 
  History, 
  Link2, 
  ShieldCheck, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Copy, 
  Check, 
  Lock, 
  FileText,
  Search,
  ExternalLink,
  X
} from 'lucide-react';
import policyService from '../services/policyService';
import { useSecurity } from '../context/SecurityContext';
import { formatDateTime, formatHash } from '../utils/formatters';
import { copyToClipboard, downloadJsonFile } from '../utils/helpers';

export const AuditLogs = () => {
  const { addNotification } = useSecurity();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [integrityResult, setIntegrityResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await policyService.getAuditLogs(100);
      setLogs(data || []);
    } catch (err) {
      console.error(err);
      addNotification({ title: 'Error', message: 'Failed to fetch audit logs', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyChain = async () => {
    setVerifying(true);
    try {
      const result = await policyService.verifyAuditChain();
      setIntegrityResult(result);
      addNotification({
        title: result.is_valid ? 'Chain Integrity Verified' : 'Cryptographic Integrity Alert',
        message: result.message || `Verified ${result.total_records} chained records`,
        type: result.is_valid ? 'success' : 'error',
      });
    } catch (err) {
      addNotification({ title: 'Verification Failed', message: err.message, type: 'error' });
    } finally {
      setVerifying(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await policyService.exportAuditTrail();
      downloadJsonFile(`sentinelflow-audit-ledger-${Date.now()}.json`, data);
      addNotification({
        title: 'Ledger Exported',
        message: `Exported ${data.total_records || logs.length} audit entries for compliance archiving.`,
        type: 'success',
      });
    } catch (err) {
      addNotification({ title: 'Export Failed', message: err.message, type: 'error' });
    }
  };

  useEffect(() => {
    fetchLogs();
    handleVerifyChain();
  }, []);

  const handleCopy = async (text, id) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedHash(id);
      setTimeout(() => setCopiedHash(null), 2000);
    }
  };

  const filteredLogs = logs.filter(
    (l) =>
      searchTerm === '' ||
      l.event_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.session_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.entry_hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.previous_hash?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold font-mono text-white flex items-center space-x-2.5">
            <History className="w-6 h-6 text-cyan-400" />
            <span>CRYPTOGRAPHIC AUDIT LEDGER</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident hash-chained audit trail guaranteeing immutability across all security events.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleVerifyChain}
            disabled={verifying}
            className="px-4 py-2 rounded-xl font-mono text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-glow-cyan flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            <ShieldCheck className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
            <span>{verifying ? 'VERIFYING...' : 'VERIFY INTEGRITY'}</span>
          </button>

          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT LEDGER</span>
          </button>

          <button
            onClick={fetchLogs}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Cryptographic Ledger Status Banner */}
      {integrityResult && (
        <div
          className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs ${
            integrityResult.is_valid
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/20 border-amber-500/40 text-amber-300'
          }`}
        >
          <div className="flex items-start sm:items-center space-x-3">
            <div
              className={`p-2.5 rounded-xl ${
                integrityResult.is_valid
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {integrityResult.is_valid ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="font-bold text-sm">
                HASH CHAIN STATUS:{' '}
                {integrityResult.is_valid ? 'INTACT & CRYPTOGRAPHICALLY SECURE' : 'MONITORING INTEGRITY ANOMALIES'}
              </div>
              <div className="opacity-80 mt-0.5">
                {integrityResult.message || `Ledger contains ${integrityResult.total_records} ordered hash blocks.`}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-slate-300">
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-500">Total Blocks:</span>{' '}
              <strong className="text-white">{integrityResult.total_records}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-500">Hash Algo:</span>{' '}
              <strong className="text-cyan-400">SHA-256</strong>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by event, session ID, or hash prefix..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs text-slate-200 placeholder-slate-500 font-mono outline-none"
          />
        </div>

        <div className="text-xs font-mono text-slate-400">
          Showing <strong className="text-cyan-400">{filteredLogs.length}</strong> chained blocks
        </div>
      </div>

      {/* Ledger Block Chain Table */}
      <div className="rounded-2xl bg-[#0f172a]/90 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Block #</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Session</th>
                <th className="py-3 px-4">Previous Hash</th>
                <th className="py-3 px-4">Entry Hash</th>
                <th className="py-3 px-4 text-center">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading cryptographic ledger...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No ledger entries found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((entry) => (
                  <tr
                    key={entry.id}
                    onClick={() => setSelectedLog(entry)}
                    className="hover:bg-slate-850/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-bold text-cyan-400">
                      #{entry.id}
                    </td>

                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {formatDateTime(entry.timestamp)}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-200">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] border border-slate-700">
                        {entry.event_type}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-400 truncate max-w-[120px]">
                      {entry.session_id}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(entry.previous_hash, `prev-${entry.id}`);
                        }}
                        className="hover:text-cyan-300 flex items-center space-x-1"
                        title={entry.previous_hash}
                      >
                        <span>{formatHash(entry.previous_hash, 8)}</span>
                        {copiedHash === `prev-${entry.id}` && <Check className="w-3 h-3 text-emerald-400" />}
                      </button>
                    </td>

                    <td className="py-3 px-4 font-mono text-cyan-400">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(entry.entry_hash, `entry-${entry.id}`);
                        }}
                        className="hover:text-cyan-200 flex items-center space-x-1"
                        title={entry.entry_hash}
                      >
                        <span>{formatHash(entry.entry_hash, 8)}</span>
                        {copiedHash === `entry-${entry.id}` && <Check className="w-3 h-3 text-emerald-400" />}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(entry);
                        }}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Block Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center space-x-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>LEDGER BLOCK #{selectedLog.id} DETAILS</span>
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">PREVIOUS BLOCK HASH</span>
                <span className="text-slate-300 break-all select-all">{selectedLog.previous_hash}</span>
              </div>
              <div className="pt-2 border-t border-slate-900">
                <span className="text-slate-500 block text-[10px]">CURRENT BLOCK HASH</span>
                <span className="text-cyan-400 break-all select-all">{selectedLog.entry_hash}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono text-slate-400">BLOCK DATA PAYLOAD</span>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 max-h-60 overflow-y-auto font-mono text-xs text-slate-200">
                <pre className="whitespace-pre-wrap">{JSON.stringify(selectedLog.data, null, 2)}</pre>
              </div>
            </div>

            <div className="text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200"
              >
                Close Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
