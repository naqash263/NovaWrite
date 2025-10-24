import apiClient from '../api/axios';

export interface LatestPostsParams {
  since: string | number; // ISO 8601 string or Unix timestamp
  limit?: number; // Default: 20, Max: 100
  includeUpdated?: boolean; // Default: true
}

export interface LatestPostsResponse {
  posts: any[];
  count: number;
  since: string;
  fetched_at: string;
}

/**
 * Get latest posts since a specific timestamp
 * @param params - Parameters for fetching latest posts
 * @returns Promise with latest posts data
 */
export const getLatestPosts = async (params: LatestPostsParams): Promise<LatestPostsResponse> => {
  const response = await apiClient.get('/posts/latest', {
    params: {
      since: params.since,
      limit: params.limit || 20,
      include_updated: params.includeUpdated !== false // Default to true
    }
  });
  return response.data;
};

/**
 * Get posts with since parameter using the main posts endpoint
 * @param since - Timestamp to get posts since
 * @param additionalParams - Additional query parameters
 * @returns Promise with paginated posts data
 */
export const getPostsSince = async (since: string | number, additionalParams: Record<string, any> = {}) => {
  const response = await apiClient.get('/posts', {
    params: {
      since,
      ...additionalParams
    }
  });
  return response.data;
};

/**
 * Helper function to get current timestamp in ISO format
 * @returns Current timestamp as ISO string
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Helper function to get current timestamp as Unix timestamp
 * @returns Current timestamp as Unix timestamp (seconds)
 */
export const getCurrentUnixTimestamp = (): number => {
  return Math.floor(Date.now() / 1000);
};

/**
 * Helper function to convert Unix timestamp to ISO string
 * @param unixTimestamp - Unix timestamp in seconds
 * @returns ISO string
 */
export const unixToISO = (unixTimestamp: number): string => {
  return new Date(unixTimestamp * 1000).toISOString();
};

/**
 * Helper function to convert ISO string to Unix timestamp
 * @param isoString - ISO 8601 string
 * @returns Unix timestamp in seconds
 */
export const isoToUnix = (isoString: string): number => {
  return Math.floor(new Date(isoString).getTime() / 1000);
};
