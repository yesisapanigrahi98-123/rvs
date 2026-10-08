import React, { useState, useEffect } from 'react';
import { 
  FileCode2, 
  Check, 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  Copy, 
  Edit3, 
  RefreshCw, 
  AlertTriangle,
  Code2,
  X,
  Sliders,
  Sparkles
} from 'lucide-react';
import policyService from '../services/policyService';
import { useSecurity } from '../context/SecurityContext';
import { copyToClipboard } from '../utils/helpers';

export const Policies = () => {
  const { activePolicy, switchActivePolicy, addNotification } = useSecurity();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // New/Edit policy form state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editVersion, setEditVersion] = useState('1.0.0');
  const [yamlContent, setYamlContent] = useState('');
  const [yamlValidation, setYamlValidation] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const data = await policyService.getPolicies();
      setPolicies(data || []);
      if (!selectedPolicy && data?.length > 0) {
        // default select active policy
        const active = data.find((p) => p.name === activePolicy) || data[0];
        setSelectedPolicy(active);
      } else if (selectedPolicy) {
        const updated = data.find((p) => p.name === selectedPolicy.name);
        if (updated) setSelectedPolicy(updated);
      }
    } catch (err) {
      console.error(err);
      addNotification({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [activePolicy]);

  const handleActivate = async (policyName) => {
    const ok = await switchActivePolicy(policyName);
    if (ok) {
      await fetchPolicies();
    }
  };

  const handleCopyRules = async () => {
    if (!selectedPolicy) return;
    const ok = await copyToClipboard(JSON.stringify(selectedPolicy.rules, null, 2));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openNewPolicyModal = () => {
    setEditName('');
    setEditDesc('');
    setEditVersion('1.0.0');
    setYamlContent(`name: enterprise_custom
description: Custom strict enterprise policy for AI agents
version: 1.0.0
is_active: false
rules:
  allowed_tools:
    - web_tool
    - file_tool
  blocked_tools:
    - code_tool
  rate_limits:
    max_tool_calls_per_turn: 5
    max_input_length_chars: 8000
  injection_defense:
    strict_mode: true
    confidence_threshold: 0.50
    block_on_detection: true
  dlp:
    scan_inputs: true
    scan_outputs: true
    scan_tool_args: true
    action_on_secrets: REDACT
    action_on_pii: REDACT
  taint_tracking:
    enabled: true
    enforce_taint_sinks: true
    untrusted_sources:
      - web_tool
    critical_sinks:
      - email_tool
`);
    setYamlValidation(null);
    setIsEditorOpen(true);
  };

  const validateYaml = async () => {
    try {
      const res = await policyService.validatePolicyYaml(yamlContent);
      setYamlValidation(res);
      return res;
    } catch (err) {
      setYamlValidation({ valid: false, error: err.message });
      return { valid: false, error: err.message };
    }
  };

  const handleSavePolicy = async () => {
    setSaving(true);
    try {
      const val = await validateYaml();
      if (!val.valid) {
        addNotification({ title: 'Invalid Policy YAML', message: val.error, type: 'error' });
        return;
      }

      const parsed = val.parsed;
      await policyService.upsertPolicy({
        name: parsed.name,
        description: parsed.description || 'Custom security policy',
        version: parsed.version || '1.0.0',
        is_active: Boolean(parsed.is_active),
        rules: parsed.rules || {},
      });

      addNotification({
        title: 'Policy Saved',
        message: `Policy '${parsed.name}' registered successfully.`,
        type: 'success',
      });

      setIsEditorOpen(false);
      await fetchPolicies();
    } catch (err) {
      addNotification({ title: 'Save Failed', message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold font-mono text-white flex items-center space-x-2.5">
            <FileCode2 className="w-6 h-6 text-cyan-400" />
            <span>SECURITY GUARDRAIL POLICIES</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Declarative security rulesets controlling prompt thresholds, tool permissions, taint flow, and DLP actions.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={openNewPolicyModal}
            className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-glow-cyan flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE POLICY</span>
          </button>
          <button
            onClick={fetchPolicies}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Policy List on Left, Active Rules Viewer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Policies Cards */}
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 px-1">
            Registered Policies ({policies.length})
          </div>

          <div className="space-y-2.5">
            {policies.map((p) => {
              const isCurrentActive = p.name === activePolicy;
              const isSelected = selectedPolicy?.name === p.name;

              return (
                <div
                  key={p.name}
                  onClick={() => setSelectedPolicy(p)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'bg-slate-900/90 border-cyan-500/50 shadow-glow-cyan'
                      : 'bg-[#0f172a]/70 hover:bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-slate-100 flex items-center space-x-1.5">
                      <span>{p.name}</span>
                    </span>

                    {isCurrentActive && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        ACTIVE RUNTIME
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">v{p.version}</span>
                    {!isCurrentActive ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivate(p.name);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline"
                      >
                        Activate Policy
                      </button>
                    ) : (
                      <span className="text-emerald-400 flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Enforced</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Columns (2-Span): Policy Deep Dive & Rule Inspector */}
        <div className="lg:col-span-2 space-y-4">
          {selectedPolicy ? (
            <div className="rounded-2xl bg-[#0f172a]/90 border border-slate-800 p-6 space-y-6">
              {/* Top Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold font-mono text-white">
                      {selectedPolicy.name}
                    </h2>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      v{selectedPolicy.version}
                    </span>
                    {selectedPolicy.name === activePolicy && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        ACTIVE RUNTIME
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{selectedPolicy.description}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyRules}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 flex items-center space-x-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Rules'}</span>
                  </button>

                  {selectedPolicy.name !== activePolicy && (
                    <button
                      onClick={() => handleActivate(selectedPolicy.name)}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shadow-glow-emerald transition-colors"
                    >
                      ACTIVATE THIS POLICY
                    </button>
                  )}
                </div>
              </div>

              {/* Parsed Rule Breakdown Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Injection Defense */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Prompt Injection Defense</span>
                  </h3>
                  <div className="space-y-1.5 text-xs font-mono text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Strict Mode:</span>
                      <span className="font-bold">
                        {selectedPolicy.rules?.injection_defense?.strict_mode ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Threshold:</span>
                      <span className="text-cyan-300 font-bold">
                        {selectedPolicy.rules?.injection_defense?.confidence_threshold ?? 0.65}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Action on Detection:</span>
                      <span className="text-rose-400 font-bold">
                        {selectedPolicy.rules?.injection_defense?.block_on_detection ? 'BLOCK' : 'ALLOW'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* DLP Configuration */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Sliders className="w-4 h-4" />
                    <span>Data Loss Prevention (DLP)</span>
                  </h3>
                  <div className="space-y-1.5 text-xs font-mono text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Scan Prompts:</span>
                      <span>{selectedPolicy.rules?.dlp?.scan_inputs ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Scan Outputs:</span>
                      <span>{selectedPolicy.rules?.dlp?.scan_outputs ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Secret Action:</span>
                      <span className="text-amber-300 font-bold">
                        {selectedPolicy.rules?.dlp?.action_on_secrets || 'REDACT'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Taint Tracking */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <h3 className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                    Taint Flow Rules
                  </h3>
                  <div className="space-y-1.5 text-xs font-mono text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Enforcement:</span>
                      <span>
                        {selectedPolicy.rules?.taint_tracking?.enforce_taint_sinks ? 'ACTIVE' : 'OFF'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Untrusted Sources:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(selectedPolicy.rules?.taint_tracking?.untrusted_sources || []).map((s) => (
                          <span key={s} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-purple-300">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tool Permissions */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    Tool Whitelist
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedPolicy.rules?.allowed_tools || []).map((tool) => (
                      <span key={tool} className="px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Full Raw Policy JSON */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                  Complete Policy Rules (Declarative Spec)
                </span>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 max-h-72 overflow-y-auto font-mono text-xs text-cyan-300">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(selectedPolicy.rules, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs font-mono text-slate-500">
              Select a policy to view rules.
            </div>
          )}
        </div>
      </div>

      {/* YAML Policy Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span>DECLARATIVE YAML POLICY CREATOR</span>
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 font-sans">
              Define guardrail parameters, tool whitelists, injection sensitivity, and DLP actions in standard YAML.
            </p>

            <textarea
              rows={14}
              value={yamlContent}
              onChange={(e) => {
                setYamlContent(e.target.value);
                setYamlValidation(null);
              }}
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 outline-none focus:border-cyan-500 leading-relaxed"
            />

            {yamlValidation && (
              <div
                className={`p-3 rounded-xl border text-xs font-mono ${
                  yamlValidation.valid
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                {yamlValidation.valid ? 'YAML Syntax & Root Spec Validated!' : yamlValidation.error}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={validateYaml}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200"
              >
                Validate Syntax
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePolicy}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl font-mono text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-glow-cyan"
                >
                  {saving ? 'Saving...' : 'Register & Save Policy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Policies;
