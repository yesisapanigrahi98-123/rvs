import { useState, useEffect, useCallback } from 'react';
import policyService from '../services/policyService';
import threatService from '../services/threatService';

export function useDashboard(pollInterval = 6000) {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [recentThreats, setRecentThreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, healthRes, threatsRes] = await Promise.all([
        policyService.getDashboardStats().catch(() => null),
        policyService.getSystemHealth().catch(() => null),
        threatService.getThreats({ limit: 8 }).catch(() => []),
      ]);

      if (statsRes) setStats(statsRes);
      if (healthRes) setHealth(healthRes);
      if (threatsRes) setRecentThreats(threatsRes);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    if (!pollInterval) return;

    const interval = setInterval(fetchDashboardData, pollInterval);
    return () => clearInterval(interval);
  }, [fetchDashboardData, pollInterval]);

  return {
    stats,
    health,
    recentThreats,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}

export default useDashboard;
