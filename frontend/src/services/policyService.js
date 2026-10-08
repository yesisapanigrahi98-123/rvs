import api from './api';

export const policyService = {
  /**
   * List all policies
   */
  async getPolicies() {
    return await api.get('/policies');
  },

  /**
   * Get single policy by name
   */
  async getPolicy(name) {
    return await api.get(`/policies/${name}`);
  },

  /**
   * Create or update policy
   */
  async upsertPolicy(policyData) {
    return await api.post('/policies', policyData);
  },

  /**
   * Set runtime active policy
   */
  async activatePolicy(name) {
    return await api.put(`/policies/${name}/activate`);
  },

  /**
   * Validate YAML policy syntax
   */
  async validatePolicyYaml(yamlString) {
    return await api.post('/policies/validate', yamlString, {
      headers: { 'Content-Type': 'text/plain' },
    });
  },

  // Audit Trail services
  async getAuditLogs(limit = 100) {
    return await api.get('/audit/logs', { params: { limit } });
  },

  async verifyAuditChain() {
    return await api.get('/audit/verify');
  },

  async exportAuditTrail() {
    return await api.post('/audit/export');
  },

  // Dashboard & Health services
  async getDashboardStats() {
    return await api.get('/dashboard/stats');
  },

  async getSystemHealth() {
    return await api.get('/dashboard/health');
  },
};

export default policyService;
