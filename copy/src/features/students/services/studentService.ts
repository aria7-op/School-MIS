import secureApiService from '../../../services/secureApiService';
import { 
  Student, 
  StudentFilters, 
  StudentAnalytics, 
  DashboardFilters,
  ApiResponse 
} from '../types';

class StudentService {
  private baseUrl = '/students';

  // Get all students with filters
  async getStudents(filters: StudentFilters = {}): Promise<ApiResponse<Student[]>> {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.classId) params.append('classId', filters.classId.toString());
      if (filters.sectionId) params.append('sectionId', filters.sectionId.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.includeInactive !== undefined) params.append('includeInactive', filters.includeInactive.toString());
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.branchId) params.append('branchId', filters.branchId.toString());
      if (filters.courseId) params.append('courseId', filters.courseId.toString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const queryString = params.toString();
      const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
      
      return await secureApiService.get(url);
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  }

  // Get student by ID
  async getStudentById(id: number): Promise<ApiResponse<Student>> {
    try {
      return await secureApiService.get(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Error fetching student:', error);
      throw error;
    }
  }

  // Create new student
  async createStudent(studentData: Partial<Student>): Promise<ApiResponse<Student>> {
    try {
      // Use the dedicated createStudent method that bypasses encryption
      return await secureApiService.createStudent(studentData);
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  }

  // Update student
  async updateStudent(id: number, studentData: Partial<Student>): Promise<ApiResponse<Student>> {
    try {
      // Use the dedicated updateStudent method that bypasses encryption
      return await secureApiService.updateStudent(String(id), studentData);
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  }

  // Delete student
  async deleteStudent(id: number): Promise<ApiResponse<void>> {
    try {
      return await secureApiService.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  }

  // Get student analytics
  async getStudentAnalytics(filters: DashboardFilters = {}): Promise<ApiResponse<StudentAnalytics>> {
    try {
      const params = new URLSearchParams();
      
      if (filters.period) {
        params.append('period', filters.period);
      }
      if (filters.dateRange?.startDate) {
        params.append('startDate', filters.dateRange.startDate);
      }
      if (filters.dateRange?.endDate) {
        params.append('endDate', filters.dateRange.endDate);
      }
      if (filters.classId) {
        params.append('classId', filters.classId.toString());
      }
      if (filters.schoolId) {
        params.append('schoolId', filters.schoolId.toString());
      }
      if (filters.branchId) {
        params.append('branchId', filters.branchId.toString());
      }
      if (filters.courseId) {
        params.append('courseId', filters.courseId.toString());
      }

      const queryString = params.toString();
      const url = queryString ? `${this.baseUrl}/conversion-analytics?${queryString}` : `${this.baseUrl}/conversion-analytics`;
      
      return await secureApiService.get(url);
    } catch (error) {
      console.error('Error fetching student analytics:', error);
      throw error;
    }
  }

  // Get student statistics by class
  async getStudentStatsByClass(filters: any = {}): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();
      
      if (filters.classId) {
        params.append('classId', filters.classId.toString());
      }
      if (filters.schoolId) {
        params.append('schoolId', filters.schoolId.toString());
      }

      const queryString = params.toString();
      const url = queryString ? `${this.baseUrl}/stats/class?${queryString}` : `${this.baseUrl}/stats/class`;
      
      return await secureApiService.get(url);
    } catch (error) {
      console.error('Error fetching student stats by class:', error);
      throw error;
    }
  }

  // Get student statistics by status
  async getStudentStatsByStatus(filters: any = {}): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.schoolId) {
        params.append('schoolId', filters.schoolId.toString());
      }

      const queryString = params.toString();
      const url = queryString ? `${this.baseUrl}/stats/status?${queryString}` : `${this.baseUrl}/stats/status`;
      
      return await secureApiService.get(url);
    } catch (error) {
      console.error('Error fetching student stats by status:', error);
      throw error;
    }
  }

  // Get student attendance
  async getStudentAttendance(studentId: number, filters: any = {}): Promise<ApiResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.classId) params.append('classId', filters.classId.toString());

      const queryString = params.toString();
      const url = queryString 
        ? `${this.baseUrl}/${studentId}/attendance?${queryString}` 
        : `${this.baseUrl}/${studentId}/attendance`;
      
      return await secureApiService.get(url);
    } catch (error) {
      console.error('Error fetching student attendance:', error);
      throw error;
    }
  }

  // Get student grades
  async getStudentGrades(studentId: number, filters: any = {}): Promise<ApiResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      
      if (filters.subjectId) params.append('subjectId', filters.subjectId.toString());
      if (filters.examId) params.append('examId', filters.examId.toString());
      if (filters.academicYear) params.append('academicYear', filters.academicYear);

      const queryString = params.toString();
      const url = queryString 
        ? `${this.baseUrl}/${studentId}/grades?${queryString}` 
        : `${this.baseUrl}/${studentId}/grades`;
      
      return await secureApiService.get(url);
    } catch (error) {
      console.error('Error fetching student grades:', error);
      throw error;
    }
  }

  // Get student transfer certificate
  async getStudentTransferCertificate(studentId: number): Promise<ApiResponse<any>> {
    try {
      return await secureApiService.get(`${this.baseUrl}/${studentId}/transfer-certificate`);
    } catch (error) {
      console.error('Error fetching transfer certificate:', error);
      throw error;
    }
  }

  async downloadStudentDocument(studentId: number | string, documentId: number | string): Promise<Blob> {
    try {
      return await secureApiService.getBlob(`${this.baseUrl}/${studentId}/documents/${documentId}/download`);
    } catch (error) {
      console.error('Error downloading student document:', error);
      throw error;
    }
  }

  // Transfer student (mark as transferred)
  async transferStudent(studentId: number, transferData: {
    transferDate?: string;
    transferReason?: string;
    transferredToSchool?: string;
    remarks?: string;
  }): Promise<ApiResponse<any>> {
    try {
      return await secureApiService.post(`${this.baseUrl}/${studentId}/transfer`, transferData);
    } catch (error) {
      console.error('Error transferring student:', error);
      throw error;
    }
  }

  // Get student payments
  async getStudentPayments(studentId: number, filters: any = {}): Promise<ApiResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const queryString = params.toString();
      const url = queryString 
        ? `${this.baseUrl}/${studentId}/payments?${queryString}` 
        : `${this.baseUrl}/${studentId}/payments`;
      
      return await secureApiService.get(url);
    } catch (error) {
      console.error('Error fetching student payments:', error);
      throw error;
    }
  }

  // Bulk operations
  async bulkCreateStudents(students: Partial<Student>[]): Promise<ApiResponse<Student[]>> {
    try {
      return await secureApiService.post(`${this.baseUrl}/bulk`, { students });
    } catch (error) {
      console.error('Error bulk creating students:', error);
      throw error;
    }
  }

  async bulkUpdateStudents(updates: { id: number; data: Partial<Student> }[]): Promise<ApiResponse<Student[]>> {
    try {
      return await secureApiService.put(`${this.baseUrl}/bulk`, { updates });
    } catch (error) {
      console.error('Error bulk updating students:', error);
      throw error;
    }
  }

  async bulkDeleteStudents(ids: number[]): Promise<ApiResponse<void>> {
    try {
      return await secureApiService.delete(`${this.baseUrl}/bulk`, { data: { ids } });
    } catch (error) {
      console.error('Error bulk deleting students:', error);
      throw error;
    }
  }

  // Export students data
  async exportStudents(filters: StudentFilters = {}, format: 'csv' | 'excel' | 'pdf' = 'csv'): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.classId) params.append('classId', filters.classId.toString());
      if (filters.sectionId) params.append('sectionId', filters.sectionId.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.gender) params.append('gender', filters.gender);
      params.append('format', format);

      const queryString = params.toString();
      const url = queryString ? `${this.baseUrl}/export?${queryString}` : `${this.baseUrl}/export`;
      
      const response = await secureApiService.get(url, { responseType: 'blob' });
      return response.data as Blob;
    } catch (error) {
      console.error('Error exporting students:', error);
      throw error;
    }
  }

  // Upload student avatar
  async uploadAvatar(studentId: number, file: File): Promise<ApiResponse<{ avatarPath: string; filename: string }>> {
    try {
      return await secureApiService.uploadStudentAvatar(`${studentId}`, file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  // Delete student avatar
  async deleteAvatar(studentId: number): Promise<ApiResponse<void>> {
    try {
      return await secureApiService.delete(`${this.baseUrl}/${studentId}/avatar`);
    } catch (error) {
      console.error('Error deleting avatar:', error);
      throw error;
    }
  }
  // Sync student status based on class assignment
  async syncStudentStatus(): Promise<ApiResponse<{ total: number; activated: number; deactivated: number; unchanged: number }>> {
    try {
      return await secureApiService.post(`${this.baseUrl}/sync-status`, {});
    } catch (error) {
      console.error('Error syncing student status:', error);
      throw error;
    }
  }
}

export default new StudentService();