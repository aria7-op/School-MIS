import secureApiService from '../../../services/secureApiService';

// ======================
// TYPES & INTERFACES
// ======================

export interface Exam {
  id: string;
  uuid: string;
  name: string;
  code: string;
  type: 'MIDTERM' | 'FINAL' | 'QUIZ' | 'ASSIGNMENT' | 'PROJECT' | 'PRACTICAL';
  startDate: string;
  endDate: string;
  description?: string;
  totalMarks: number;
  passingMarks: number;
  termId?: string;
  classId?: string;
  subjectId?: string;
  schoolId: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  term?: {
    id: string;
    name: string;
    type: string;
  };
  class?: {
    id: string;
    name: string;
    grade: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  grades?: Grade[];
  timetable?: ExamTimetable[];
}

export interface Grade {
  id: string;
  uuid: string;
  examId: string;
  studentId: string;
  subjectId: string;
  marks: number;
  grade?: string;
  remarks?: string;
  isAbsent: boolean;
  student: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface ExamTimetable {
  id: string;
  uuid: string;
  examId: string;
  subjectId: string;
  date: string;
  startTime: string;
  endTime: string;
  roomNumber?: string;
}

export interface CreateExamData {
  name: string;
  code: string;
  type: 'MIDTERM' | 'FINAL' | 'QUIZ' | 'ASSIGNMENT' | 'PROJECT' | 'PRACTICAL';
  startDate: string;
  endDate: string;
  description?: string;
  totalMarks: number;
  passingMarks: number;
  termId?: string;
  classId?: string;
  subjectId?: string;
}

export interface UpdateExamData {
  name?: string;
  type?: 'MIDTERM' | 'FINAL' | 'QUIZ' | 'ASSIGNMENT' | 'PROJECT' | 'PRACTICAL';
  startDate?: string;
  endDate?: string;
  description?: string;
  totalMarks?: number;
  passingMarks?: number;
  termId?: string;
  classId?: string;
  subjectId?: string;
}

export interface ExamFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'MIDTERM' | 'FINAL' | 'QUIZ' | 'ASSIGNMENT' | 'PROJECT' | 'PRACTICAL';
  classId?: string;
  subjectId?: string;
  termId?: string;
  startDate?: string;
  endDate?: string;
  include?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ExamStats {
  totalStudents: number;
  averageMarks: number;
  passRate: number;
  highestMarks: number;
  lowestMarks: number;
  gradeDistribution: {
    [grade: string]: number;
  };
}

export interface ExamAnalytics {
  performance: {
    averageScore: number;
    passRate: number;
    failRate: number;
    absenteeRate: number;
  };
  trends: {
    period: string;
    scores: number[];
    dates: string[];
  };
  comparison: {
    previousExam?: {
      averageScore: number;
      passRate: number;
    };
    classAverage: number;
    subjectAverage: number;
  };
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: string[];
  results: any[];
}

// ======================
// API FUNCTIONS
// ======================

class ExamApi {
  private baseUrl = '/exams';

  // ======================
  // CRUD OPERATIONS
  // ======================

  async getExams(filters: ExamFilters = {}): Promise<{
    data: Exam[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    
    return await secureApiService.get(url);
  }

  async getExamById(id: string, include?: string): Promise<Exam> {
    const params = include ? `?include=${include}` : '';
    return await secureApiService.get(`${this.baseUrl}/${id}${params}`);
  }

  async createExam(data: CreateExamData): Promise<Exam> {
    return await secureApiService.post(this.baseUrl, data);
  }

  async updateExam(id: string, data: UpdateExamData): Promise<Exam> {
    return await secureApiService.put(`${this.baseUrl}/${id}`, data);
  }

  async deleteExam(id: string): Promise<{ success: boolean; message: string }> {
    return await secureApiService.delete(`${this.baseUrl}/${id}`);
  }

  async restoreExam(id: string): Promise<{ success: boolean; message: string }> {
    return await secureApiService.patch(`${this.baseUrl}/${id}/restore`);
  }

  // ======================
  // ANALYTICS & REPORTING
  // ======================

  async getExamStats(id: string): Promise<ExamStats> {
    return await secureApiService.get(`${this.baseUrl}/${id}/stats`);
  }

  async getExamAnalytics(id: string, period: string = '30d'): Promise<ExamAnalytics> {
    return await secureApiService.get(`${this.baseUrl}/${id}/analytics?period=${period}`);
  }

  async getExamPerformance(id: string): Promise<any> {
    return await secureApiService.get(`${this.baseUrl}/${id}/performance`);
  }

  // ======================
  // BULK OPERATIONS
  // ======================

  async bulkCreateExams(exams: CreateExamData[], skipDuplicates: boolean = false): Promise<BulkOperationResult> {
    return await secureApiService.post(`${this.baseUrl}/bulk/create`, {
      exams,
      skipDuplicates
    });
  }

  async bulkUpdateExams(updates: { id: string; data: UpdateExamData }[]): Promise<BulkOperationResult> {
    return await secureApiService.put(`${this.baseUrl}/bulk/update`, { updates });
  }

  async bulkDeleteExams(examIds: string[]): Promise<BulkOperationResult> {
    return await secureApiService.delete(`${this.baseUrl}/bulk/delete`, { examIds });
  }

  // ======================
  // SEARCH & FILTER
  // ======================

  async searchExams(query: string, include?: string): Promise<Exam[]> {
    const params = new URLSearchParams({ q: query });
    if (include) params.append('include', include);
    
    return await secureApiService.get(`${this.baseUrl}/search?${params.toString()}`);
  }

  // ======================
  // UTILITY ENDPOINTS
  // ======================

  async getExamsByClass(classId: string, include?: string): Promise<Exam[]> {
    const params = include ? `?include=${include}` : '';
    return await secureApiService.get(`${this.baseUrl}/class/${classId}${params}`);
  }

  async getExamsBySubject(subjectId: string, include?: string): Promise<Exam[]> {
    const params = include ? `?include=${include}` : '';
    return await secureApiService.get(`${this.baseUrl}/subject/${subjectId}${params}`);
  }

  async getUpcomingExams(days: number = 30, include?: string): Promise<Exam[]> {
    const params = new URLSearchParams({ days: String(days) });
    if (include) params.append('include', include);
    
    return await secureApiService.get(`${this.baseUrl}/upcoming?${params.toString()}`);
  }

  // ======================
  // REPORTING
  // ======================

  async generateExamReport(filters: ExamFilters = {}): Promise<any> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}/report?${queryString}` : `${this.baseUrl}/report`;
    
    return await secureApiService.get(url);
  }

  // ======================
  // IMPORT/EXPORT
  // ======================

  async exportExams(format: 'csv' | 'json' = 'csv', filters: ExamFilters = {}): Promise<Blob> {
    const params = new URLSearchParams({ format });
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`/api${this.baseUrl}/export?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }

  async importExams(exams: CreateExamData[]): Promise<BulkOperationResult> {
    return await secureApiService.post(`${this.baseUrl}/import`, { exams });
  }

  // ======================
  // CACHE MANAGEMENT
  // ======================

  async getCacheStats(): Promise<any> {
    return await secureApiService.get(`${this.baseUrl}/cache/stats`);
  }

  async warmCache(examId?: string): Promise<{ success: boolean; message: string }> {
    const url = examId ? `${this.baseUrl}/cache/warm/${examId}` : `${this.baseUrl}/cache/warm`;
    return await secureApiService.post(url);
  }

  async clearCache(all: boolean = false): Promise<{ success: boolean; message: string }> {
    const params = all ? '?all=true' : '';
    return await secureApiService.delete(`${this.baseUrl}/cache/clear${params}`);
  }
}

export default new ExamApi();