import secureApiService from '../../../services/secureApiService';
import { Subject, SubjectFormData } from '../types/subjects';

const getManagedSchoolId = () => {
  const context = secureApiService.getManagedContext();
  return context.schoolId ? Number(context.schoolId) : 1;
};

export const subjectService = {
  // Get all subjects
  async getSubjects(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: Subject[]; total: number; page: number; limit: number }> {
    const response = await secureApiService.get<Subject[]>('/subjects', {
      params: {
        page: params?.page,
        limit: params?.limit,
        search: params?.search,
      },
    });

    const subjects = response.data || [];
    const pagination = response.meta || {};
    
    return {
      data: subjects,
      total: pagination.total || subjects.length,
      page: pagination.page || 1,
      limit: pagination.limit || 20,
    };
  },

  // Get subject by ID
  async getSubjectById(id: number): Promise<Subject> {
    const response = await secureApiService.get<Subject>(`/subjects/${id}`);
    return response.data;
  },

  // Create subject
  async createSubject(data: SubjectFormData): Promise<Subject> {
    const payload = {
      ...data,
      schoolId: getManagedSchoolId(),
    };
    
    const response = await secureApiService.post<Subject>('/subjects', payload);
    return response.data;
  },

  // Update subject
  async updateSubject(id: number, data: Partial<SubjectFormData>): Promise<Subject> {
    const response = await secureApiService.put<Subject>(`/subjects/${id}`, data);
    return response.data;
  },

  // Delete subject
  async deleteSubject(id: number): Promise<void> {
    await secureApiService.delete(`/subjects/${id}`);
  },

  // Restore subject
  async restoreSubject(id: number): Promise<Subject> {
    const response = await secureApiService.patch<Subject>(`/subjects/${id}/restore`);
    return response.data;
  },
};

export default subjectService;

