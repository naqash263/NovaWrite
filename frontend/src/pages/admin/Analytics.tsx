import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axios';

interface AnalyticsData {
  summary: {
    total_installs: number;
    total_uninstalls: number;
    total_launches: number;
    net_installs: number;
    platforms: Record<string, number>;
    countries: Record<string, number>;
    device_types: Record<string, number>;
  };
  daily_installs: Record<string, number>;
  daily_uninstalls: Record<string, number>;
  retention_data: Array<{
    device_id: string;
    install_date: string;
    retained: boolean;
  }>;
  top_countries: Record<string, number>;

  device_type_distribution: Record<string, number>;
}

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    fetchAnalytics();
  }, [days, startDate, endDate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      console.log('Fetching analytics data...');
      
      let url = `/admin/analytics/dashboard?days=${days}`;
      if (startDate && endDate) {
        url += `&start_date=${startDate}&end_date=${endDate}`;
      }
      
      const response = await apiClient.get(url);
      console.log('Analytics response:', response.data);
      setData(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Analytics fetch error:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={fetchAnalytics}
                  className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">App Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600">Track app installs, usage, and user behavior</p>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter by Date Range</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quick Select</label>
              <select
                value={days}
                onChange={(e) => {
                  setDays(Number(e.target.value));
                  setStartDate('');
                  setEndDate('');
                }}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Last year</option>
                <option value={0}>All time</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDays(0); // Reset quick select when using custom dates
                }}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDays(0); // Reset quick select when using custom dates
                }}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setDays(30);
                }}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
          {(startDate || endDate) && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Custom Date Range:</strong> {startDate || 'Start'} to {endDate || 'End'}
              </p>
            </div>
          )}
        </div>

        {/* Debug info - remove in production */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Information</h3>
          <p className="text-xs text-yellow-700">
            <strong>Raw data:</strong> {JSON.stringify(data, null, 2)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Installs</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(data.summary.total_installs)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Uninstalls</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(data.summary.total_uninstalls)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Net Installs</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(data.summary.net_installs)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Launches</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(data.summary.total_launches)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Distribution */}
        {data.summary.platforms && Object.keys(data.summary.platforms).length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Distribution</h3>
            <div className="space-y-3">
              {Object.entries(data.summary.platforms).map(([platform, count]) => (
                <div key={platform} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 capitalize">{platform}</span>
                  <span className="text-sm font-medium">{formatNumber(count as number)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Device Type Distribution */}
        {data.summary.device_types && Object.keys(data.summary.device_types).length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Device Type Distribution</h3>
            <div className="space-y-3">
              {Object.entries(data.summary.device_types).map(([deviceType, count]) => (
                <div key={deviceType} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 capitalize">{deviceType}</span>
                  <span className="text-sm font-medium">{formatNumber(count as number)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Countries */}
        {data.summary.countries && Object.keys(data.summary.countries).length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Countries</h3>
            <div className="space-y-3">
              {Object.entries(data.summary.countries).map(([country, count]) => (
                <div key={country} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{country}</span>
                  <span className="text-sm font-medium">{formatNumber(count as number)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;