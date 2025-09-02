import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const DashboardContext = createContext();

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export const DashboardProvider = ({ children }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const { API_BASE, user } = useAuth();

  const fetchDashboardData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/dashboard/data`, {
        credentials: 'include',
        cache: 'no-cache',
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        setLastUpdate(new Date());
      } else {
        throw new Error(`Failed to fetch dashboard data: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user, API_BASE]);

  // Initial fetch and fetch on user change
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-update every 10 seconds (silent fetch)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      // Create a silent fetch function if needed, or just call fetchDashboardData
      // For now, let's keep it simple and just call fetchDashboardData
      fetchDashboardData();
    }, 10000);

    return () => clearInterval(interval);
  }, [user, fetchDashboardData]);

  const value = {
    dashboardData,
    loading,
    error,
    lastUpdate,
    fetchDashboardData, // Expose for manual refresh if needed
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
