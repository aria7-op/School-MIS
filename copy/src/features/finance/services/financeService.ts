import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import secureApiService from '../../../services/secureApiService';
import { 
  Payment, 
  CreatePaymentData, 
  Expense, 
  CreateExpenseData, 
  Payroll, 
  CreatePayrollData, 
  FinanceAnalytics, 
  FinanceFilters,
  FinanceStats,
  PaginatedResponse,
  FinanceApiResponse
} from '../types/finance';

// API Functions using secureApiService
const api = {
  // Payments
  getPayments: async (filters?: FinanceFilters): Promise<PaginatedResponse<Payment>> => {
    const {
      scopeKey: _scopeKey,
      scopeMode: _scopeMode,
      schoolId,
      branchId,
      courseId,
      ...filterValues
    } = filters || {};

    const params: any = {};
    if (filterValues?.dateRange) {
      params.startDate = filterValues.dateRange.startDate;
      params.endDate = filterValues.dateRange.endDate;
    }
    if (filterValues?.status) params.status = filterValues.status;
    if (filterValues?.method) params.method = filterValues.method;
    if (filterValues?.studentId) params.studentId = filterValues.studentId.toString();
    // Pagination
    if (filterValues?.page) params.page = filterValues.page;
    const limit = filterValues?.limit || filterValues?.per_page || filterValues?.pageSize;
    if (limit) params.limit = limit;
    if (schoolId !== undefined && schoolId !== null) params.schoolId = schoolId;
    if (branchId !== undefined && branchId !== null) params.branchId = branchId;
    if (courseId !== undefined && courseId !== null) params.courseId = courseId;
    // Ensure we get nested relations required for UI (student name and class)
    params.include = 'student.user,student.class';

    const response = await secureApiService.getPayments(params);

    // Normalize amounts and dates coming in non-standard formats
    const rawData = (response as any)?.data?.data || (response as any)?.data || [];
    const paginationMeta = (response as any)?.pagination || (response as any)?.data?.pagination || (response as any)?.meta;

    const toNumber = (val: any): number => {
      if (typeof val === 'number') return val;
      if (val && Array.isArray(val.d) && val.d.length > 0) return Number(val.d[0]);
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    const toIsoDate = (val: any, fallback?: string): string => {
      if (typeof val === 'string' && !isNaN(Date.parse(val))) return new Date(val).toISOString();
      if (val && typeof val === 'object' && Object.keys(val).length > 0) {
        // Some backends send {date: '...'} or similar, try first key
        const inner = (val as any).date || (val as any).value || undefined;
        if (inner && !isNaN(Date.parse(inner))) return new Date(inner).toISOString();
      }
      if (fallback && !isNaN(Date.parse(fallback))) return new Date(fallback).toISOString();
      return new Date().toISOString();
    };

    const transformed = Array.isArray(rawData) ? rawData.map((p: any) => {
      const createdAt = toIsoDate(p.createdAt);
      const paymentDate = toIsoDate(p.paymentDate, createdAt);

      return {
        ...p,
        id: Number(p.id),
        amount: toNumber(p.amount),
        total: toNumber(p.total),
        discount: toNumber(p.discount),
        fine: toNumber(p.fine),
        createdBy: Number(p.createdBy),
        updatedBy: p.updatedBy != null ? Number(p.updatedBy) : undefined,
        schoolId: Number(p.schoolId),
        paymentDate,
        createdAt,
        updatedAt: toIsoDate(p.updatedAt, createdAt),
      } as Payment;
    }) : [];

    return {
      data: transformed,
      total: Number(paginationMeta?.total ?? transformed.length),
      page: Number(paginationMeta?.page ?? 1),
      limit: Number(paginationMeta?.limit ?? transformed.length),
      totalPages: Number(paginationMeta?.pages ?? paginationMeta?.totalPages ?? 1),
    };
  },

  getPayment: async (id: number): Promise<Payment> => {
    const response = await secureApiService.get(`/payments/${id}`);
    return response.data as Payment;
  },

  createPayment: async (data: CreatePaymentData): Promise<Payment> => {
    const response = await secureApiService.createPayment(data);
    return response.data;
  },

  updatePayment: async (id: number, data: Partial<CreatePaymentData>): Promise<Payment> => {
    const response = await secureApiService.updatePayment(id.toString(), data);
    return response.data;
  },

  deletePayment: async (id: number): Promise<void> => {
    await secureApiService.deletePayment(id.toString());
  },

  // Expenses
  getExpenses: async (filters?: FinanceFilters): Promise<PaginatedResponse<Expense>> => {
    const {
      scopeKey: _scopeKey,
      scopeMode: _scopeMode,
      schoolId,
      branchId,
      courseId,
      ...filterValues
    } = filters || {};

    const params: any = {};
    if (filterValues?.dateRange) {
      params.startDate = filterValues.dateRange.startDate;
      params.endDate = filterValues.dateRange.endDate;
    }
    if (filterValues?.status) params.status = filterValues.status;
    if (filterValues?.category) params.category = filterValues.category;
    if (schoolId !== undefined && schoolId !== null) params.schoolId = schoolId;
    if (branchId !== undefined && branchId !== null) params.branchId = branchId;
    if (courseId !== undefined && courseId !== null) params.courseId = courseId;

    console.log('🔍 Calling api.getExpenses');
    const response = await secureApiService.getExpenses(params);
    console.log('🔍 API response:', response);

    // Transform the data to handle the weird amount format and empty date objects
    const rawData = response.data?.data || response.data || [];
    const transformedData = Array.isArray(rawData) ? rawData.map((expense: any) => {
      // Fix amount - it's coming as {s: 1, e: 2, d: [111]} instead of a number
      let amount = 0;
      if (expense.amount) {
        if (typeof expense.amount === 'number') {
          amount = expense.amount;
        } else if (expense.amount.d && Array.isArray(expense.amount.d) && expense.amount.d.length > 0) {
          // Extract the actual number from the weird format
          amount = expense.amount.d[0];
        }
      }

      // Fix dates - keep valid dates, only use today as fallback for truly empty objects
      const date = expense.date && (typeof expense.date === 'string' || (typeof expense.date === 'object' && Object.keys(expense.date).length > 0))
        ? expense.date 
        : new Date().toISOString().split('T')[0]; // Use today's date as fallback only for empty objects

      const createdAt = expense.createdAt && (typeof expense.createdAt === 'string' || (typeof expense.createdAt === 'object' && Object.keys(expense.createdAt).length > 0))
        ? expense.createdAt 
        : new Date().toISOString();

      const updatedAt = expense.updatedAt && (typeof expense.updatedAt === 'string' || (typeof expense.updatedAt === 'object' && Object.keys(expense.updatedAt).length > 0))
        ? expense.updatedAt 
        : new Date().toISOString();

      return {
        ...expense,
        id: Number(expense.id),
        amount: amount,
        date: date,
        createdAt: createdAt,
        updatedAt: updatedAt,
        createdBy: Number(expense.createdBy),
        updatedBy: Number(expense.updatedBy),
        schoolId: Number(expense.schoolId)
      };
    }) : [];

    console.log('🔍 Transformed expenses data:', transformedData);

    // Return in the expected PaginatedResponse format
    return {
      data: transformedData,
      total: transformedData.length,
      page: 1,
      limit: transformedData.length,
      totalPages: 1
    };
  },

  getExpense: async (id: number): Promise<Expense> => {
    const response = await secureApiService.get(`/expenses/${id}`);
    return response.data as Expense;
  },

  createExpense: async (data: CreateExpenseData): Promise<Expense> => {
    const response = await secureApiService.createExpense(data);
    return response.data;
  },

  updateExpense: async (id: number, data: Partial<CreateExpenseData>): Promise<Expense> => {
    const response = await secureApiService.updateExpense(id.toString(), data);
    return response.data;
  },

  deleteExpense: async (id: number): Promise<void> => {
    await secureApiService.deleteExpense(id.toString());
  },

  // Payroll
  getPayrolls: async (filters?: FinanceFilters): Promise<PaginatedResponse<Payroll>> => {
    const {
      scopeKey: _scopeKey,
      scopeMode: _scopeMode,
      schoolId,
      branchId,
      courseId,
      ...filterValues
    } = filters || {};

    const params: any = {};
    if (filterValues?.dateRange) {
      params.startDate = filterValues.dateRange.startDate;
      params.endDate = filterValues.dateRange.endDate;
    }
    if (filterValues?.status) params.status = filterValues.status;
    if (filterValues?.employeeId) params.employeeId = filterValues.employeeId.toString();
    if (schoolId !== undefined && schoolId !== null) params.schoolId = schoolId;
    if (branchId !== undefined && branchId !== null) params.branchId = branchId;
    if (courseId !== undefined && courseId !== null) params.courseId = courseId;

    console.log('🔍 Calling api.getPayrolls');
    const response = await secureApiService.getPayrolls(params);
    console.log('🔍 Payroll API response:', response);

    // Transform the data to handle the weird format
    const rawData = response.data?.data || response.data || [];

    const normalizeDateValue = (value: any): string | undefined => {
      if (!value) return undefined;

      if (value instanceof Date) {
        return isNaN(value.getTime()) ? undefined : value.toISOString();
      }

      if (typeof value === 'number') {
        const numericDate = new Date(value);
        return isNaN(numericDate.getTime()) ? undefined : numericDate.toISOString();
      }

      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
      }

      if (typeof value === 'object') {
        const keys = Object.keys(value);
        if (keys.length === 0) {
          return undefined;
        }

        if (typeof value.toDate === 'function') {
          try {
            const converted = value.toDate();
            if (converted instanceof Date && !isNaN(converted.getTime())) {
              return converted.toISOString();
            }
          } catch {
            // ignore conversion errors
          }
        }

        const candidateKeys = ['date', '$date', 'value', 'formatted', 'iso'];
        for (const key of candidateKeys) {
          if (value[key]) {
            const normalized = normalizeDateValue(value[key]);
            if (normalized) {
              return normalized;
            }
          }
        }

        if (typeof value.seconds === 'number') {
          const secondsDate = new Date(value.seconds * 1000);
          return isNaN(secondsDate.getTime()) ? undefined : secondsDate.toISOString();
        }

        if (typeof value.milliseconds === 'number') {
          const msDate = new Date(value.milliseconds);
          return isNaN(msDate.getTime()) ? undefined : msDate.toISOString();
        }
      }

      return undefined;
    };

    const transformedData = Array.isArray(rawData) ? rawData.map((payroll: any) => {
      // Fix netSalary - handle both regular numbers and the weird {s: 1, e: 2, d: [XXX]} format
      let netSalary = 0;
      if (payroll.netSalary) {
        if (typeof payroll.netSalary === 'number') {
          netSalary = payroll.netSalary;
        } else if (payroll.netSalary.d && Array.isArray(payroll.netSalary.d) && payroll.netSalary.d.length > 0) {
          netSalary = payroll.netSalary.d[0];
        }
      }
      
      // Also fix basicSalary, allowances, deductions if needed
      let basicSalary = 0;
      if (payroll.basicSalary) {
        if (typeof payroll.basicSalary === 'number') {
          basicSalary = payroll.basicSalary;
        } else if (payroll.basicSalary.d && Array.isArray(payroll.basicSalary.d) && payroll.basicSalary.d.length > 0) {
          basicSalary = payroll.basicSalary.d[0];
        }
      }
      
      let allowances = 0;
      if (payroll.allowances) {
        if (typeof payroll.allowances === 'number') {
          allowances = payroll.allowances;
        } else if (payroll.allowances.d && Array.isArray(payroll.allowances.d) && payroll.allowances.d.length > 0) {
          allowances = payroll.allowances.d[0];
        }
      }
      
      let deductions = 0;
      if (payroll.deductions) {
        if (typeof payroll.deductions === 'number') {
          deductions = payroll.deductions;
        } else if (payroll.deductions.d && Array.isArray(payroll.deductions.d) && payroll.deductions.d.length > 0) {
          deductions = payroll.deductions.d[0];
        }
      }

      // If netSalary is still 0, calculate it from other fields
      if (netSalary === 0 && (basicSalary !== 0 || allowances !== 0 || deductions !== 0)) {
        netSalary = basicSalary + allowances - deductions;
      }

      // Derive recipient/employee from returned structure
      const recipientUser = payroll.user || payroll.staff?.user || null;
      const employeeName = recipientUser
        ? `${recipientUser.firstName || ''} ${recipientUser.lastName || ''}`.trim()
        : (payroll.employeeName || payroll.name || payroll.staffName || payroll.teacherName || 'Unknown Employee');
      const employeeId = recipientUser?.id || payroll.employeeId || payroll.staffId || undefined;
      const normalizedEmployeeId = typeof employeeId === 'number'
        ? employeeId
        : employeeId
          ? Number(employeeId)
          : undefined;

      // Fix dates if they're empty objects
      const paymentDate = normalizeDateValue(payroll.paymentDate);
      const createdAt = normalizeDateValue(payroll.createdAt) || new Date().toISOString();
      const updatedAt = normalizeDateValue(payroll.updatedAt) || new Date().toISOString();

      return {
        ...payroll,
        id: Number(payroll.id),
        employeeId: normalizedEmployeeId,
        employeeName,
        netSalary: netSalary,
        basicSalary: basicSalary,
        allowances: allowances,
        deductions: deductions,
        paymentDate: paymentDate,
        createdAt: createdAt,
        updatedAt: updatedAt,
        schoolId: Number(payroll.schoolId),
        createdBy: Number(payroll.createdBy || payroll.schoolId),
        updatedBy: payroll.updatedBy ? Number(payroll.updatedBy) : undefined,
      };
    }) : [];

    console.log('🔍 Transformed payroll data:', transformedData);

    // Return in the expected PaginatedResponse format
    return {
      data: transformedData,
      total: transformedData.length,
      page: 1,
      limit: transformedData.length,
      totalPages: 1
    };
  },

  getPayroll: async (id: number): Promise<Payroll> => {
    const response = await secureApiService.get(`/payrolls/${id}`);
    return response.data as Payroll;
  },

  createPayroll: async (data: CreatePayrollData): Promise<Payroll> => {
    const response = await secureApiService.createPayroll(data);
    return response.data;
  },

  updatePayroll: async (id: number, data: Partial<CreatePayrollData>): Promise<Payroll> => {
    const response = await secureApiService.updatePayroll(id.toString(), data);
    return response.data;
  },

  deletePayroll: async (id: number): Promise<void> => {
    await secureApiService.deletePayroll(id.toString());
  },

  // Analytics
  getFinanceAnalytics: async (filters?: FinanceFilters): Promise<FinanceAnalytics> => {
    const {
      scopeKey: _scopeKey,
      scopeMode: _scopeMode,
      schoolId,
      branchId,
      courseId,
      ...filterValues
    } = filters || {};

    const params: any = {};
    if (filterValues?.dateRange) {
      params.startDate = filterValues.dateRange.startDate;
      params.endDate = filterValues.dateRange.endDate;
    }
    if (schoolId !== undefined && schoolId !== null) params.schoolId = schoolId;
    if (branchId !== undefined && branchId !== null) params.branchId = branchId;
    if (courseId !== undefined && courseId !== null) params.courseId = courseId;

    const response = await secureApiService.getFinanceAnalytics(params);
    return response.data;
  },

  getFinanceStats: async (filters?: FinanceFilters): Promise<FinanceStats> => {
    const {
      scopeKey: _scopeKey,
      scopeMode: _scopeMode,
      schoolId,
      branchId,
      courseId,
      ...filterValues
    } = filters || {};

    const params: any = {};
    if (filterValues?.dateRange) {
      params.startDate = filterValues.dateRange.startDate;
      params.endDate = filterValues.dateRange.endDate;
    }
    if (schoolId !== undefined && schoolId !== null) params.schoolId = schoolId;
    if (branchId !== undefined && branchId !== null) params.branchId = branchId;
    if (courseId !== undefined && courseId !== null) params.courseId = courseId;

    const response = await secureApiService.getFinanceDashboard(params);
    return response.data;
  },
};

// React Query Hooks
export const usePayments = (filters?: FinanceFilters) => {
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: () => api.getPayments(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePayment = (id: number) => {
  return useQuery({
    queryKey: ['payment', id],
    queryFn: () => api.getPayment(id),
    enabled: !!id,
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['finance-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
    },
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreatePaymentData> }) => 
      api.updatePayment(id, data),
    onSuccess: (_: any, variables: { id: number; data: Partial<CreatePaymentData> }) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['finance-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
    },
  });
};

export const useDeletePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deletePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['finance-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
    },
  });
};

export const useExpenses = (filters?: FinanceFilters) => {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => api.getExpenses(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useExpense = (id: number) => {
  return useQuery({
    queryKey: ['expense', id],
    queryFn: () => api.getExpense(id),
    enabled: !!id,
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateExpenseData> }) => 
      api.updateExpense(id, data),
    onSuccess: (_: any, variables: { id: number; data: Partial<CreateExpenseData> }) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['finance-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
    },
  });
};

export const usePayrolls = (filters?: FinanceFilters) => {
  return useQuery({
    queryKey: ['payrolls', filters],
    queryFn: () => api.getPayrolls(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePayroll = (id: number) => {
  return useQuery({
    queryKey: ['payroll', id],
    queryFn: () => api.getPayroll(id),
    enabled: !!id,
  });
};

export const useCreatePayroll = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createPayroll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
      queryClient.invalidateQueries({ queryKey: ['finance-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
    },
  });
};

export const useUpdatePayroll = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreatePayrollData> }) => 
      api.updatePayroll(id, data),
    onSuccess: (_: any, variables: { id: number; data: Partial<CreatePayrollData> }) => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
      queryClient.invalidateQueries({ queryKey: ['payroll', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['finance-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
    },
  });
};

export const useDeletePayroll = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deletePayroll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
      queryClient.invalidateQueries({ queryKey: ['finance-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
    },
  });
};

export const useFinanceAnalytics = (filters?: FinanceFilters) => {
  return useQuery({
    queryKey: ['finance-analytics', filters],
    queryFn: () => api.getFinanceAnalytics(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useFinanceStats = (filters?: FinanceFilters) => {
  return useQuery({
    queryKey: ['finance-stats', filters],
    queryFn: () => api.getFinanceStats(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Convenience hook: fetch payments for a shamsi month range and optionally filter by classId client-side
export const usePaymentsByClassMonth = (
  params: { startDate: string; endDate: string; classId?: string }
) => {
  return useQuery({
    queryKey: ['payments-by-class-month', params],
    queryFn: async () => {
      const res = await api.getPayments({ dateRange: { startDate: params.startDate, endDate: params.endDate } });
      if (!params.classId) return res;
      const filtered = (res?.data || []).filter((p: any) => String(p?.student?.class?.id || p?.classId || '') === String(params.classId));
      return { ...res, data: filtered } as any;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export default api;