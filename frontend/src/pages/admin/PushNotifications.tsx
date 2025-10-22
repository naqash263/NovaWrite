import React, { useState, useEffect } from 'react';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import apiClient from '../../api/axios';

interface NotificationStats {
  total_subscribers: number;
  active_subscribers: number;
  notification_types: {
    blogPosts: number;
    courses: number;
    workflows: number;
    careerTools: number;
  };
}

interface NotificationForm {
  title: string;
  body: string;
  url: string;
  type: 'blogPosts' | 'courses' | 'workflows' | 'careerTools' | 'all';
  imageUrl: string;
}

const PushNotifications: React.FC = () => {
  const { addToast } = useToast();
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [form, setForm] = useState<NotificationForm>({
    title: '',
    body: '',
    url: '',
    type: 'all',
    imageUrl: ''
  });

  useSEO({
    title: 'Push Notifications - Admin Panel | Naqash Thaheem',
    description: 'Manage push notifications and send updates to subscribers',
    url: '/admin/push-notifications',
    keywords: ['admin', 'push notifications', 'management']
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching push notification stats...');
      const response = await apiClient.get('/admin/push-notifications/stats');
      console.log('Stats response:', response.data);
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
      console.error('Error details:', error.response?.data);
      setStats(null);
      addToast({
        type: 'error',
        title: 'Failed to Load Stats',
        description: error.response?.data?.message || 'Could not load notification statistics.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim() || !form.body.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Title and body are required.'
      });
      return;
    }

    setIsSending(true);
    try {
      await apiClient.post('/admin/push-notifications/send', form);
      
      addToast({
        type: 'success',
        title: 'Notification Sent',
        description: 'Push notification has been sent successfully.'
      });
      
      // Reset form
      setForm({
        title: '',
        body: '',
        url: '',
        type: 'all',
        imageUrl: ''
      });
      
      // Refresh stats
      fetchStats();
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Send Failed',
        description: error.response?.data?.message || error.message || 'Failed to send notification.'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleTestNotification = async () => {
    setIsSending(true);
    try {
      await apiClient.post('/admin/push-notifications/test');
      
      addToast({
        type: 'success',
        title: 'Test Sent',
        description: 'Test notification has been sent to your device.'
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Test Failed',
        description: error.response?.data?.message || error.message || 'Failed to send test notification.'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Push Notifications</h1>
          <p className="text-gray-600 mt-2">
            Manage and send push notifications to your subscribers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
              
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ) : stats ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Subscribers</span>
                    <span className="text-2xl font-bold text-blue-600">{stats.total_subscribers || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Subscribers</span>
                    <span className="text-2xl font-bold text-green-600">{stats.active_subscribers || 0}</span>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium text-gray-900 mb-3">By Category</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Blog Posts</span>
                        <span className="text-sm font-medium">{stats.notification_types?.blogPosts || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Courses</span>
                        <span className="text-sm font-medium">{stats.notification_types?.courses || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Workflows</span>
                        <span className="text-sm font-medium">{stats.notification_types?.workflows || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Career Tools</span>
                        <span className="text-sm font-medium">{stats.notification_types?.careerTools || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Debug info - remove in production */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                    <p className="text-xs text-yellow-800">
                      <strong>Debug:</strong> Raw stats data: {JSON.stringify(stats, null, 2)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <p>Failed to load statistics</p>
                  <button
                    onClick={fetchStats}
                    className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={handleTestNotification}
                  disabled={isSending}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? 'Sending...' : 'Send Test Notification'}
                </button>
                
                <button
                  onClick={fetchStats}
                  disabled={isLoading}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Refresh Statistics
                </button>
              </div>
            </div>
          </div>

          {/* Send Notification Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Send Notification</h2>
              
              <form onSubmit={handleSendNotification} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter notification title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="body"
                    value={form.body}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter notification message"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      name="type"
                      value={form.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Subscribers</option>
                      <option value="blogPosts">Blog Posts Only</option>
                      <option value="courses">Courses Only</option>
                      <option value="workflows">Workflows Only</option>
                      <option value="careerTools">Career Tools Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL (Optional)
                    </label>
                    <input
                      type="url"
                      name="url"
                      value={form.url}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={form.imageUrl}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setForm({
                      title: '',
                      body: '',
                      url: '',
                      type: 'all',
                      imageUrl: ''
                    })}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isSending}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? 'Sending...' : 'Send Notification'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PushNotifications;
