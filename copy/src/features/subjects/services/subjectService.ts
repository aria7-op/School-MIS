import secureApiService from '../../../services/secureApiService';
import { Subject, SubjectFormData } from '../types/subjects';

const getManagedSchoolId = () => {
  const context = secureApiService.getManagedContext();
  return context.schoolId ? Number(context.schoolId) : 1;
};

export const subjectService = {
  async getSubjects(params?: {
    page?: number;
    limit?: number;
    search?: string;
    includeInactive?: boolean;
  }): Promise<{ data: Subject[]; total: number; page: number; limit: number }> {
    const response = await secureApiService.get<Subject[]>('/subjects', {
      params: {
        page: params?.page,
        limit: params?.limit,
        search: params?.search,
        ...(params?.includeInactive && { includeInactive: true }),
      },
    });

    const subjects = response.data || [];
    const pagination = response.pagination || response.meta || {};

    return {
      data: subjects,
      total: pagination.total || subjects.length,
      page: pagination.page || 1,
      limit: pagination.limit || 20,
    };
  },

  async getSubjectById(id: number): Promise<Subject> {
    const response = await secureApiService.get<Subject>(`/subjects/${id}`);
    return response.data;
  },

  async createSubject(data: SubjectFormData): Promise<Subject> {
    const payload: Record<string, any> = {
      ...data,
      schoolId: getManagedSchoolId(),
    };

    if (data.departmentId != null) {
      payload.departmentId = Number(data.departmentId);
    }

    const response = await secureApiService.post<Subject>('/subjects', payload);
    return response.data;
  },

  async bulkCreateSubjects(subjects: SubjectFormData[]): Promise<{ success: number; failed: number; errors: any[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const subject of subjects) {
      try {
        const payload: Record<string, any> = {
          ...subject,
          schoolId: getManagedSchoolId(),
        };

        if (subject.departmentId != null) {
          payload.departmentId = Number(subject.departmentId);
        }

        await secureApiService.post<Subject>('/subjects', payload);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          subject: subject.code || subject.name,
          error: error.message || 'Unknown error',
        });
      }
    }

    return results;
  },

  async updateSubject(id: number, data: Partial<SubjectFormData>): Promise<Subject> {
    const payload: Record<string, any> = { ...data };
    delete payload.schoolId;

    if (payload.departmentId !== undefined) {
      payload.departmentId = payload.departmentId ? Number(payload.departmentId) : null;
    }

    const response = await secureApiService.put<Subject>(`/subjects/${id}`, payload);
    return response.data;
  },

  async deleteSubject(id: number): Promise<void> {
    await secureApiService.delete(`/subjects/${id}`);
  },

  async restoreSubject(id: number): Promise<Subject> {
    const response = await secureApiService.patch<Subject>(`/subjects/${id}/restore`);
    return response.data;
  },
};

export default subjectService;

