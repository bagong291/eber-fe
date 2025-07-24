import { useState, useEffect } from 'react';
import { DashboardApiService, DashboardData } from '@/services/dashboard/dashboardApi';

export function useDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await DashboardApiService.getDashboardData();
      if (response.status === 'success') {
        setDashboardData(response.data);
      } else {
        setError('Failed to fetch dashboard data');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const refreshData = () => {
    fetchDashboardData();
  };

  return {
    dashboardData,
    loading,
    error,
    refreshData
  };
} 