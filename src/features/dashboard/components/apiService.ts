// src/features/dashboard/components/apiService.ts
import secureApiService from '../../../services/secureApiService';

// Dashboard API Service
export const dashboardApi = {
  getDashboardStats: (params?: any) => secureApiService.get('/dashboard/stats', { params }),
  getDashboardCharts: (params?: any) => secureApiService.get('/dashboard/charts', { params }),
  getDashboardMetrics: (params?: any) => secureApiService.get('/dashboard/metrics', { params }),
  getDashboardWidgets: () => secureApiService.get('/dashboard/widgets'),
  updateDashboardLayout: (data: any) => secureApiService.put('/dashboard/layout', data),
};

// Customer API Service
export const addCustomer = async (customerData: any) => {
  try {
    const response = await secureApiService.createCustomer(customerData);
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to create customer');
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create customer');
  }
};

// Recent Activities API
export const fetchRecentActivities = async (params?: any) => {
  try {
    const response = await secureApiService.get('/dashboard/recent-activities', { params });
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to fetch recent activities');
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch recent activities');
  }
};
