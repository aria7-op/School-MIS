import { useQuery } from '@tanstack/react-query';
import secureApiService from '../../../services/secureApiService';

export interface StudentBalance {
  studentId: string;
  studentName: string;
  className: string;
  feeStructure: {
    id: string;
    name: string;
    description?: string;
  } | null;
  expected: {
    total: number;
    optional: number;
    items: Array<{
      id: string;
      name: string;
      amount: number;
      isOptional: boolean;
      dueDate?: string;
    }>;
  };
  paid: {
    total: number;
    totalPayments: number;
    totalDiscount: number;
    totalFine: number;
    paymentsByMonth: Record<string, {
      count: number;
      total: number;
      payments: Array<{
        id: string;
        amount: number;
        date: string;
        status: string;
        method: string;
      }>;
    }>;
    latestPayment?: {
      id: string;
      amount: number;
      date: string;
      method: string;
    } | null;
  };
  balance: {
    amount: number;
    status: 'DUE' | 'PREPAID' | 'CLEARED';
    dueAmount: number;
    prepaidAmount: number;
  };
  percentage: number;
}

export interface StudentDues {
  studentId: string;
  studentName: string;
  hasDues: boolean;
  totalDue: number;
  overdueItems: Array<{
    name: string;
    amount: number;
    dueDate: string;
    daysOverdue: number;
  }>;
  unpaidMonths: Array<{
    month: string;
    expectedAmount: number;
    monthsOverdue: number;
    isOverdue?: boolean;
  }>;
  monthsWithoutPayment: number;
  summary?: {
    fullyPaid: number;
    partiallyPaid: number;
    unpaid: number;
  };
  monthlyExpected?: number;
  unassignedPayments?: number;
  paidMonths?: Array<{
    month: string;
    paidAmount?: number;
    paymentPercentage?: number;
  } | string>;
  partiallyPaidMonths?: Array<{
    month: string;
    paidAmount: number;
    expectedAmount: number;
    remainingAmount: number;
    paymentPercentage: number;
  }>;
}

export interface ExpectedFees {
  studentId: string;
  studentName: string;
  className: string;
  feeStructure: {
    id: string;
    name: string;
    description?: string;
  } | null;
  totalExpected: number;
  optionalTotal: number;
  items: Array<{
    id: string;
    name: string;
    amount: number;
    isOptional: boolean;
    dueDate?: string;
  }>;
  message?: string;
}

/**
 * Hook to get student balance information
 */
export const useStudentBalance = (studentId: number | null) => {
  return useQuery<StudentBalance | null>({
    queryKey: ['studentBalance', studentId],
    queryFn: async () => {
      if (!studentId) throw new Error('Student ID is required');
      
      try {
        const response = await secureApiService.get(`/students/${studentId}/balance`);
        const data = response.data;
        // Normalize response to ensure all required fields exist
        if (data && typeof data === 'object') {
          return {
            ...data,
            expected: {
              ...data.expected,
              items: Array.isArray(data.expected?.items) ? data.expected.items : [],
            },
            paid: {
              ...data.paid,
              paymentsByMonth: (data.paid?.paymentsByMonth && typeof data.paid.paymentsByMonth === 'object') 
                ? data.paid.paymentsByMonth 
                : {},
            },
          } as StudentBalance;
        }
        return null;
      } catch (error: any) {
        console.error('Error fetching student balance:', error);
        return null;
      }
    },
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};

/**
 * Hook to get student expected fees based on fee structure
 */
export const useStudentExpectedFees = (studentId: number | null) => {
  return useQuery<ExpectedFees | null>({
    queryKey: ['studentExpectedFees', studentId],
    queryFn: async () => {
      if (!studentId) throw new Error('Student ID is required');
      
      try {
        const response = await secureApiService.get(`/students/${studentId}/expected-fees`);
        return response.data;
      } catch (error: any) {
        console.error('Error fetching expected fees:', error);
        // Return default structure if API fails
        return {
          studentId: studentId.toString(),
          studentName: '',
          className: '',
          classCode: '',
          feeStructure: null,
          totalExpected: 0,
          optionalTotal: 0,
          items: [],
          message: 'Unable to fetch expected fees'
        };
      }
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once
  });
};

/**
 * Hook to get student dues information
 */
export const useStudentDues = (studentId: number | null) => {
  return useQuery<StudentDues | null>({
    queryKey: ['studentDues', studentId],
    queryFn: async () => {
      if (!studentId) throw new Error('Student ID is required');
      
      try {
        const response = await secureApiService.get(`/students/${studentId}/dues`);
        const data = response.data;
        // Ensure all expected fields are normalized to prevent errors
        if (data && typeof data === 'object') {
          return {
            ...data,
            overdueItems: Array.isArray(data.overdueItems) ? data.overdueItems : [],
            unpaidMonths: Array.isArray(data.unpaidMonths) ? data.unpaidMonths : [],
            partiallyPaidMonths: Array.isArray(data.partiallyPaidMonths) ? data.partiallyPaidMonths : [],
            paidMonths: Array.isArray(data.paidMonths) ? data.paidMonths : [],
            summary: data.summary || { fullyPaid: 0, partiallyPaid: 0, unpaid: 0 },
            monthlyExpected: data.monthlyExpected || 0,
            unassignedPayments: data.unassignedPayments || 0,
          } as StudentDues;
        }
        return null;
      } catch (error: any) {
        console.error('Error fetching student dues:', error);
        return null;
      }
    },
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};

/**
 * Hook to get all students with outstanding dues
 */
export const useStudentsWithDues = (options?: {
  classId?: number;
  minDueAmount?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['studentsWithDues', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.classId) params.append('classId', options.classId.toString());
      if (options?.minDueAmount) params.append('minDueAmount', options.minDueAmount.toString());
      if (options?.limit) params.append('limit', options.limit.toString());
      
      const response = await secureApiService.get(`/students/with-dues?${params.toString()}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

