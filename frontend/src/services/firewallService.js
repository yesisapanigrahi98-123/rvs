import api from './api';

export const firewallService = {
  /**
   * Inspect a user prompt against active firewall rules before agent consumption
   */
  async inspectPrompt(payload) {
    return await api.post('/firewall/inspect-prompt', {
      prompt: payload.prompt,
      session_id: payload.sessionId || 'session-web-console',
      agent_id: payload.agentId || 'agent-primary',
      policy_name: payload.policyName || undefined,
      metadata: payload.metadata || {},
    });
  },

  /**
   * Inspect an intended tool call invocation
   */
  async inspectTool(payload) {
    return await api.post('/firewall/inspect-tool', {
      tool_name: payload.toolName,
      tool_args: payload.toolArgs || {},
      session_id: payload.sessionId || 'session-web-console',
      agent_id: payload.agentId || 'agent-primary',
      is_tainted: Boolean(payload.isTainted),
      taint_source: payload.taintSource || null,
      policy_name: payload.policyName || undefined,
    });
  },

  /**
   * Inspect generated LLM output for DLP leakage or malicious beaconing
   */
  async inspectOutput(payload) {
    return await api.post('/firewall/inspect-output', {
      output_text: payload.outputText,
      session_id: payload.sessionId || 'session-web-console',
      agent_id: payload.agentId || 'agent-primary',
      policy_name: payload.policyName || undefined,
    });
  },

  /**
   * Full agent cycle execution through all 3 firewall checkpoints
   */
  async executeTurn(payload) {
    return await api.post('/firewall/execute-turn', {
      prompt: payload.prompt,
      agent_id: payload.agentId || 'agent-primary',
      session_id: payload.sessionId || `session-${Date.now()}`,
      policy_name: payload.policyName || 'default',
      simulate_tools: payload.simulateTools ?? true,
    });
  },
};

export default firewallService;
