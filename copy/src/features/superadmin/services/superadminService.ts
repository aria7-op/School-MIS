import secureApiService from '../../../services/secureApiService';

const BASE_URL = '/superadmin';

// ======================
// OVERVIEW DASHBOARD
// ======================
export const getOverviewDashboard = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/dashboard/overview`, { params });
  return response.data;
};

// ======================
// FINANCIAL ANALYTICS
// ======================
export const getFinancialOverview = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/analytics/financial/overview`, { params });
  return response.data;
};

export const getRevenueAnalytics = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/analytics/financial/revenue`, { params });
  return response.data;
};

export const getExpenseAnalytics = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/analytics/financial/expenses`, { params });
  return response.data;
};

export const getProfitLossReport = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/analytics/financial/profit-loss`, { params });
  return response.data;
};

export const getPaymentTrends = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/analytics/financial/payment-trends`, { params });
  return response.data;
};

export const getSchoolFinancialComparison = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/analytics/financial/school-comparison`, { params });
  return response.data;
};

// ======================
// ACADEMIC ANALYTICS
// ======================
export const getAcademicOverview = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/analytics/academic/overview`, { params });
  return response.data;
};

export const getStudentPerformanceAnalytics = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/analytics/academic/student-performance`, { params });
  return response.data;
};

export const getAttendanceAnalytics = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/analytics/academic/attendance`, { params });
  return response.data;
};

export const getExamResultsAnalytics = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/analytics/academic/exam-results`, { params });
  return response.data;
};

export const getSubjectPerformanceAnalytics = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/analytics/academic/subject-performance`, { params });
  return response.data;
};

// ======================
// USER ANALYTICS
// ======================
export const getUsersOverview = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/analytics/users/overview`, { params });
  return response.data;
};

export const getUsers = async (params?: any) => {
  const response = await secureApiService.get('/users', { params });
  // response is already ApiResponse<T>, extract the data array
  console.log('getUsers response:', { response, dataLength: response?.data?.length });
  return response?.data ? response.data : response;
};

export const getStudentAnalytics = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/analytics/users/students`, { params });
  return response.data;
};

export const getTeacherAnalytics = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/analytics/users/teachers`, { params });
  return response.data;
};

export const getStaffAnalytics = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/analytics/users/staff`, { params });
  return response.data;
};

export const getParentAnalytics = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/analytics/users/parents`, { params });
  return response.data;
};

export const getUserActivityAnalytics = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/analytics/users/activity`, { params });
  return response.data;
};

// ======================
// SCHOOL ANALYTICS
// ======================
export const getSchoolsOverview = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/analytics/schools/overview`, { params });
  return response.data;
};

export const getSchoolPerformanceComparison = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/analytics/schools/performance-comparison`, { params });
  return response.data;
};

export const getSchoolDetailedAnalytics = async (schoolId: string, params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/analytics/schools/${schoolId}/detailed`, { params });
  return response.data;
};

// ======================
// SYSTEM HEALTH & PERFORMANCE
// ======================
export const getSystemHealth = async () => {
  const response = await secureApiService.get(`${BASE_URL}/system/health`);
  return response.data;
};

export const getSystemPerformance = async () => {
  const response = await secureApiService.get(`${BASE_URL}/system/performance`);
  return response.data;
};

export const getActivityLogs = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/system/activity-logs`, { params });
  return response.data;
};

export const getAuditLogs = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/system/audit-logs`, { params });
  return response.data;
};

// ======================
// SCHOOL STRUCTURE MANAGEMENT
// ======================
export const getSchools = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/schools`, { params });
  return response.data ?? response;
};

export const getSchoolBranches = async (schoolId: string) => {
  const response = await secureApiService.get(`${BASE_URL}/schools/${schoolId}/branches`);
  return response.data ?? response;
};

export const createSchoolBranch = async (schoolId: string, payload: any) => {
  const response = await secureApiService.post(`${BASE_URL}/schools/${schoolId}/branches`, payload);
  return response.data ?? response;
};

export const updateSchoolBranch = async (schoolId: string, branchId: string, payload: any) => {
  const response = await secureApiService.put(`${BASE_URL}/schools/${schoolId}/branches/${branchId}`, payload);
  return response.data ?? response;
};

export const archiveSchoolBranch = async (schoolId: string, branchId: string) => {
  const response = await secureApiService.delete(`${BASE_URL}/schools/${schoolId}/branches/${branchId}`);
  return response.data ?? response;
};

export const assignBranchManager = async (schoolId: string, branchId: string, payload: any) => {
  const response = await secureApiService.post(`${BASE_URL}/schools/${schoolId}/branches/${branchId}/managers`, payload);
  return response.data ?? response;
};

export const revokeBranchManager = async (schoolId: string, branchId: string, managerId: string) => {
  const response = await secureApiService.delete(`${BASE_URL}/schools/${schoolId}/branches/${branchId}/managers/${managerId}`);
  return response.data ?? response;
};

export const getSchoolCourses = async (schoolId: string) => {
  const response = await secureApiService.get(`${BASE_URL}/schools/${schoolId}/courses`);
  return response.data ?? response;
};

export const createSchoolCourse = async (schoolId: string, payload: any) => {
  const response = await secureApiService.post(`${BASE_URL}/schools/${schoolId}/courses`, payload);
  return response.data ?? response;
};

export const updateSchoolCourse = async (schoolId: string, courseId: string, payload: any) => {
  const response = await secureApiService.put(`${BASE_URL}/schools/${schoolId}/courses/${courseId}`, payload);
  return response.data ?? response;
};

export const archiveSchoolCourse = async (schoolId: string, courseId: string) => {
  const response = await secureApiService.delete(`${BASE_URL}/schools/${schoolId}/courses/${courseId}`);
  return response.data ?? response;
};

export const assignCourseManager = async (schoolId: string, courseId: string, payload: any) => {
  const response = await secureApiService.post(`${BASE_URL}/schools/${schoolId}/courses/${courseId}/managers`, payload);
  return response.data ?? response;
};

export const revokeCourseManager = async (schoolId: string, courseId: string, managerId: string) => {
  const response = await secureApiService.delete(`${BASE_URL}/schools/${schoolId}/courses/${courseId}/managers/${managerId}`);
  return response.data ?? response;
};

// ======================
// ADVANCED REPORTS
// ======================
export const getComprehensiveReport = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/reports/comprehensive`, { params });
  return response.data;
};

export const getEnrollmentTrends = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/reports/enrollment-trends`, { params });
  return response.data;
};

export const getFinancialSummaryReport = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/reports/financial-summary`, { params });
  return response.data;
};

export const getAcademicSummaryReport = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/reports/academic-summary`, { params });
  return response.data;
};

export const exportReport = async (data: any) => {
  const response = await secureApiService.post(`${BASE_URL}/reports/export`, data);
  return response.data;
};

// ======================
// REAL-TIME METRICS
// ======================
export const getRealTimeMetrics = async () => {
  const response = await secureApiService.get(`${BASE_URL}/metrics/real-time`);
  return response.data;
};

export const getSystemAlerts = async () => {
  const response = await secureApiService.get(`${BASE_URL}/metrics/alerts`);
  return response.data;
};

// ======================
// DATA INSIGHTS & PREDICTIONS
// ======================
export const getEnrollmentPredictions = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/insights/enrollment-predictions`, params);
  return response.data;
};

export const getRevenueForecast = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/insights/revenue-forecasting`, params);
  return response.data;
};

export const getRiskAnalysis = async (params?: any) => {
  const response = await secureApiService.get(`${BASE_URL}/insights/risk-analysis`, params);
  return response.data;
};

export const getStructureQuota = async (schoolId: string) => {
  const response = await secureApiService.get(`${BASE_URL}/schools/${schoolId}/structure-quota`);
  return response.data;
};

export default {
  // Overview
  getOverviewDashboard,
  
  // Financial
  getFinancialOverview,
  getRevenueAnalytics,
  getExpenseAnalytics,
  getProfitLossReport,
  getPaymentTrends,
  getSchoolFinancialComparison,
  
  // Academic
  getAcademicOverview,
  getStudentPerformanceAnalytics,
  getAttendanceAnalytics,
  getExamResultsAnalytics,
  getSubjectPerformanceAnalytics,
  
  // Users
  getUsersOverview,
  getUsers,
  getStudentAnalytics,
  getTeacherAnalytics,
  getStaffAnalytics,
  getParentAnalytics,
  getUserActivityAnalytics,
  
  // Schools
  getSchoolsOverview,
  getSchoolPerformanceComparison,
  getSchoolDetailedAnalytics,
  
  // System
  getSystemHealth,
  getSystemPerformance,
  getActivityLogs,
  getAuditLogs,
  
  // Reports
  getComprehensiveReport,
  getEnrollmentTrends,
  getFinancialSummaryReport,
  getAcademicSummaryReport,
  exportReport,
  
  // Real-time
  getRealTimeMetrics,
  getSystemAlerts,
  
  // Insights
  getEnrollmentPredictions,
  getRevenueForecast,
  getRiskAnalysis,

  // Structure
  getStructureQuota,
  getSchools,
  getSchoolBranches,
  createSchoolBranch,
  updateSchoolBranch,
  archiveSchoolBranch,
  assignBranchManager,
  revokeBranchManager,
  getSchoolCourses,
  createSchoolCourse,
  updateSchoolCourse,
  archiveSchoolCourse,
  assignCourseManager,
  revokeCourseManager,
};

