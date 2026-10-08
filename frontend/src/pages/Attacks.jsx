import React, { useState, useEffect } from 'react';
import { 
  Crosshair, 
  Play, 
  Loader2, 
  ShieldCheck, 
  ShieldAlert, 
  History, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  RefreshCw,
  Clock
} from 'lucide-react';
import attackService from '../services/attackService';
import { useSecurity } from '../context/SecurityContext';
import AttackCard from '../components/AttackCard';
import { formatPercentage, formatLatency, formatDateTime } from '../utils/formatters';

export const Attacks = () => {
  const { activePolicy, refresh: refreshGlobal, addNotification } = useSecurity();

  const [cases, setCases] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [executingSuite, setExecutingSuite] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [suiteSummary, setSuiteSummary] = useState(null);
  const [executingCaseId, setExecutingCaseId] = useState(null);
  const [caseResultsMap, setCaseResultsMap] = useState({});

  const loadData = async () => {
    try {
      setLoadingCases(true);
      const casesData = await attackService.getAttackCases(selectedCategory);
      setCases(casesData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCases(false);
    }

    try {
      setLoadingRuns(true);
      const runsData = await attackService.getAttackRuns(10);
      setRuns(runsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRuns(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const handleRunSuite = async () => {
    setExecutingSuite(true);
    setSuiteSummary(null);
    try {
      const summary = await attackService.runSuite({
        suiteName: 'Automated Red Team Adversarial Suite',
        category: selectedCategory,
        policyName: activePolicy,
      });

      setSuiteSummary(summary);

      // Populate results in cards
      if (summary.results) {
        const newMap = {};
        summary.results.forEach((r) => {
          newMap[r.case_id] = r;
        });
        setCaseResultsMap(newMap);
      }

      addNotification({
        title: 'Red Team Suite Completed',
        message: `Defense Rate: ${summary.defense_rate}% (ASR: ${summary.asr_score}%)`,
        type: summary.defense_rate >= 80 ? 'success' : 'warning',
      });

      await refreshGlobal();
      // Reload historical runs
      const runsData = await attackService.getAttackRuns(10);
      setRuns(runsData || []);
    } catch (err) {
      addNotification({
        title: 'Benchmark Run Failed',
        message: err.message,
        type: 'error',
      });
    } finally {
      setExecutingSuite(false);
    }
  };

  const handleExecuteSingleCase = async (attackCase) => {
    setExecutingCaseId(attackCase.id);
    try {
      // Run single case suite
      const summary = await attackService.runSuite({
        suiteName: `Single Case: ${attackCase.name}`,
        category: attackCase.category,
        policyName: activePolicy,
      });

      const matchedResult = summary.results?.find((r) => r.case_id === attackCase.id) || summary.results?.[0];
      if (matchedResult) {
        setCaseResultsMap((prev) => ({
          ...prev,
          [attackCase.id]: matchedResult,
        }));
      }

      addNotification({
        title: matchedResult?.passed ? 'Attack Blocked (Passed)' : 'Attack Bypassed',
        message: matchedResult?.reason || 'Adversarial case evaluated',
        type: matchedResult?.passed ? 'success' : 'error',
      });

      await refreshGlobal();
    } catch (err) {
      addNotification({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setExecutingCaseId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold font-mono text-white flex items-center space-x-2.5">
            <Crosshair className="w-6 h-6 text-rose-500" />
            <span>RED TEAM ADVERSARIAL BENCHMARK SUITE</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Stress-test firewall guardrails against prompt injections, system leaks, jailbreaks, and privilege escalation.
          </p>
        </div>

        <button
          onClick={handleRunSuite}
          disabled={executingSuite}
          className="px-5 py-2.5 rounded-xl font-mono text-xs font-bold bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-glow-crimson flex items-center space-x-2 transition-all disabled:opacity-50"
        >
          {executingSuite ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>EXECUTING BENCHMARK SUITE...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>RUN FULL BENCHMARK SUITE</span>
            </>
          )}
        </button>
      </div>

      {/* Latest Suite Summary Banner if executed */}
      {suiteSummary && (
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-[#0f172a] border border-cyan-500/40 p-6 space-y-4 shadow-xl animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                BENCHMARK RUN RESULT: {suiteSummary.run_id}
              </span>
              <h2 className="text-base font-bold font-mono text-white">{suiteSummary.suite_name}</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Avg Latency: {formatLatency(suiteSummary.average_latency_ms)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-500">TOTAL TESTS</div>
              <div className="text-xl font-bold text-slate-100 mt-0.5">{suiteSummary.total_tests}</div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
              <div className="text-[10px] text-emerald-400">BLOCKED (PASSED)</div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">{suiteSummary.blocked_tests}</div>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30">
              <div className="text-[10px] text-rose-400">BYPASSED (FAILED)</div>
              <div className="text-xl font-bold text-rose-400 mt-0.5">{suiteSummary.bypassed_tests}</div>
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
              <div className="text-[10px] text-cyan-400">DEFENSE RATE</div>
              <div className="text-xl font-bold text-cyan-400 mt-0.5">
                {formatPercentage(suiteSummary.defense_rate)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30">
              <div className="text-[10px] text-amber-400">ASR SCORE</div>
              <div className="text-xl font-bold text-amber-400 mt-0.5">
                {formatPercentage(suiteSummary.asr_score)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Pills Filter */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
        <span className="text-xs font-mono text-slate-400 mr-2">CATEGORIES:</span>
        {['all', 'direct_injection', 'indirect_injection', 'jailbreak', 'data_exfiltration', 'privilege_escalation'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
              selectedCategory === cat
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Attack Scenarios Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <span>{cases.length} ADVERSARIAL ATTACK SCENARIOS AVAILABLE</span>
          <span>Target Policy: {activePolicy}</span>
        </div>

        {loadingCases ? (
          <div className="py-20 text-center font-mono text-xs text-slate-500">
            Loading adversarial attack cases...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cases.map((ac) => (
              <AttackCard
                key={ac.id}
                attackCase={ac}
                onExecute={handleExecuteSingleCase}
                executing={executingCaseId === ac.id}
                lastResult={caseResultsMap[ac.id]}
              />
            ))}
          </div>
        )}
      </div>

      {/* Historical Benchmark Runs Table */}
      <div className="rounded-2xl bg-[#0f172a]/90 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-mono text-slate-200 flex items-center space-x-2">
            <History className="w-4 h-4 text-cyan-400" />
            <span>BENCHMARK RUN HISTORY</span>
          </h2>
          <button
            onClick={loadData}
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Run ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Suite Name</th>
                <th className="py-2.5 px-3">Policy</th>
                <th className="py-2.5 px-3">Tests</th>
                <th className="py-2.5 px-3">Defense Rate</th>
                <th className="py-2.5 px-3">ASR</th>
                <th className="py-2.5 px-3 text-right">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/40">
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No prior benchmark runs recorded yet. Click 'Run Full Benchmark Suite' above.
                  </td>
                </tr>
              ) : (
                runs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-850">
                    <td className="py-2.5 px-3 text-cyan-400 font-bold">{r.run_id}</td>
                    <td className="py-2.5 px-3 text-slate-400">{formatDateTime(r.timestamp)}</td>
                    <td className="py-2.5 px-3 text-slate-200 truncate max-w-[160px]">{r.suite_name}</td>
                    <td className="py-2.5 px-3 text-slate-300 uppercase">{r.policy_name}</td>
                    <td className="py-2.5 px-3 text-slate-300">{r.total_tests}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">
                      {formatPercentage(r.defense_rate)}
                    </td>
                    <td className="py-2.5 px-3 text-rose-400 font-bold">
                      {formatPercentage(r.asr_score)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {formatLatency(r.average_latency_ms)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attacks;
