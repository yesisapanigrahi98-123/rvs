import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import policyService from '../services/policyService';

const SecurityContext = createContext(null);

export const SecurityProvider = ({ children }) => {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [activePolicy, setActivePolicy] = useState('default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLivePolling, setIsLivePolling] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notif) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newNotif = { id, timestamp: new Date(), ...notif };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 19)]);

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 6000);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const fetchGlobalSecurityState = useCallback(async () => {
    try {
      const [statsData, healthData] = await Promise.all([
        policyService.getDashboardStats().catch(() => null),
        policyService.getSystemHealth().catch(() => null),
      ]);

      if (statsData) {
        setStats(statsData);
        if (statsData.active_policy?.name) {
          setActivePolicy(statsData.active_policy.name);
        }
      }

      if (healthData) {
        setHealth(healthData);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to load global security state:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGlobalSecurityState();

    if (!isLivePolling) return;
    const interval = setInterval(() => {
      fetchGlobalSecurityState();
    }, 6000);

    return () => clearInterval(interval);
  }, [fetchGlobalSecurityState, isLivePolling]);

  const switchActivePolicy = async (policyName) => {
    try {
      await policyService.activatePolicy(policyName);
      setActivePolicy(policyName);
      addNotification({
        title: 'Active Policy Updated',
        message: `Firewall runtime switched to '${policyName}' policy.`,
        type: 'success',
      });
      await fetchGlobalSecurityState();
      return true;
    } catch (err) {
      addNotification({
        title: 'Policy Switch Failed',
        message: err.message,
        type: 'error',
      });
      return false;
    }
  };

  return (
    <SecurityContext.Provider
      value={{
        stats,
        health,
        activePolicy,
        loading,
        error,
        isLivePolling,
        setIsLivePolling,
        refresh: fetchGlobalSecurityState,
        switchActivePolicy,
        notifications,
        addNotification,
        removeNotification,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

export default SecurityContext;
