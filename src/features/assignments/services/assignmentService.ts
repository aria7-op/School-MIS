import axios from 'axios';

const API_BASE_URL = 'https://khwanzay.school/api';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  status: string;
  class: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
  };
  attachments?: Array<{
    id: string;
    name: string;
    path: string;
    mimeType: string;
    size: number;
  }>;
  submissionCount?: number;
  createdAt: string;
}

class AssignmentService {
  private getAuthHeaders() {
    const token = localStorage.getItem('userToken') || localStorage.getItem('authToken') || localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private getAuthHeadersForFileUpload() {
    const token = localStorage.getItem('userToken') || localStorage.getItem('authToken') || localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  // Get all assignments for teacher
  async getTeacherAssignments(params?: {
    search?: string;
    classId?: string;
    subjectId?: string;
  }): Promise<{ success: boolean; data: Assignment[] }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.classId) queryParams.append('classId', params.classId);
      if (params?.subjectId) queryParams.append('subjectId', params.subjectId);

      const response = await axios.get(
        `${API_BASE_URL}/assignments/teacher${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
        { headers: this.getAuthHeaders() }
      );

      return {
        success: true,
        data: response.data.data || response.data || [],
      };
    } catch (error: any) {
      console.error('Error fetching teacher assignments:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch assignments');
    }
  }

  // Get assignments for parent/student
  async getStudentAssignments(studentId?: string): Promise<{ success: boolean; data: Assignment[] }> {
    try {
      const queryParams = studentId ? `?studentId=${studentId}` : '';
      const response = await axios.get(
        `${API_BASE_URL}/assignments${queryParams}`,
        { headers: this.getAuthHeaders() }
      );

      return {
        success: true,
        data: response.data.data || response.data || [],
      };
    } catch (error: any) {
      console.error('Error fetching student assignments:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch assignments');
    }
  }

  // Create assignment with file support
  async createAssignment(assignmentData: any, files?: File[]): Promise<{ success: boolean; data: Assignment }> {
    try {
      const formData = new FormData();
      
      // Add assignment data as JSON string
      formData.append('assignmentData', JSON.stringify(assignmentData));

      // Add files if provided
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append('files', file);
        });
      }

      const response = await axios.post(
        `${API_BASE_URL}/assignments`,
        formData,
        {
          headers: this.getAuthHeadersForFileUpload(),
        }
      );

      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      throw new Error(error.response?.data?.message || 'Failed to create assignment');
    }
  }

  // Update assignment with file support
  async updateAssignment(assignmentId: string, assignmentData: any, files?: File[]): Promise<{ success: boolean; data: Assignment }> {
    try {
      const formData = new FormData();
      
      // Add assignment data as JSON string
      formData.append('assignmentData', JSON.stringify(assignmentData));

      // Add files if provided
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append('files', file);
        });
      }

      const response = await axios.put(
        `${API_BASE_URL}/assignments/${assignmentId}`,
        formData,
        {
          headers: this.getAuthHeadersForFileUpload(),
        }
      );

      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      throw new Error(error.response?.data?.message || 'Failed to update assignment');
    }
  }

  // Delete assignment
  async deleteAssignment(assignmentId: string): Promise<{ success: boolean }> {
    try {
      await axios.delete(
        `${API_BASE_URL}/assignments/${assignmentId}`,
        { headers: this.getAuthHeaders() }
      );

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete assignment');
    }
  }

  // Get assignment by ID
  async getAssignmentById(assignmentId: string): Promise<{ success: boolean; data: Assignment }> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/assignments/${assignmentId}`,
        { headers: this.getAuthHeaders() }
      );

      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error: any) {
      console.error('Error fetching assignment:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch assignment');
    }
  }

  // Submit assignment (for students)
  async submitAssignment(assignmentId: string, formData: FormData): Promise<{ success: boolean; data?: any }> {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('authToken') || localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_BASE_URL}/assignments/${assignmentId}/submit`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error: any) {
      console.error('Error submitting assignment:', error);
      throw new Error(error.response?.data?.message || 'Failed to submit assignment');
    }
  }

  // Download attachment
  async downloadAttachment(attachmentId: string): Promise<Blob> {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('authToken') || localStorage.getItem('token');
      
      const response = await axios.get(
        `${API_BASE_URL}/assignments/attachments/${attachmentId}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob',
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error downloading attachment:', error);
      throw new Error(error.response?.data?.message || 'Failed to download attachment');
    }
  }

  // Mark assignment as seen (for parents)
  async markAsSeen(assignmentId: string, parentId: string): Promise<{ success: boolean }> {
    try {
      await axios.post(
        `${API_BASE_URL}/assignments/${assignmentId}/mark-seen`,
        {
          parentId,
          viewedAt: new Date().toISOString(),
        },
        { headers: this.getAuthHeaders() }
      );

      return { success: true };
    } catch (error: any) {
      console.error('Error marking assignment as seen:', error);
      throw new Error(error.response?.data?.message || 'Failed to mark assignment as seen');
    }
  }

  // Acknowledge assignment (for parents)
  async acknowledgeAssignment(assignmentId: string, parentId: string, notes?: string): Promise<{ success: boolean }> {
    try {
      await axios.post(
        `${API_BASE_URL}/assignments/${assignmentId}/acknowledge`,
        {
          parentId,
          acknowledgedAt: new Date().toISOString(),
          notes,
        },
        { headers: this.getAuthHeaders() }
      );

      return { success: true };
    } catch (error: any) {
      console.error('Error acknowledging assignment:', error);
      throw new Error(error.response?.data?.message || 'Failed to acknowledge assignment');
    }
  }

  // Get classes
  async getClasses(): Promise<{ success: boolean; data: Array<{ id: string; name: string }> }> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/classes`,
        { headers: this.getAuthHeaders() }
      );

      return {
        success: true,
        data: response.data.data || response.data || [],
      };
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch classes');
    }
  }

  // Get subjects
  async getSubjects(): Promise<{ success: boolean; data: Array<{ id: string; name: string }> }> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/subjects`,
        { headers: this.getAuthHeaders() }
      );

      return {
        success: true,
        data: response.data.data || response.data || [],
      };
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch subjects');
    }
  }

  // Get subjects for a class
  async getClassSubjects(classId: string): Promise<{ success: boolean; data: Array<{ id: string; name: string }> }> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/classes/${classId}/subjects`,
        { headers: this.getAuthHeaders() }
      );

      return {
        success: true,
        data: response.data.data || response.data || [],
      };
    } catch (error: any) {
      console.error('Error fetching class subjects:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch class subjects');
    }
  }
}

export default new AssignmentService();