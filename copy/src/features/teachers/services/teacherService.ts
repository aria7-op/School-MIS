import secureApiService from '../../../services/secureApiService';
import {
  Teacher,
  TeachersResponse,
  TeacherResponse,
  TeacherStats,
  TeacherAnalytics,
  TeacherPerformance,
  TeacherSearchParams,
  BulkCreateRequest,
  BulkUpdateRequest,
  BulkDeleteRequest,
  BulkOperationResult,
  ExportRequest,
  ImportRequest,
  ImportResult,
  DepartmentStats,
  ExperienceStats,
  TeacherInsights,
  PerformancePrediction,
  BehavioralAnalysis,
  TeacherNotification,
  TeacherFormData,
  TeacherValidationErrors
} from '../types/teacher';

class TeacherService {
  private baseUrl = '/teachers';

  // ======================
  // CRUD OPERATIONS
  // ======================

  /**
   * Create a new teacher
   */
  async createTeacher(teacherData: Partial<Teacher>): Promise<Teacher> {
    try {
      const response = await secureApiService.post(`${this.baseUrl}`, teacherData);
      return response.data as Teacher;
    } catch (error) {
      console.error('Error creating teacher:', error);
      throw error;
    }
  }

  /**
   * Get teachers with pagination and filters
   */
  async getTeachers(params?: TeacherSearchParams): Promise<TeachersResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.query) queryParams.append('query', params.query);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params?.include) queryParams.append('include', params.include.join(','));
      
      if (params?.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              queryParams.append(key, value.join(','));
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
      }

      const response = await secureApiService.get(`${this.baseUrl}?${queryParams.toString()}`);
      return response.data as TeachersResponse;
    } catch (error) {
      console.error('Error fetching teachers:', error);
      throw error;
    }
  }

  /**
   * Get teacher by ID
   */
  async getTeacherById(id: string, include?: string[]): Promise<Teacher> {
    try {
      const queryParams = new URLSearchParams();
      if (include) queryParams.append('include', include.join(','));
      
      const response = await secureApiService.get(`${this.baseUrl}/${id}?${queryParams.toString()}`);
      return response.data as Teacher;
    } catch (error) {
      console.error('Error fetching teacher:', error);
      throw error;
    }
  }

  /**
   * Update teacher
   */
  async updateTeacher(id: string, updateData: Partial<Teacher>): Promise<Teacher> {
    try {
      const response = await secureApiService.put(`${this.baseUrl}/${id}`, updateData);
      return response.data as Teacher;
    } catch (error) {
      console.error('Error updating teacher:', error);
      throw error;
    }
  }

  /**
   * Delete teacher (soft delete)
   */
  async deleteTeacher(id: string): Promise<void> {
    try {
      await secureApiService.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Error deleting teacher:', error);
      throw error;
    }
  }

  /**
   * Restore deleted teacher
   */
  async restoreTeacher(id: string): Promise<void> {
    try {
      await secureApiService.patch(`${this.baseUrl}/${id}/restore`);
    } catch (error) {
      console.error('Error restoring teacher:', error);
      throw error;
    }
  }

  // ======================
  // SEARCH & FILTER
  // ======================

  /**
   * Search teachers with advanced filters
   */
  async searchTeachers(params: TeacherSearchParams): Promise<TeachersResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.query) queryParams.append('query', params.query);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.include) queryParams.append('include', params.include.join(','));
      
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              queryParams.append(key, value.join(','));
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
      }

      const response = await secureApiService.get(`${this.baseUrl}/search?${queryParams.toString()}`);
      return response.data as TeachersResponse;
    } catch (error) {
      console.error('Error searching teachers:', error);
      throw error;
    }
  }

  // ======================
  // STATISTICS & ANALYTICS
  // ======================

  /**
   * Get teacher statistics
   */
  async getTeacherStats(id: string): Promise<TeacherStats> {
    try {
      const response = await secureApiService.get(`${this.baseUrl}/${id}/stats`);
      return response.data as TeacherStats;
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
      throw error;
    }
  }

  /**
   * Get teacher analytics
   */
  async getTeacherAnalytics(id: string, period: string = '30d'): Promise<TeacherAnalytics> {
    try {
      const response = await secureApiService.get(`${this.baseUrl}/${id}/analytics?period=${period}`);
      return response.data as TeacherAnalytics;
    } catch (error) {
      console.error('Error fetching teacher analytics:', error);
      throw error;
    }
  }

  /**
   * Get teacher performance metrics
   */
  async getTeacherPerformance(id: string): Promise<TeacherPerformance> {
    try {
      const response = await secureApiService.get(`${this.baseUrl}/${id}/performance`);
      return response.data as TeacherPerformance;
    } catch (error) {
      console.error('Error fetching teacher performance:', error);
      throw error;
    }
  }

  /**
   * Get overall teacher statistics
   */
  async getOverallStats(): Promise<TeacherStats> {
    try {
      const response = await secureApiService.get(`${this.baseUrl}/stats`);
      return response.data as TeacherStats;
    } catch (error) {
      console.error('Error fetching overall teacher stats:', error);
      throw error;
    }
  }

  // ======================
  // BULK OPERATIONS
  // ======================

  /**
   * Bulk create teachers
   */
  async bulkCreateTeachers(data: BulkCreateRequest): Promise<BulkOperationResult> {
    try {
      const response = await secureApiService.post(`${this.baseUrl}/bulk/create`, data);
      return response.data as BulkOperationResult;
    } catch (error) {
      console.error('Error bulk creating teachers:', error);
      throw error;
    }
  }

  /**
   * Bulk update teachers
   */
  async bulkUpdateTeachers(data: BulkUpdateRequest): Promise<BulkOperationResult> {
    try {
      const response = await secureApiService.put(`${this.baseUrl}/bulk/update`, data);
      return response.data as BulkOperationResult;
    } catch (error) {
      console.error('Error bulk updating teachers:', error);
      throw error;
    }
  }

  /**
   * Bulk delete teachers
   */
  async bulkDeleteTeachers(data: BulkDeleteRequest): Promise<BulkOperationResult> {
    try {
      const response = await secureApiService.delete(`${this.baseUrl}/bulk/delete`, { data });
      return response.data as BulkOperationResult;
    } catch (error) {
      console.error('Error bulk deleting teachers:', error);
      throw error;
    }
  }

  // ======================
  // EXPORT & IMPORT
  // ======================

  /**
   * Export teachers data
   */
  async exportTeachers(request: ExportRequest): Promise<Blob> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', request.format);
      
      if (request.filters) {
        Object.entries(request.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              queryParams.append(key, value.join(','));
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
      }
      
      if (request.fields) {
        queryParams.append('fields', request.fields.join(','));
      }

      const response = await secureApiService.getBlob(`${this.baseUrl}/export?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error exporting teachers:', error);
      throw error;
    }
  }

  /**
   * Import teachers data
   */
  async importTeachers(request: ImportRequest): Promise<ImportResult> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('format', request.format);
      
      if (request.mapping) {
        formData.append('mapping', JSON.stringify(request.mapping));
      }
      
      if (request.validateOnly) {
        formData.append('validateOnly', 'true');
      }

      const response = await secureApiService.post(`${this.baseUrl}/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data as ImportResult;
    } catch (error) {
      console.error('Error importing teachers:', error);
      throw error;
    }
  }

  // ======================
  // UTILITY OPERATIONS
  // ======================

  /**
   * Generate teacher code suggestions
   */
  async generateCodeSuggestions(name: string, schoolId: string): Promise<string[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('name', name);
      queryParams.append('schoolId', schoolId);
      
      const response = await secureApiService.get(`${this.baseUrl}/suggestions/code?${queryParams.toString()}`);
      return response.data as string[];
    } catch (error) {
      console.error('Error generating code suggestions:', error);
      throw error;
    }
  }

  /**
   * Get teacher count by department
   */
  async getTeacherCountByDepartment(schoolId?: string): Promise<DepartmentStats[]> {
    try {
      const queryParams = new URLSearchParams();
      if (schoolId) queryParams.append('schoolId', schoolId);
      
      const response = await secureApiService.get(`${this.baseUrl}/stats/department?${queryParams.toString()}`);
      return response.data as DepartmentStats[];
    } catch (error) {
      console.error('Error fetching teacher count by department:', error);
      throw error;
    }
  }

  /**
   * Get teacher count by experience
   */
  async getTeacherCountByExperience(schoolId?: string): Promise<ExperienceStats[]> {
    try {
      const queryParams = new URLSearchParams();
      if (schoolId) queryParams.append('schoolId', schoolId);
      
      const response = await secureApiService.get(`${this.baseUrl}/stats/experience?${queryParams.toString()}`);
      return response.data as ExperienceStats[];
    } catch (error) {
      console.error('Error fetching teacher count by experience:', error);
      throw error;
    }
  }

  /**
   * Get teachers by school
   */
  async getTeachersBySchool(schoolId: string, include?: string[]): Promise<Teacher[]> {
    try {
      const queryParams = new URLSearchParams();
      if (include) queryParams.append('include', include.join(','));
      
      const response = await secureApiService.get(`${this.baseUrl}/school/${schoolId}?${queryParams.toString()}`);
      return response.data as Teacher[];
    } catch (error) {
      console.error('Error fetching teachers by school:', error);
      throw error;
    }
  }

  /**
   * Get teachers by department
   */
  async getTeachersByDepartment(departmentId: string, include?: string[]): Promise<Teacher[]> {
    try {
      const queryParams = new URLSearchParams();
      if (include) queryParams.append('include', include.join(','));
      
      const response = await secureApiService.get(`${this.baseUrl}/department/${departmentId}?${queryParams.toString()}`);
      return response.data as Teacher[];
    } catch (error) {
      console.error('Error fetching teachers by department:', error);
      throw error;
    }
  }

  // ======================
  // AI & ANALYTICS
  // ======================

  /**
   * Get AI insights for teacher
   */
  async getTeacherInsights(teacherId: string): Promise<TeacherInsights> {
    try {
      const response = await secureApiService.get(`${this.baseUrl}/${teacherId}/insights`);
      return response.data as TeacherInsights;
    } catch (error) {
      console.error('Error fetching teacher insights:', error);
      throw error;
    }
  }

  /**
   * Get performance prediction
   */
  async getPerformancePrediction(teacherId: string, period: string): Promise<PerformancePrediction> {
    try {
      const response = await secureApiService.get(`${this.baseUrl}/${teacherId}/predictions/performance?period=${period}`);
      return response.data as PerformancePrediction;
    } catch (error) {
      console.error('Error fetching performance prediction:', error);
      throw error;
    }
  }

  /**
   * Get behavioral analysis
   */
  async getBehavioralAnalysis(teacherId: string): Promise<BehavioralAnalysis> {
    try {
      const response = await secureApiService.get(`${this.baseUrl}/${teacherId}/analysis/behavioral`);
      return response.data as BehavioralAnalysis;
    } catch (error) {
      console.error('Error fetching behavioral analysis:', error);
      throw error;
    }
  }

  // ======================
  // NOTIFICATIONS
  // ======================

  /**
   * Get teacher notifications
   */
  async getTeacherNotifications(teacherId: string): Promise<TeacherNotification[]> {
    try {
      const response = await secureApiService.get(`${this.baseUrl}/${teacherId}/notifications`);
      return response.data as TeacherNotification[];
    } catch (error) {
      console.error('Error fetching teacher notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await secureApiService.patch(`${this.baseUrl}/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // ======================
  // VALIDATION
  // ======================

  /**
   * Validate teacher data
   */
  async validateTeacherData(data: TeacherFormData): Promise<TeacherValidationErrors> {
    try {
      const response = await secureApiService.post(`${this.baseUrl}/validate`, data);
      return response.data as TeacherValidationErrors;
    } catch (error) {
      console.error('Error validating teacher data:', error);
      throw error;
    }
  }

  // ======================
  // FILE UPLOAD
  // ======================

  /**
   * Upload teacher photo
   */
  async uploadTeacherPhoto(teacherId: string, file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await secureApiService.post(`${this.baseUrl}/${teacherId}/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return (response.data as any).photoUrl;
    } catch (error) {
      console.error('Error uploading teacher photo:', error);
      throw error;
    }
  }

  /**
   * Upload teacher documents
   */
  async uploadTeacherDocuments(teacherId: string, files: File[]): Promise<string[]> {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`documents[${index}]`, file);
      });
      
      const response = await secureApiService.post(`${this.baseUrl}/${teacherId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return (response.data as any).documentUrls;
    } catch (error) {
      console.error('Error uploading teacher documents:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const teacherService = new TeacherService();
export default teacherService;
