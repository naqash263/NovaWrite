import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axios';
import { useToast } from '../../hooks/use-toast';

interface HealthCheck {
  status: string;
  timestamp: string;
  service: string;
  version: string;
  critical_issues?: number;
  checks?: {
    [key: string]: {
      status: string;
      response_time_ms?: number;
      error?: string;
      [key: string]: any;
    };
  };
}

interface MonitoringData {
  basic: HealthCheck;
  comprehensive: HealthCheck;
  database: HealthCheck;
  storage: HealthCheck;
  lastChecked: string;
}

const Monitoring: React.FC = () => {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { addToast } = useToast();

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      
      const [basicRes, comprehensiveRes, databaseRes, storageRes] = await Promise.all([
        apiClient.get('/health'),
        apiClient.get('/health/comprehensive'),
        apiClient.get('/health/database'),
        apiClient.get('/health/storage')
      ]);

      setMonitoringData({
        basic: basicRes.data,
        comprehensive: comprehensiveRes.data,
        database: databaseRes.data,
        storage: storageRes.data,
        lastChecked: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error fetching monitoring data:', error);
      addToast({
        type: 'error',
        title: 'Monitoring Error',
        description: 'Failed to fetch monitoring data: ' + (error.response?.data?.message || error.message)
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchMonitoringData, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      case 'unhealthy': return '❌';
      default: return '❓';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 100) return `${ms}ms`;
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (loading && !monitoringData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading monitoring data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
              <p className="mt-2 text-gray-600">Real-time health monitoring and system status</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={fetchMonitoringData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh Now'}
              </button>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg ${
                  autoRefresh 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
              </button>
            </div>
          </div>
          {monitoringData && (
            <p className="mt-2 text-sm text-gray-500">
              Last checked: {formatTimestamp(monitoringData.lastChecked)}
            </p>
          )}
        </div>

        {/* Overall Status */}
        {monitoringData && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Overall System Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(monitoringData.basic.status)}`}>
                    {getStatusIcon(monitoringData.basic.status)} Basic Health
                  </div>
                </div>
                <div className="text-center">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(monitoringData.comprehensive.status)}`}>
                    {getStatusIcon(monitoringData.comprehensive.status)} Comprehensive
                  </div>
                </div>
                <div className="text-center">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(monitoringData.database.status)}`}>
                    {getStatusIcon(monitoringData.database.status)} Database
                  </div>
                </div>
                <div className="text-center">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(monitoringData.storage.status)}`}>
                    {getStatusIcon(monitoringData.storage.status)} Storage
                  </div>
                </div>
              </div>
              {monitoringData.comprehensive.critical_issues && monitoringData.comprehensive.critical_issues > 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">
                    🚨 {monitoringData.comprehensive.critical_issues} critical issue(s) detected
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detailed Checks */}
        {monitoringData && monitoringData.comprehensive.checks && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Database Performance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Database Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`px-2 py-1 rounded text-sm ${getStatusColor(monitoringData.comprehensive.checks.database?.status || 'unknown')}`}>
                    {getStatusIcon(monitoringData.comprehensive.checks.database?.status || 'unknown')} 
                    {monitoringData.comprehensive.checks.database?.status || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Response Time:</span>
                  <span>{formatResponseTime(monitoringData.comprehensive.checks.database?.response_time_ms || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Connection:</span>
                  <span>{monitoringData.comprehensive.checks.database?.connection || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Storage Performance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Storage Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`px-2 py-1 rounded text-sm ${getStatusColor(monitoringData.comprehensive.checks.storage?.status || 'unknown')}`}>
                    {getStatusIcon(monitoringData.comprehensive.checks.storage?.status || 'unknown')} 
                    {monitoringData.comprehensive.checks.storage?.status || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Response Time:</span>
                  <span>{formatResponseTime(monitoringData.comprehensive.checks.storage?.response_time_ms || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Writable:</span>
                  <span>{monitoringData.comprehensive.checks.storage?.writable ? '✅ Yes' : '❌ No'}</span>
                </div>
              </div>
            </div>

            {/* Memory Usage */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Memory Usage</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`px-2 py-1 rounded text-sm ${getStatusColor(monitoringData.comprehensive.checks.memory?.status || 'unknown')}`}>
                    {getStatusIcon(monitoringData.comprehensive.checks.memory?.status || 'unknown')} 
                    {monitoringData.comprehensive.checks.memory?.status || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Current Usage:</span>
                  <span>{monitoringData.comprehensive.checks.memory?.current_usage_mb || 0} MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Peak Usage:</span>
                  <span>{monitoringData.comprehensive.checks.memory?.peak_usage_mb || 0} MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Limit:</span>
                  <span>{monitoringData.comprehensive.checks.memory?.limit || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Disk Space */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Disk Space</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`px-2 py-1 rounded text-sm ${getStatusColor(monitoringData.comprehensive.checks.disk_space?.status || 'unknown')}`}>
                    {getStatusIcon(monitoringData.comprehensive.checks.disk_space?.status || 'unknown')} 
                    {monitoringData.comprehensive.checks.disk_space?.status || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Usage:</span>
                  <span>{monitoringData.comprehensive.checks.disk_space?.usage_percent || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Free Space:</span>
                  <span>{monitoringData.comprehensive.checks.disk_space?.free_space_gb || 0} GB</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Space:</span>
                  <span>{monitoringData.comprehensive.checks.disk_space?.total_space_gb || 0} GB</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Database Records */}
        {monitoringData && monitoringData.comprehensive.checks?.database_performance?.records && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Database Records</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {monitoringData.comprehensive.checks.database_performance.records.users || 0}
                </div>
                <div className="text-sm text-gray-600">Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {monitoringData.comprehensive.checks.database_performance.records.courses || 0}
                </div>
                <div className="text-sm text-gray-600">Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {monitoringData.comprehensive.checks.database_performance.records.posts || 0}
                </div>
                <div className="text-sm text-gray-600">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {monitoringData.comprehensive.checks.database_performance.records.workflows || 0}
                </div>
                <div className="text-sm text-gray-600">Workflows</div>
              </div>
            </div>
          </div>
        )}

        {/* Error Information */}
        {monitoringData && monitoringData.comprehensive.checks?.recent_errors && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Errors</h3>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(monitoringData.comprehensive.checks.recent_errors.status)}`}>
                {getStatusIcon(monitoringData.comprehensive.checks.recent_errors.status)} 
                {monitoringData.comprehensive.checks.recent_errors.status}
              </div>
              <span className="text-gray-600">
                {monitoringData.comprehensive.checks.recent_errors.error_count_last_hour || 0} errors in the last hour
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Monitoring;
