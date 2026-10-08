import { useState, useEffect, useCallback } from 'react';
import threatService from '../services/threatService';

export function useThreats(initialFilters = {}) {
  const [threats, setThreats] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    skip: 0,
    limit: 50,
    decision: null,
    threat_type: null,
    severity: null,
    ...initialFilters,
  });

  const fetchThreats = useCallback(async () => {
    setLoading(true);
    try {
      const cleanParams = {};
      if (filters.skip !== undefined) cleanParams.skip = filters.skip;
      if (filters.limit !== undefined) cleanParams.limit = filters.limit;
      if (filters.decision) cleanParams.decision = filters.decision;
      if (filters.threat_type) cleanParams.threat_type = filters.threat_type;
      if (filters.severity) cleanParams.severity = filters.severity;

      const [threatsData, summaryData] = await Promise.all([
        threatService.getThreats(cleanParams),
        threatService.getThreatSummary(),
      ]);

      setThreats(threatsData || []);
      setSummary(summaryData || null);
      setError(null);
    } catch (err) {
      console.error('Failed to load threats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchThreats();
  }, [fetchThreats]);

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, skip: 0 }));
  };

  const setPage = (page) => {
    setFilters((prev) => ({ ...prev, skip: (page - 1) * prev.limit }));
  };

  return {
    threats,
    summary,
    loading,
    error,
    filters,
    updateFilters,
    setPage,
    refetch: fetchThreats,
  };
}

export default useThreats;
