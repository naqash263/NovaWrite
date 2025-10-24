import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import apiClient from '../api/axios';

interface ApiStats {
  availableRequests: number;
  totalRequests: number;
  usedRequests: number;
  isAuthenticated: boolean;
}

export const useApiStats = () => {
  const { isAuthenticated, user } = useAuth();
  const [apiStats, setApiStats] = useState<ApiStats>({
    availableRequests: 0,
    totalRequests: 0,
    usedRequests: 0,
    isAuthenticated: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadApiStats();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadApiStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/cv-ai/stats');
      
      if (response.data.success) {
        const stats = response.data.data;
        setApiStats({
          availableRequests: stats.available_requests || 0,
          totalRequests: stats.total_requests || 0,
          usedRequests: stats.used_requests || 0,
          isAuthenticated: stats.is_authenticated || false
        });
      }
    } catch (error) {
      console.error('Failed to load API stats:', error);
      setApiStats({
        availableRequests: 0,
        totalRequests: 0,
        usedRequests: 0,
        isAuthenticated: false
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    apiStats,
    loading,
    refetch: loadApiStats
  };
};
