import apiClient from '../../../services/api/client';

// ======================
// CORE STAFF API
// ======================
export const staffApi = {
  // Basic CRUD
  getStaff: (params?: any) => 
    apiClient.get('/staff', { params }),
  
  getStaffById: (id: string, params?: any) => 
    apiClient.get(`/staff/${id}`, { params }),
  
  createStaff: (data: any) => 
    apiClient.post('/staff', data),
  
  updateStaff: (id: string, data: any) => 
    apiClient.put(`/staff/${id}`, data),
  
  deleteStaff: (id: string) => 
    apiClient.delete(`/staff/${id}`),
  
  restoreStaff: (id: string) => 
    apiClient.patch(`/staff/${id}/restore`),
};

// ======================
// ANALYTICS API
// ======================
export const analyticsApi = {
  // Staff analytics
  getStaffAnalytics: (staffId: string, params?: any) => 
    apiClient.get(`/staff/${staffId}/analytics`, { params }),
  
  // Staff performance
  getStaffPerformance: (staffId: string) => 
    apiClient.get(`/staff/${staffId}/performance`),
  
  // Staff dashboard
  getStaffDashboard: (staffId: string) => 
    apiClient.get(`/staff/${staffId}/dashboard`),
  
  // Staff statistics
  getStaffStats: (staffId: string) => 
    apiClient.get(`/staff/${staffId}/stats`),
};

// ======================
// BULK OPERATIONS API
// ======================
export const bulkApi = {
  // Bulk create staff
  bulkCreateStaff: (data: any) => 
    apiClient.post('/staff/bulk/create', data),
  
  // Bulk update staff
  bulkUpdateStaff: (data: any) => 
    apiClient.put('/staff/bulk/update', data),
  
  // Bulk delete staff
  bulkDeleteStaff: (data: any) => 
    apiClient.delete('/staff/bulk/delete', data),
};

// ======================
// SEARCH & EXPORT API
// ======================
export const searchApi = {
  // Advanced search
  searchStaff: (params?: any) => 
    apiClient.get('/staff/search/advanced', { params }),
  
  // Export staff
  exportStaff: (params?: any) => 
    apiClient.get('/staff/export', { params }),
  
  // Import staff
  importStaff: (data: any) => 
    apiClient.post('/staff/import', data),
};

// ======================
// UTILITY API
// ======================
export const utilityApi = {
  // Employee ID suggestions
  getEmployeeIdSuggestions: (params?: any) => 
    apiClient.get('/staff/suggestions/employee-id', { params }),
  
  // Staff count by department
  getStaffCountByDepartment: () => 
    apiClient.get('/staff/stats/department'),
  
  // Staff count by designation
  getStaffCountByDesignation: () => 
    apiClient.get('/staff/stats/designation'),
  
  // Staff by school
  getStaffBySchool: (schoolId: string, params?: any) => 
    apiClient.get(`/staff/school/${schoolId}`, { params }),
  
  // Staff by department
  getStaffByDepartment: (departmentId: string, params?: any) => 
    apiClient.get(`/staff/department/${departmentId}`, { params }),
};

// ======================
// ADVANCED FEATURES API
// ======================
export const advancedApi = {
  // Staff report
  getStaffReport: (params?: any) => 
    apiClient.get('/staff/report', { params }),
  
  // Staff comparison
  getStaffComparison: (params?: any) => 
    apiClient.get('/staff/comparison', { params }),
};

// ======================
// CACHE MANAGEMENT API
// ======================
export const cacheApi = {
  // Get cache stats
  getCacheStats: () => 
    apiClient.get('/staff/cache/stats'),
  
  // Warm cache
  warmCache: (data?: any) => 
    apiClient.post('/staff/cache/warm', data),
  
  // Clear cache
  clearCache: (params?: any) => 
    apiClient.delete('/staff/cache/clear', { params }),
};

// ======================
// COLLABORATION API
// ======================
export const collaborationApi = {
  // Get staff collaboration
  getStaffCollaboration: (staffId: string) => 
    apiClient.get(`/staff/${staffId}/collaboration`),
  
  // Create staff collaboration
  createStaffCollaboration: (staffId: string, data: any) => 
    apiClient.post(`/staff/${staffId}/collaboration`, data),
  
  // Update staff collaboration
  updateStaffCollaboration: (staffId: string, collaborationId: string, data: any) => 
    apiClient.put(`/staff/${staffId}/collaboration/${collaborationId}`, data),
  
  // Delete staff collaboration
  deleteStaffCollaboration: (staffId: string, collaborationId: string) => 
    apiClient.delete(`/staff/${staffId}/collaboration/${collaborationId}`),
  
  // Get staff projects
  getStaffProjects: (staffId: string) => 
    apiClient.get(`/staff/${staffId}/collaboration/projects`),
  
  // Create staff project
  createStaffProject: (staffId: string, data: any) => 
    apiClient.post(`/staff/${staffId}/collaboration/projects`, data),
  
  // Get staff teams
  getStaffTeams: (staffId: string) => 
    apiClient.get(`/staff/${staffId}/collaboration/teams`),
  
  // Assign staff to team
  assignStaffToTeam: (staffId: string, data: any) => 
    apiClient.post(`/staff/${staffId}/collaboration/teams`, data),
  
  // Get staff meetings
  getStaffMeetings: (staffId: string) => 
    apiClient.get(`/staff/${staffId}/collaboration/meetings`),
  
  // Schedule staff meeting
  scheduleStaffMeeting: (staffId: string, data: any) => 
    apiClient.post(`/staff/${staffId}/collaboration/meetings`, data),
};

// ======================
// DOCUMENTS API
// ======================
export const documentsApi = {
  // Get staff documents
  getStaffDocuments: (staffId: string) => 
    apiClient.get(`/staff/${staffId}/documents`),
  
  // Upload staff document
  uploadStaffDocument: (staffId: string, data: any) => 
    apiClient.post(`/staff/${staffId}/documents`, data),
  
  // Get staff document
  getStaffDocument: (staffId: string, documentId: string) => 
    apiClient.get(`/staff/${staffId}/documents/${documentId}`),
  
  // Update staff document
  updateStaffDocument: (staffId: string, documentId: string, data: any) => 
    apiClient.put(`/staff/${staffId}/documents/${documentId}`, data),
  
  // Delete staff document
  deleteStaffDocument: (staffId: string, documentId: string) => 
    apiClient.delete(`/staff/${staffId}/documents/${documentId}`),
  
  // Get document categories
  getDocumentCategories: (staffId: string) => 
    apiClient.get(`/staff/${staffId}/documents/categories`),
  
  // Create document category
  createDocumentCategory: (staffId: string, data: any) => 
    apiClient.post(`/staff/${staffId}/documents/categories`, data),
  
  // Search staff documents
  searchStaffDocuments: (staffId: string, params?: any) => 
    apiClient.get(`/staff/${staffId}/documents/search`, { params }),
  
  // Verify staff document
  verifyStaffDocument: (staffId: string, data: any) => 
    apiClient.post(`/staff/${staffId}/documents/verify`, data),
  
  // Get expiring documents
  getExpiringDocuments: (staffId: string) => 
    apiClient.get(`/staff/${staffId}/documents/expiring`),
};

// ======================
// TASKS API
// ======================
export const tasksApi = {
  // Get staff tasks
  getStaffTasks: (staffId: string) => 
    apiClient.get(`/staff/${staffId}/tasks`),
  
  // Create staff task
  createStaffTask: (staffId: string, data: any) => 
    apiClient.post(`/staff/${staffId}/tasks`, data),
  
  // Get staff task
  getStaffTask: (staffId: string, taskId: string) => 
    apiClient.get(`/staff/${staffId}/tasks/${taskId}`),
  
  // Update staff task
  updateStaffTask: (staffId: string, taskId: string, data: any) => 
    apiClient.put(`/staff/${staffId}/tasks/${taskId}`, data),
  
  // Delete staff task
  deleteStaffTask: (staffId: string, taskId: string) => 
    apiClient.delete(`/staff/${staffId}/tasks/${taskId}`),
  
  // Assign staff task
  assignStaffTask: (staffId: string, taskId: string, data: any) => 
    apiClient.post(`/staff/${staffId}/tasks/${taskId}/assign`, data),
  
  // Complete staff task
  completeStaffTask: (staffId: string, taskId: string) => 
    apiClient.post(`/staff/${staffId}/tasks/${taskId}/complete`),
  
  // Get overdue tasks
  getOverdueTasks: (staffId: string) => 
    apiClient.get(`/staff/${staffId}/tasks/overdue`),
  
  // Get completed tasks
  getCompletedTasks: (staffId: string) => 
    apiClient.get(`/staff/${staffId}/tasks/completed`),
  
  // Get task statistics
  getTaskStatistics: (staffId: string) => 
    apiClient.get(`/staff/${staffId}/tasks/statistics`),
  
  // Bulk assign tasks
  bulkAssignTasks: (staffId: string, data: any) => 
    apiClient.post(`/staff/${staffId}/tasks/bulk-assign`, data),
};

// ======================
// COMPREHENSIVE API EXPORT
// ======================
export default {
  staff: staffApi,
  analytics: analyticsApi,
  bulk: bulkApi,
  search: searchApi,
  utility: utilityApi,
  advanced: advancedApi,
  cache: cacheApi,
  collaboration: collaborationApi,
  documents: documentsApi,
  tasks: tasksApi,
}; 
