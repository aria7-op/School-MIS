import api from '../../../services/api/client';
import {
  Staff,
  StaffCreateForm,
  StaffUpdateForm,
  StaffSearchFilters,
  StaffListResponse,
  StaffResponse,
  StaffStats,
  StaffAnalytics,
  StaffPerformance,
  StaffBulkCreateData,
  StaffBulkUpdateData,
  StaffBulkDeleteData,
  BulkOperationResult,
  StaffExportOptions,
  StaffImportResult,
  StaffReport,
  StaffDashboard,
  StaffComparison,
  CacheStats
} from '../types';

class StaffService {
  private baseUrl = '/staff';

  // ======================
  // CRUD OPERATIONS
  // ======================

  async createStaff(data: StaffCreateForm): Promise<Staff> {
    try {
      const response = await api.post<StaffResponse>(this.baseUrl, data);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to create staff');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to create staff');
    }
  }

  async getStaff(filters: StaffSearchFilters = {}): Promise<{ staff: Staff[]; pagination: any }> {
    try {
      const params = new URLSearchParams();
      
      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, String(value));
          }
        }
      });

      const response = await api.get<StaffListResponse>(`${this.baseUrl}?${params.toString()}`);
      if (response.data.success) {
        return {
          staff: response.data.data.staff,
          pagination: response.data.data.pagination
        };
      }
      throw new Error(response.data.message || 'Failed to fetch staff');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch staff');
    }
  }

  async getStaffById(staffId: number, include?: string[]): Promise<Staff> {
    try {
      const params = include ? `?include=${include.join(',')}` : '';
      const response = await api.get<StaffResponse>(`${this.baseUrl}/${staffId}${params}`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Staff not found');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch staff');
    }
  }

  async updateStaff(staffId: number, data: StaffUpdateForm): Promise<Staff> {
    try {
      const response = await api.put<StaffResponse>(`${this.baseUrl}/${staffId}`, data);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update staff');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to update staff');
    }
  }

  async deleteStaff(staffId: number): Promise<{ message: string }> {
    try {
      const response = await api.delete<{ success: boolean; message: string }>(`${this.baseUrl}/${staffId}`);
      if (response.data.success) {
        return { message: response.data.message };
      }
      throw new Error(response.data.message || 'Failed to delete staff');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete staff');
    }
  }

  async restoreStaff(staffId: number): Promise<{ message: string }> {
    try {
      const response = await api.patch<{ success: boolean; message: string }>(`${this.baseUrl}/${staffId}/restore`);
      if (response.data.success) {
        return { message: response.data.message };
      }
      throw new Error(response.data.message || 'Failed to restore staff');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to restore staff');
    }
  }

  // ======================
  // STATISTICS & ANALYTICS
  // ======================

  async getStaffStats(staffId: number): Promise<StaffStats> {
    try {
      const response = await api.get<{ success: boolean; data: StaffStats; message: string }>(`${this.baseUrl}/${staffId}/stats`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch staff statistics');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch staff statistics');
    }
  }

  async getStaffAnalytics(staffId: number, period: string = '30d'): Promise<StaffAnalytics> {
    try {
      const response = await api.get<{ success: boolean; data: StaffAnalytics; message: string }>(`${this.baseUrl}/${staffId}/analytics?period=${period}`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch staff analytics');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch staff analytics');
    }
  }

  async getStaffPerformance(staffId: number): Promise<StaffPerformance> {
    try {
      const response = await api.get<{ success: boolean; data: StaffPerformance; message: string }>(`${this.baseUrl}/${staffId}/performance`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch staff performance');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch staff performance');
    }
  }

  // ======================
  // BULK OPERATIONS
  // ======================

  async bulkCreateStaff(data: StaffBulkCreateData): Promise<BulkOperationResult> {
    try {
      const response = await api.post<{ success: boolean; data: BulkOperationResult; message: string }>(`${this.baseUrl}/bulk/create`, data);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to bulk create staff');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to bulk create staff');
    }
  }

  async bulkUpdateStaff(data: StaffBulkUpdateData): Promise<BulkOperationResult> {
    try {
      const response = await api.put<{ success: boolean; data: BulkOperationResult; message: string }>(`${this.baseUrl}/bulk/update`, data);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to bulk update staff');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to bulk update staff');
    }
  }

  async bulkDeleteStaff(data: StaffBulkDeleteData): Promise<BulkOperationResult> {
    try {
      const response = await api.delete<{ success: boolean; data: BulkOperationResult; message: string }>(`${this.baseUrl}/bulk/delete`, { data });
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to bulk delete staff');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to bulk delete staff');
    }
  }

  // ======================
  // SEARCH & FILTER
  // ======================

  async searchStaff(query: string, include?: string[]): Promise<Staff[]> {
    try {
      const params = new URLSearchParams({ q: query });
      if (include) {
        params.append('include', include.join(','));
      }

      const response = await api.get<{ success: boolean; data: Staff[]; message: string }>(`${this.baseUrl}/search?${params.toString()}`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to search staff');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to search staff');
    }
  }

  // ======================
  // EXPORT/IMPORT
  // ======================

  async exportStaff(options: StaffExportOptions = {}): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      if (options.format) params.append('format', options.format);
      if (options.include) params.append('include', options.include.join(','));
      if (options.fields) params.append('fields', options.fields.join(','));
      
      // Add filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              params.append(key, value.join(','));
            } else {
              params.append(key, String(value));
            }
          }
        });
      }

      const response = await api.get(`${this.baseUrl}/export?${params.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to export staff');
    }
  }

  async importStaff(data: FormData): Promise<StaffImportResult> {
    try {
      const response = await api.post<{ success: boolean; data: StaffImportResult; message: string }>(`${this.baseUrl}/import`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to import staff');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to import staff');
    }
  }

  // ======================
  // UTILITY FUNCTIONS
  // ======================

  async generateEmployeeIdSuggestions(designation: string): Promise<string[]> {
    try {
      const response = await api.get<{ success: boolean; data: string[]; message: string }>(`${this.baseUrl}/suggestions/employee-id?designation=${encodeURIComponent(designation)}`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to generate employee ID suggestions');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to generate employee ID suggestions');
    }
  }

  async getStaffCountByDepartment(): Promise<{ department: string; count: number }[]> {
    try {
      const response = await api.get<{ success: boolean; data: { department: string; count: number }[]; message: string }>(`${this.baseUrl}/stats/department`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch department statistics');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch department statistics');
    }
  }

  async getStaffCountByDesignation(): Promise<{ designation: string; count: number }[]> {
    try {
      const response = await api.get<{ success: boolean; data: { designation: string; count: number }[]; message: string }>(`${this.baseUrl}/stats/designation`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch designation statistics');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch designation statistics');
    }
  }

  // ======================
  // REPORTS & DASHBOARD
  // ======================

  async getStaffReport(filters?: StaffSearchFilters): Promise<StaffReport> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              params.append(key, value.join(','));
            } else {
              params.append(key, String(value));
            }
          }
        });
      }

      const response = await api.get<{ success: boolean; data: StaffReport; message: string }>(`${this.baseUrl}/report?${params.toString()}`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch staff report');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch staff report');
    }
  }

  async getStaffDashboard(): Promise<StaffDashboard> {
    try {
      const response = await api.get<{ success: boolean; data: StaffDashboard; message: string }>(`${this.baseUrl}/dashboard`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch staff dashboard');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch staff dashboard');
    }
  }

  async getStaffComparison(staffId1: number, staffId2: number): Promise<StaffComparison> {
    try {
      const response = await api.get<{ success: boolean; data: StaffComparison; message: string }>(`${this.baseUrl}/comparison?staffId1=${staffId1}&staffId2=${staffId2}`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch staff comparison');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch staff comparison');
    }
  }

  // ======================
  // CACHE OPERATIONS
  // ======================

  async getCacheStats(): Promise<CacheStats> {
    try {
      const response = await api.get<{ success: boolean; data: CacheStats; message: string }>(`${this.baseUrl}/cache/stats`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch cache statistics');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch cache statistics');
    }
  }

  async warmCache(staffId?: number): Promise<{ message: string }> {
    try {
      const params = staffId ? `?staffId=${staffId}` : '';
      const response = await api.post<{ success: boolean; message: string }>(`${this.baseUrl}/cache/warm${params}`);
      if (response.data.success) {
        return { message: response.data.message };
      }
      throw new Error(response.data.message || 'Failed to warm cache');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to warm cache');
    }
  }

  async clearCache(): Promise<{ message: string }> {
    try {
      const response = await api.delete<{ success: boolean; message: string }>(`${this.baseUrl}/cache/clear`);
      if (response.data.success) {
        return { message: response.data.message };
      }
      throw new Error(response.data.message || 'Failed to clear cache');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to clear cache');
    }
  }

  // ======================
  // HELPER FUNCTIONS
  // ======================

  calculateExperience(joiningDate: string): number {
    if (!joiningDate) return 0;
    const joinDate = new Date(joiningDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - joinDate.getTime());
    const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
    return diffYears;
  }

  calculateSalaryRange(salary: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN' {
    if (!salary) return 'UNKNOWN';
    if (salary < 30000) return 'LOW';
    if (salary < 80000) return 'MEDIUM';
    return 'HIGH';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return '#4CAF50';
      case 'INACTIVE':
        return '#F44336';
      case 'SUSPENDED':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  }

  getGenderIcon(gender: string): string {
    return gender === 'FEMALE' ? 'female' : 'male';
  }

  getGenderColor(gender: string): string {
    return gender === 'FEMALE' ? '#FF69B4' : '#1E90FF';
  }
}

export default new StaffService(); 
