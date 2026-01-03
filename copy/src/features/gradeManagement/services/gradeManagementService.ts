import secureApiService from '../../../services/secureApiService';
import type {
  GradeSheet,
  BulkGradeEntryRequest,
  BulkGradeEntryResponse,
  ReportCard,
  ResultsSummary,
  SubjectStatistics,
  TeacherClass,
  FinalResultCalculation,
  ExcelExportOptions
} from '../types/gradeManagement';

class GradeManagementService {
  
  /**
   * Get Excel-like grade sheet by exam TYPE (MIDTERM or FINAL)
   * Matches Excel pattern: just select midterm or final
   */
  async getExcelGradeSheetByType(classId: string, examType: 'MIDTERM' | 'FINAL'): Promise<GradeSheet> {
    try {
      const response = await secureApiService.get(`/excel-grades/class/${classId}/exam-type/${examType}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Excel grade sheet:', error);
      throw error;
    }
  }

  /**
   * Get student list header metadata (principal, committees, etc.)
   */
  async getStudentListHeader(classId: string, examType: 'MIDTERM' | 'FINAL'): Promise<any> {
    try {
      const response = await secureApiService.get(`/excel-grades/class/${classId}/exam-type/${examType}/headers`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student list header:', error);
      throw error;
    }
  }

  /**
   * Save student list header metadata
   */
  async saveStudentListHeader(
    classId: string,
    examType: 'MIDTERM' | 'FINAL',
    payload: {
      fields: Record<string, any>;
      attendanceThreshold?: number;
    }
  ): Promise<any> {
    try {
      const response = await secureApiService.post(
        `/excel-grades/class/${classId}/exam-type/${examType}/headers`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error('Error saving student list header:', error);
      throw error;
    }
  }

  /**
   * Get Excel-like grade sheet for a class and exam (legacy - by exam ID)
   */
  async getExcelGradeSheet(classId: string, examId: string): Promise<GradeSheet> {
    try {
      const response = await secureApiService.get(`/excel-grades/class/${classId}/exam/${examId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Excel grade sheet:', error);
      throw error;
    }
  }

  /**
   * Bulk entry of grades by exam TYPE (Excel pattern)
   */
  async bulkGradeEntryByType(
    classId: string,
    examType: 'MIDTERM' | 'FINAL',
    data: BulkGradeEntryRequest
  ): Promise<BulkGradeEntryResponse> {
    try {
      const response = await secureApiService.post(
        `/excel-grades/class/${classId}/exam-type/${examType}/bulk-entry`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error in bulk grade entry:', error);
      throw error;
    }
  }

  /**
   * Bulk entry of grades (Excel-like) - legacy by exam ID
   */
  async bulkGradeEntry(
    classId: string,
    examId: string,
    data: BulkGradeEntryRequest
  ): Promise<BulkGradeEntryResponse> {
    try {
      const response = await secureApiService.post(
        `/excel-grades/class/${classId}/exam/${examId}/bulk-entry`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error in bulk grade entry:', error);
      throw error;
    }
  }

  /**
   * Generate Excel-like report card for student
   */
  async generateReportCard(studentId: string, examType?: 'midterm' | 'final'): Promise<ReportCard> {
    try {
      const params = examType ? { examType } : {};
      const response = await secureApiService.get(
        `/excel-grades/student/${studentId}/report-card`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating report card:', error);
      throw error;
    }
  }

  /**
   * Get results summary (successful, conditional, failed lists)
   */
  async getResultsSummary(classId: string, examId?: string): Promise<ResultsSummary> {
    try {
      const params = examId ? { examId } : {};
      const response = await secureApiService.get(
        `/excel-grades/class/${classId}/results-summary`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching results summary:', error);
      throw error;
    }
  }

  /**
   * Calculate Excel-like statistics
   */
  async calculateStatistics(classId: string, examId?: string): Promise<{ classId: string; statistics: SubjectStatistics[] }> {
    try {
      const params = examId ? { examId } : {};
      const response = await secureApiService.get(
        `/excel-grades/class/${classId}/statistics`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error calculating statistics:', error);
      throw error;
    }
  }

  /**
   * Get teacher's classes with subjects
   */
  async getTeacherClasses(): Promise<{ teacher: any; classes: TeacherClass[] }> {
    try {
      console.log("🔄 [API] getTeacherClasses() - Starting");
      
      const storedUserRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
      const storedTeacherId = typeof window !== 'undefined' ? localStorage.getItem('teacherId') : null;
      
      console.log("🔄 [API] getTeacherClasses() - StoredUser:", storedUser);
      console.log("🔄 [API] getTeacherClasses() - StoredTeacherId:", storedTeacherId);

      const normalizeRoleValue = (value?: string | null) =>
        value ? value.replace(/\s+/g, '').replace(/-/g, '_').toUpperCase() : undefined;

      const normalizedRole = normalizeRoleValue(storedUser?.role);
      const normalizedOriginalRole = normalizeRoleValue(storedUser?.originalRole);

      const teacherId = storedUser?.teacherId || storedTeacherId || storedUser?.id;
      const hasTeacherMapping = Boolean(teacherId);

      const allowAllClassesForRole =
        (normalizedRole &&
          [
            'SUPER_ADMIN',
            'SCHOOL_ADMIN',
            'ADMIN',
            'OWNER',
            'BRANCH_MANAGER',
          ].includes(normalizedRole)) ||
        (!hasTeacherMapping && normalizedOriginalRole === 'TEACHER') ||
        (!hasTeacherMapping && normalizedRole === 'TEACHER');

      if (!teacherId && !allowAllClassesForRole) {
        console.warn('gradeManagementService.getTeacherClasses → no teacherId found in storage; returning empty list');
        return { teacher: null, classes: [] };
      }

      const teacherIdStr = teacherId ? teacherId.toString() : undefined;

      const normalizeSubjects = (subjects: any[] = []): TeacherClass['subjects'] => {
        return subjects
          .map((subject) => ({
            id: subject?.id?.toString() || subject?.subjectId?.toString() || subject?.code || subject?.subjectCode || '',
            name: subject?.name || subject?.subject?.name || '',
            code: subject?.code || subject?.subjectCode || subject?.subject?.code || '',
          }))
          .filter((subject) => subject.id && subject.name);
      };

      const mapClasses = (
        classesData: any[],
        allowedIds?: Set<string>,
        allowUnassignedFallback = false
      ): TeacherClass[] => {
        if (!Array.isArray(classesData)) {
          return [];
        }

        const filtered = classesData.filter((cls) => {
          if (allowAllClassesForRole) {
            return true;
          }

          const classIdStr = cls?.id?.toString();

          if (allowedIds && allowedIds.size > 0) {
            if (!classIdStr || !allowedIds.has(classIdStr)) {
              return false;
            }
          }

          if (!teacherIdStr) {
            return true;
          }

          const directTeacherId = cls?.teacherId || cls?.classTeacherId;
          const assignedViaSubjects = Array.isArray(cls?.subjects)
            ? cls.subjects.some(
                (subject: any) =>
                  subject?.teacherId?.toString() === teacherIdStr ||
                  subject?.teacher_id?.toString() === teacherIdStr ||
                  subject?.teacher?.id?.toString() === teacherIdStr
              )
            : false;
          const assignedViaClassTeachers = Array.isArray(cls?.classTeachers)
            ? cls.classTeachers.some(
                (assignment: any) =>
                  assignment?.teacherId?.toString() === teacherIdStr ||
                  assignment?.teacher_id?.toString() === teacherIdStr ||
                  assignment?.teacher?.id?.toString() === teacherIdStr
              )
            : false;

          const directTeacherMatches = directTeacherId?.toString()
            ? directTeacherId.toString() === teacherIdStr
            : false;

          if (directTeacherMatches || assignedViaSubjects || assignedViaClassTeachers) {
            return true;
          }

          // Only include unannotated classes when explicitly allowed (backend already filtered)
          if (allowUnassignedFallback && !cls?.classTeachers && !cls?.subjects) {
            return true;
          }

          return false;
        });

        return filtered.map((cls) => {
          const rawLevel = cls?.level ?? cls?.gradeLevel ?? cls?.grade ?? null;
          const parsedLevel =
            typeof rawLevel === 'number'
              ? rawLevel
              : rawLevel !== null
              ? parseInt(rawLevel, 10) || 0
              : 0;

          return {
            id: cls?.id?.toString() || '',
            name: cls?.name || cls?.className || 'Unnamed Class',
            code: cls?.code || cls?.classCode || '',
            level: parsedLevel,
            section: cls?.section || cls?.sectionName || null,
            studentCount:
              cls?.studentCount ??
              cls?._count?.students ??
              (Array.isArray(cls?.students) ? cls.students.length : 0),
            subjects: normalizeSubjects(cls?.subjects),
          };
        });
      };

      // Admin-style roles should be able to see all classes regardless of teacher assignments
      if (allowAllClassesForRole) {
        try {
          const adminResponse = await secureApiService.get(`/classes`, {
            params: {
              page: 1,
              limit: 500,
              include: 'subjects,classTeacher,teachers,students',
            },
          });

          const adminData = adminResponse?.data;
          const adminArray = Array.isArray(adminData?.data)
            ? adminData.data
            : Array.isArray(adminData)
            ? adminData
            : [];

          const adminMapped = mapClasses(adminArray, undefined, true);

          if (adminMapped.length > 0) {
            return {
              teacher: { id: teacherIdStr ?? normalizedRole ?? 'ADMIN' },
              classes: adminMapped,
            };
          }
        } catch (adminError) {
          console.warn('gradeManagementService.getTeacherClasses → failed to fetch classes for SUPER_ADMIN', adminError);
        }
      }

      let assignedClassIds: Set<string> | undefined;
      let fallbackClassesMapped: TeacherClass[] = [];

      try {
        if (teacherIdStr) {
          const fallbackResponse = await secureApiService.get(`/classes/teacher/${teacherIdStr}`, {
            params: {
              include: 'students,subjects,classTeachers',
              limit: 100,
            },
          });

          const fallbackData = fallbackResponse?.data;
          const fallbackArray = Array.isArray(fallbackData?.classes)
            ? fallbackData.classes
            : Array.isArray(fallbackData)
            ? fallbackData
            : [];

          if (fallbackArray.length > 0 && !allowAllClassesForRole) {
            assignedClassIds = new Set(
              fallbackArray
                .map((cls: any) => cls?.id?.toString())
                .filter((id: string | undefined): id is string => !!id)
            );
            fallbackClassesMapped = mapClasses(fallbackArray, assignedClassIds, false);
          } else if (allowAllClassesForRole) {
            fallbackClassesMapped = mapClasses(fallbackArray, undefined, true);
          }
        }
      } catch (fallbackError) {
        console.warn('gradeManagementService.getTeacherClasses → fallback classes endpoint failed', fallbackError);
      }

      // Try primary Excel-grade endpoint with explicit teacherId filter
      let responseData: any;
      if (teacherIdStr) {
        try {
          const response = await secureApiService.get(`/excel-grades/teacher/classes`, {
            params: { teacherId: teacherIdStr },
          });
          responseData = response?.data;
        } catch (primaryError) {
          console.warn('gradeManagementService.getTeacherClasses → excel teacher classes endpoint failed', primaryError);
        }
      }

      const primaryAllowUnassigned = allowAllClassesForRole || !(responseData?.isAdmin === true);
      let primaryClasses: TeacherClass[] = [];

      if (responseData?.classes) {
        primaryClasses = mapClasses(
          responseData.classes,
          allowAllClassesForRole ? undefined : assignedClassIds,
          primaryAllowUnassigned
        );
      } else if (Array.isArray(responseData)) {
        primaryClasses = mapClasses(
          responseData,
          allowAllClassesForRole ? undefined : assignedClassIds,
          primaryAllowUnassigned
        );
      }

      const classesById = new Map<string, TeacherClass>();
      for (const cls of fallbackClassesMapped) {
        classesById.set(cls.id, cls);
      }
      for (const cls of primaryClasses) {
        classesById.set(cls.id, cls);
      }

      if (classesById.size > 0) {
        const result = {
          teacher: responseData?.teacher ?? { id: teacherIdStr ?? 'SUPER_ADMIN' },
          classes: Array.from(classesById.values()),
        };
        console.log("✅ [API] getTeacherClasses() - Result:", result);
        return result;
      }

      const emptyResult = {
        teacher: { id: teacherIdStr ?? 'SUPER_ADMIN' },
        classes: [],
      };
      console.log("⚠️ [API] getTeacherClasses() - No classes found:", emptyResult);
      return emptyResult;
    } catch (error) {
      console.error('❌ [API] getTeacherClasses() - Error:', error);
      throw error;
    }
  }

  /**
   * Calculate final results (midterm + annual)
   */
  async calculateFinalResults(
    classId: string,
    midtermExamId: string,
    annualExamId: string
  ): Promise<{ classId: string; results: FinalResultCalculation[] }> {
    try {
      const response = await secureApiService.post(
        `/excel-grades/calculate-final-results`,
        {
          classId,
          midtermExamId,
          annualExamId
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error calculating final results:', error);
      throw error;
    }
  }

  /**
   * Export to Excel
   */
  async exportToExcel(classId: string, examId: string, options?: ExcelExportOptions): Promise<Blob> {
    try {
      const response = await secureApiService.get(
        `/excel-grades/export/${classId}/${examId}`,
        { params: options, responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  }

  /**
   * Get all exams for a class
   */
  async getClassExams(classId: string): Promise<any[]> {
    try {
      const response = await secureApiService.get(`/exams`, { params: { classId } });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching class exams:', error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  /**
   * Get class subjects
   */
  async getClassSubjects(classId: string): Promise<any[]> {
    try {
      const response = await secureApiService.get(`/subjects`, { params: { classId } });
      return response.data;
    } catch (error) {
      console.error('Error fetching class subjects:', error);
      throw error;
    }
  }

  /**
   * Get class students
   */
  async getClassStudents(classId: string): Promise<any[]> {
    try {
      const response = await secureApiService.get(`/students`, { params: { classId } });
      return response.data;
    } catch (error) {
      console.error('Error fetching class students:', error);
      throw error;
    }
  }

  /**
   * Get class students with parent information
   */
  async getClassStudentsWithParents(classId: string): Promise<any[]> {
    try {
      const response = await secureApiService.get(`/students`, { params: { classId, include: 'user,parent' } });
      return response.data;
    } catch (error) {
      console.error('Error fetching class students with parents:', error);
      throw error;
    }
  }

  /**
   * Save subject component marks (شقه sheet pattern)
   * Saves breakdown: تحریری, تقریری/عملی, فعالیت صنفی, کار خانگی
   */
  async saveSubjectComponentMarks(
    classId: string,
    examType: 'MIDTERM' | 'FINAL',
    subjectId: string,
    marks: Array<{
      studentId: string;
      written: number;
      practical: number;
      activity: number;
      homework: number;
      isAbsent?: boolean;
    }>
  ): Promise<any> {
    try {
      const response = await secureApiService.post(
        `/excel-grades/class/${classId}/exam-type/${examType}/subject-components`,
        { subjectId, marks }
      );
      return response.data;
    } catch (error) {
      console.error('Error saving component marks:', error);
      throw error;
    }
  }

  /**
   * Get subject component marks (شقه sheet pattern)
   * Retrieves breakdown: تحریری, تقریری/عملی, فعالیت صنفی, کار خانگی
   */
  async getSubjectComponentMarks(
    classId: string,
    examType: 'MIDTERM' | 'FINAL',
    subjectId: string
  ): Promise<any> {
    try {
      const response = await secureApiService.get(
        `/excel-grades/class/${classId}/exam-type/${examType}/subject/${subjectId}/components`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching component marks:', error);
      throw error;
    }
  }

  /**
   * Get the count of subjects for a class
   * Uses the correct endpoint: /classes/{classId}/subjects
   */
  async getClassSubjectCount(classId: string): Promise<number> {
    try {
      console.log(`🔄 [API] getClassSubjectCount() - Starting for class: ${classId}`);
      
      const response = await secureApiService.get(
        `/classes/${classId}/subjects`
      );
      
      console.log(`🔄 [API] getClassSubjectCount() - Full response for class ${classId}:`, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        dataLength: Array.isArray(response.data) ? response.data.length : 'N/A'
      });
      
      // The API returns an array of subjects
      if (Array.isArray(response.data)) {
        const count = response.data.length;
        console.log(`✅ [API] getClassSubjectCount() - Class ${classId} has ${count} subjects`);
        console.log(`✅ [API] getClassSubjectCount() - Subjects:`, response.data);
        return count;
      }
      
      // Fallback: return 0 if no subjects found
      console.warn(`⚠️ [API] getClassSubjectCount() - Data is not an array for class ${classId}`);
      return 0;
    } catch (error) {
      console.error(`❌ [API] getClassSubjectCount() - Error for class ${classId}:`, {
        error,
        message: (error as any)?.message,
        response: (error as any)?.response
      });
      // Return 0 instead of throwing to prevent UI breaking
      return 0;
    }
  }
}

export default new GradeManagementService();

