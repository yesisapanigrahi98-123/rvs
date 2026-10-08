import api from './api';

export const attackService = {
  /**
   * List all adversarial attack test cases
   */
  async getAttackCases(category = null) {
    const params = category && category !== 'all' ? { category } : {};
    return await api.get('/attacks/cases', { params });
  },

  /**
   * Trigger red-team attack suite benchmark execution
   */
  async runSuite(payload = {}) {
    return await api.post('/attacks/run', {
      suite_name: payload.suiteName || 'Automated Sentinel Benchmark',
      category_filter: payload.category && payload.category !== 'all' ? payload.category : null,
      policy_name: payload.policyName || 'default',
      session_id: payload.sessionId || `redteam-${Date.now()}`,
    });
  },

  /**
   * Fetch benchmark history runs
   */
  async getAttackRuns(limit = 20) {
    return await api.get('/attacks/runs', { params: { limit } });
  },

  /**
   * Fetch detailed results for a specific benchmark run
   */
  async getAttackRunDetail(runId) {
    return await api.get(`/attacks/runs/${runId}`);
  },
};

export default attackService;
