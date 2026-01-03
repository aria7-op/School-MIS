import React, { createContext, useContext, useReducer, useEffect } from 'react';
import {
  Staff,
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
  CacheStats,
} from '../types';
import staffService from '../services/staffService';

interface StaffState {
  staff: Staff[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: StaffSearchFilters;
  selectedStaff: number[];
  dashboard: StaffDashboard | null;
  report: StaffReport | null;
  stats: StaffStats | null;
  analytics: StaffAnalytics | null;
  performance: StaffPerformance | null;
  comparison: StaffComparison | null;
  cacheStats: CacheStats | null;
}

type StaffAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STAFF'; payload: { staff: Staff[]; pagination: any } }
  | { type: 'ADD_STAFF'; payload: Staff }
  | { type: 'UPDATE_STAFF'; payload: Staff }
  | { type: 'DELETE_STAFF'; payload: number }
  | { type: 'SET_FILTERS'; payload: StaffSearchFilters }
  | { type: 'SET_SELECTED_STAFF'; payload: number[] }
  | { type: 'TOGGLE_STAFF_SELECTION'; payload: number }
  | { type: 'SET_DASHBOARD'; payload: StaffDashboard }
  | { type: 'SET_REPORT'; payload: StaffReport }
  | { type: 'SET_STATS'; payload: StaffStats }
  | { type: 'SET_ANALYTICS'; payload: StaffAnalytics }
  | { type: 'SET_PERFORMANCE'; payload: StaffPerformance }
  | { type: 'SET_COMPARISON'; payload: StaffComparison }
  | { type: 'SET_CACHE_STATS'; payload: CacheStats }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_STATE' };

const initialState: StaffState = {
  staff: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {},
  selectedStaff: [],
  dashboard: null,
  report: null,
  stats: null,
  analytics: null,
  performance: null,
  comparison: null,
  cacheStats: null,
};

const staffReducer = (state: StaffState, action: StaffAction): StaffState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_STAFF':
      return {
        ...state,
        staff: action.payload.staff,
        pagination: action.payload.pagination,
        loading: false,
        error: null,
      };
    
    case 'ADD_STAFF':
      return {
        ...state,
        staff: [action.payload, ...state.staff],
        pagination: {
          ...state.pagination,
          total: state.pagination.total + 1,
        },
      };
    
    case 'UPDATE_STAFF':
      return {
        ...state,
        staff: state.staff.map(s => s.id === action.payload.id ? action.payload : s),
      };
    
    case 'DELETE_STAFF':
      return {
        ...state,
        staff: state.staff.filter(s => s.id !== action.payload),
        selectedStaff: state.selectedStaff.filter(id => id !== action.payload),
        pagination: {
          ...state.pagination,
          total: state.pagination.total - 1,
        },
      };
    
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    
    case 'SET_SELECTED_STAFF':
      return { ...state, selectedStaff: action.payload };
    
    case 'TOGGLE_STAFF_SELECTION':
      const isSelected = state.selectedStaff.includes(action.payload);
      return {
        ...state,
        selectedStaff: isSelected
          ? state.selectedStaff.filter(id => id !== action.payload)
          : [...state.selectedStaff, action.payload],
      };
    
    case 'SET_DASHBOARD':
      return { ...state, dashboard: action.payload };
    
    case 'SET_REPORT':
      return { ...state, report: action.payload };
    
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    
    case 'SET_ANALYTICS':
      return { ...state, analytics: action.payload };
    
    case 'SET_PERFORMANCE':
      return { ...state, performance: action.payload };
    
    case 'SET_COMPARISON':
      return { ...state, comparison: action.payload };
    
    case 'SET_CACHE_STATS':
      return { ...state, cacheStats: action.payload };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
};

interface StaffContextType extends StaffState {
  // CRUD Operations
  createStaff: (data: any) => Promise<Staff>;
  fetchStaff: (filters?: StaffSearchFilters) => Promise<void>;
  fetchStaffById: (id: number) => Promise<Staff>;
  updateStaff: (id: number, data: any) => Promise<Staff>;
  deleteStaff: (id: number) => Promise<void>;
  restoreStaff: (id: number) => Promise<void>;
  
  // Search & Filter
  searchStaff: (query: string) => Promise<Staff[]>;
  setFilters: (filters: StaffSearchFilters) => void;
  clearFilters: () => void;
  
  // Selection
  selectStaff: (id: number) => void;
  deselectStaff: (id: number) => void;
  toggleStaffSelection: (id: number) => void;
  clearSelection: () => void;
  selectAll: () => void;
  
  // Statistics & Analytics
  fetchStaffStats: (id: number) => Promise<StaffStats>;
  fetchStaffAnalytics: (id: number, period?: string) => Promise<StaffAnalytics>;
  fetchStaffPerformance: (id: number) => Promise<StaffPerformance>;
  fetchDashboard: () => Promise<void>;
  fetchReport: (filters?: StaffSearchFilters) => Promise<void>;
  fetchStaffComparison: (id1: number, id2: number) => Promise<StaffComparison>;
  
  // Bulk Operations
  bulkCreateStaff: (data: StaffBulkCreateData) => Promise<BulkOperationResult>;
  bulkUpdateStaff: (data: StaffBulkUpdateData) => Promise<BulkOperationResult>;
  bulkDeleteStaff: (data: StaffBulkDeleteData) => Promise<BulkOperationResult>;
  
  // Export & Import
  exportStaff: (format: string) => Promise<Blob>;
  importStaff: (data: FormData) => Promise<StaffImportResult>;
  
  // Cache Management
  fetchCacheStats: () => Promise<CacheStats>;
  warmCache: (staffId?: number) => Promise<void>;
  clearCache: () => Promise<void>;
  
  // Utility
  clearError: () => void;
  resetState: () => void;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export { StaffContext };

export const StaffProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(staffReducer, initialState);

  const createStaff = async (data: any): Promise<Staff> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const staff = await staffService.createStaff(data);
      dispatch({ type: 'ADD_STAFF', payload: staff });
      return staff;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const fetchStaff = async (filters: StaffSearchFilters = {}): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await staffService.getStaff(filters);
      dispatch({ type: 'SET_STAFF', payload: result });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const fetchStaffById = async (id: number): Promise<Staff> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const staff = await staffService.getStaffById(id);
      return staff;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateStaff = async (id: number, data: any): Promise<Staff> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const staff = await staffService.updateStaff(id, data);
      dispatch({ type: 'UPDATE_STAFF', payload: staff });
      return staff;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteStaff = async (id: number): Promise<void> => {
    try {
      await staffService.deleteStaff(id);
      dispatch({ type: 'DELETE_STAFF', payload: id });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const restoreStaff = async (id: number): Promise<void> => {
    try {
      await staffService.restoreStaff(id);
      // Refresh the staff list to show restored staff
      await fetchStaff(state.filters);
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const searchStaff = async (query: string): Promise<Staff[]> => {
    try {
      return await staffService.searchStaff(query);
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const setFilters = (filters: StaffSearchFilters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const clearFilters = () => {
    dispatch({ type: 'SET_FILTERS', payload: {} });
  };

  const selectStaff = (id: number) => {
    if (!state.selectedStaff.includes(id)) {
      dispatch({ type: 'SET_SELECTED_STAFF', payload: [...state.selectedStaff, id] });
    }
  };

  const deselectStaff = (id: number) => {
    dispatch({ type: 'SET_SELECTED_STAFF', payload: state.selectedStaff.filter(staffId => staffId !== id) });
  };

  const toggleStaffSelection = (id: number) => {
    dispatch({ type: 'TOGGLE_STAFF_SELECTION', payload: id });
  };

  const clearSelection = () => {
    dispatch({ type: 'SET_SELECTED_STAFF', payload: [] });
  };

  const selectAll = () => {
    const allStaffIds = state.staff.map(staff => staff.id);
    dispatch({ type: 'SET_SELECTED_STAFF', payload: allStaffIds });
  };

  const fetchStaffStats = async (id: number): Promise<StaffStats> => {
    try {
      const stats = await staffService.getStaffStats(id);
      dispatch({ type: 'SET_STATS', payload: stats });
      return stats;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const fetchStaffAnalytics = async (id: number, period: string = '30d'): Promise<StaffAnalytics> => {
    try {
      const analytics = await staffService.getStaffAnalytics(id, period);
      dispatch({ type: 'SET_ANALYTICS', payload: analytics });
      return analytics;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const fetchStaffPerformance = async (id: number): Promise<StaffPerformance> => {
    try {
      const performance = await staffService.getStaffPerformance(id);
      dispatch({ type: 'SET_PERFORMANCE', payload: performance });
      return performance;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const fetchDashboard = async (): Promise<void> => {
    try {
      const dashboard = await staffService.getStaffDashboard();
      dispatch({ type: 'SET_DASHBOARD', payload: dashboard });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const fetchReport = async (filters: StaffSearchFilters = {}): Promise<void> => {
    try {
      const report = await staffService.getStaffReport(filters);
      dispatch({ type: 'SET_REPORT', payload: report });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const fetchStaffComparison = async (id1: number, id2: number): Promise<StaffComparison> => {
    try {
      const comparison = await staffService.getStaffComparison(id1, id2);
      dispatch({ type: 'SET_COMPARISON', payload: comparison });
      return comparison;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const bulkCreateStaff = async (data: StaffBulkCreateData): Promise<BulkOperationResult> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await staffService.bulkCreateStaff(data);
      // Refresh staff list after bulk create
      await fetchStaff(state.filters);
      return result;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const bulkUpdateStaff = async (data: StaffBulkUpdateData): Promise<BulkOperationResult> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await staffService.bulkUpdateStaff(data);
      // Refresh staff list after bulk update
      await fetchStaff(state.filters);
      return result;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const bulkDeleteStaff = async (data: StaffBulkDeleteData): Promise<BulkOperationResult> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await staffService.bulkDeleteStaff(data);
      // Clear selection and refresh staff list after bulk delete
      dispatch({ type: 'SET_SELECTED_STAFF', payload: [] });
      await fetchStaff(state.filters);
      return result;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const exportStaff = async (format: string): Promise<Blob> => {
    try {
      return await staffService.exportStaff({ format: format as any });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const importStaff = async (data: FormData): Promise<StaffImportResult> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await staffService.importStaff(data);
      // Refresh staff list after import
      await fetchStaff(state.filters);
      return result;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const fetchCacheStats = async (): Promise<CacheStats> => {
    try {
      const stats = await staffService.getCacheStats();
      dispatch({ type: 'SET_CACHE_STATS', payload: stats });
      return stats;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const warmCache = async (staffId?: number): Promise<void> => {
    try {
      await staffService.warmCache(staffId);
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const clearCache = async (): Promise<void> => {
    try {
      await staffService.clearCache();
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  const contextValue: StaffContextType = {
    ...state,
    createStaff,
    fetchStaff,
    fetchStaffById,
    updateStaff,
    deleteStaff,
    restoreStaff,
    searchStaff,
    setFilters,
    clearFilters,
    selectStaff,
    deselectStaff,
    toggleStaffSelection,
    clearSelection,
    selectAll,
    fetchStaffStats,
    fetchStaffAnalytics,
    fetchStaffPerformance,
    fetchDashboard,
    fetchReport,
    fetchStaffComparison,
    bulkCreateStaff,
    bulkUpdateStaff,
    bulkDeleteStaff,
    exportStaff,
    importStaff,
    fetchCacheStats,
    warmCache,
    clearCache,
    clearError,
    resetState,
  };

  return (
    <StaffContext.Provider value={contextValue}>
      {children}
    </StaffContext.Provider>
  );
};

export const useStaff = (): StaffContextType => {
  const context = useContext(StaffContext);
  if (context === undefined) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  return context;
}; 
