import api from './api';

export const threatService = {
  /**
   * List logged security events and firewall interventions
   */
  async getThreats(params = {}) {
    return await api.get('/threats', { params });
  },

  /**
   * Get aggregated counts and category distribution of identified threats
   */
  async getThreatSummary() {
    return await api.get('/threats/summary');
  },

  /**
   * Get detailed audit records for a specific security event
   */
  async getThreatDetail(eventId) {
    return await api.get(`/threats/${eventId}`);
  },
};

export default threatService;
