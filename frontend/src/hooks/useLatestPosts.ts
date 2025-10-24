import { useState, useEffect, useCallback } from 'react';
import { getLatestPosts, getCurrentTimestamp, LatestPostsParams, LatestPostsResponse } from '../utils/postsApi';

interface UseLatestPostsOptions {
  autoFetch?: boolean;
  interval?: number; // Auto-fetch interval in milliseconds
  initialSince?: string;
}

interface UseLatestPostsReturn {
  posts: any[];
  loading: boolean;
  error: string | null;
  lastFetched: string | null;
  fetchLatest: (since?: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for fetching latest posts since a specific timestamp
 * @param options - Configuration options
 * @returns Object with posts data and control functions
 */
export const useLatestPosts = (options: UseLatestPostsOptions = {}): UseLatestPostsReturn => {
  const {
    autoFetch = false,
    interval = 30000, // 30 seconds default
    initialSince = getCurrentTimestamp()
  } = options;

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  const fetchLatest = useCallback(async (since?: string) => {
    setLoading(true);
    setError(null);

    try {
      const params: LatestPostsParams = {
        since: since || lastFetched || initialSince,
        limit: 50, // Reasonable default
        includeUpdated: true
      };

      const response: LatestPostsResponse = await getLatestPosts(params);
      
      setPosts(response.posts);
      setLastFetched(response.fetched_at);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch latest posts');
      console.error('Error fetching latest posts:', err);
    } finally {
      setLoading(false);
    }
  }, [lastFetched, initialSince]);

  // Auto-fetch effect
  useEffect(() => {
    if (!autoFetch) return;

    // Initial fetch
    fetchLatest();

    // Set up interval
    const intervalId = setInterval(() => {
      fetchLatest();
    }, interval);

    return () => clearInterval(intervalId);
  }, [autoFetch, interval, fetchLatest]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    posts,
    loading,
    error,
    lastFetched,
    fetchLatest,
    clearError
  };
};

/**
 * Hook for pull-to-refresh functionality
 * @param onRefresh - Callback function when refresh is triggered
 * @returns Object with refresh state and trigger function
 */
export const usePullToRefresh = (onRefresh: () => Promise<void>) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const triggerRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefresh]);

  return {
    isRefreshing,
    triggerRefresh
  };
};
