import { useState, useCallback } from 'react';
import secureApiService from '../../../services/secureApiService';
import { useToast } from '../../../hooks/useToast';

export interface Student {
  id: string;
  admissionNo: string;
  rollNo?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
    displayName: string;
  };
  convertedFromCustomerId?: string;
  conversionDate?: string;
  conversionReason?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: 'individual' | 'business';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status: 'active' | 'inactive' | 'converted';
  convertedToStudentId?: string;
  conversionDate?: string;
  conversionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentEvent {
  id: string;
  eventType: 'STUDENT_CREATED' | 'STUDENT_UPDATED' | 'STUDENT_DELETED' | 'CONVERTED_FROM_CUSTOMER';
  title: string;
  description: string;
  metadata: any;
  createdAt: string;
}

export interface CustomerEvent {
  id: string;
  eventType: 'CUSTOMER_CREATED' | 'CUSTOMER_UPDATED' | 'CUSTOMER_DELETED' | 'CUSTOMER_CONVERTED_TO_STUDENT';
  title: string;
  description: string;
  metadata: any;
  createdAt: string;
}

export interface StudentConversionAnalytics {
  totalStudents: number;
  convertedStudents: number;
  directStudents: number;
  conversionRate: number;
  recentConversions: number;
  conversionTrend: Array<{
    date: string;
    conversions: number;
  }>;
  conversionEvents: StudentEvent[];
}

export interface CustomerConversionAnalytics {
  totalCustomers: number;
  convertedCustomers: number;
  unconvertedCustomers: number;
  conversionRate: number;
  recentConversions: number;
  conversionTrend: Array<{
    date: string;
    conversions: number;
  }>;
  conversionEvents: CustomerEvent[];
}

export interface StudentConversionStats {
  totalStudents: number;
  convertedFromCustomers: number;
  directEnrollments: number;
  conversionRate: number;
  monthlyConversions: number;
  yearlyConversions: number;
}

export interface CustomerConversionStats {
  totalCustomers: number;
  convertedToStudents: number;
  unconvertedCustomers: number;
  conversionRate: number;
  monthlyConversions: number;
  yearlyConversions: number;
}

export const useStudentApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // ======================
  // CUSTOMER OPERATIONS
  // ======================

  // Create Customer
  const createCustomer = useCallback(async (customerData: {
    name: string;
    email: string;
    phone?: string;
    type: 'individual' | 'business';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }): Promise<Customer> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await secureApiService.createCustomer(customerData);
      if (response.success) {
        showToast('Customer created successfully', 'success');
        return response.data;
      } else {
        const errorMessage = response.message || 'Failed to create customer';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create customer';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Update Customer
  const updateCustomer = useCallback(async (customerId: string, updateData: Partial<Customer>): Promise<Customer> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await secureApiService.updateCustomer(customerId, updateData);
      if (response.success) {
        showToast('Customer updated successfully', 'success');
        return response.data;
      } else {
        const errorMessage = response.message || 'Failed to update customer';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update customer';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Delete Customer
  const deleteCustomer = useCallback(async (customerId: string, deletionReason: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await secureApiService.deleteCustomer(customerId);
      showToast('Customer deleted successfully', 'success');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete customer';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Convert Customer to Student
  const convertCustomerToStudent = useCallback(async (customerId: string, conversionData: {
    conversionReason: string;
    admissionNo: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
  }): Promise<Student> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await secureApiService.convertCustomerToStudent(customerId, conversionData);
      if (response.success) {
        showToast('Customer converted to student successfully', 'success');
        return response.data;
      } else {
        const errorMessage = response.message || 'Failed to convert customer to student';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to convert customer to student';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get Unconverted Customers
  const getUnconvertedCustomers = useCallback(async (page = 1, limit = 10): Promise<{
    customers: Customer[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the actual backend endpoint with filters to get unconverted customers
      const response = await secureApiService.getUnconvertedCustomers(page, limit);
      if (response.success) {
        return response.data;
      } else {
        const errorMessage = response.message || 'Failed to fetch unconverted customers';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch unconverted customers';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get Customer Conversion Analytics
  const getCustomerConversionAnalytics = useCallback(async (period = '30d'): Promise<CustomerConversionAnalytics> => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the correct backend endpoint for conversion analytics
      const response = await secureApiService.getCustomerConversionAnalytics(period);
      if (response.success) {
        return response.data;
      } else {
        const errorMessage = response.message || 'Failed to fetch customer conversion analytics';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch customer conversion analytics';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get Customer Conversion History
  const getCustomerConversionHistory = useCallback(async (page = 1, limit = 10): Promise<{
    conversions: Array<{
      customerId: string;
      studentId: string;
      conversionDate: string;
      conversionReason: string;
      customer: Customer;
      student: Student;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the correct backend endpoint for conversion history
      const response = await secureApiService.getCustomerConversionHistory(page, limit);
      if (response.success) {
        return response.data;
      } else {
        const errorMessage = response.message || 'Failed to fetch customer conversion history';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch customer conversion history';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get Customer Conversion Rates
  const getCustomerConversionRates = useCallback(async (period = 'monthly'): Promise<CustomerConversionStats> => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the correct backend endpoint for conversion rates
      const response = await secureApiService.getCustomerConversionRates(period);
      if (response.success) {
        return response.data;
      } else {
        const errorMessage = response.message || 'Failed to fetch customer conversion rates';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch customer conversion rates';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // ======================
  // STUDENT OPERATIONS
  // ======================

  // Create Student
  const createStudent = useCallback(async (studentData: {
    admissionNo: string;
    rollNo?: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      password: string;
    };
  }): Promise<Student> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await secureApiService.createStudent(studentData);
      if (response.success) {
        showToast('Student created successfully', 'success');
        return response.data;
      } else {
        const errorMessage = response.message || 'Failed to create student';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create student';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Update Student
  const updateStudent = useCallback(async (studentId: string, updateData: Partial<Student>): Promise<Student> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await secureApiService.updateStudent(studentId, updateData);
      if (response.success) {
        showToast('Student updated successfully', 'success');
        return response.data;
      } else {
        const errorMessage = response.message || 'Failed to update student';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update student';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Delete Student
  const deleteStudent = useCallback(async (studentId: string, deletionReason: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await secureApiService.deleteStudent(studentId);
      showToast('Student deleted successfully', 'success');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete student';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get Converted Students
  const getConvertedStudents = useCallback(async (page = 1, limit = 10): Promise<{
    students: Student[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the correct backend endpoint for converted students
      const response = await secureApiService.getConvertedStudents(page, limit);
      if (response.success) {
        return response.data;
      } else {
        const errorMessage = response.message || 'Failed to fetch converted students';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch converted students';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get Student Conversion Analytics
  const getStudentConversionAnalytics = useCallback(async (period = '30d'): Promise<StudentConversionAnalytics> => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the correct backend endpoint for student conversion analytics
      const response = await secureApiService.getStudentConversionAnalytics(period);
      if (response.success) {
        return response.data;
      } else {
        const errorMessage = response.message || 'Failed to fetch student conversion analytics';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch student conversion analytics';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get Student Conversion Stats
  const getStudentConversionStats = useCallback(async (): Promise<StudentConversionStats> => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the correct backend endpoint for student conversion stats
      const response = await secureApiService.getStudentConversionStats();
      if (response.success) {
        return response.data;
      } else {
        const errorMessage = response.message || 'Failed to fetch student conversion stats';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch student conversion stats';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get All Students with Events
  const getAllStudents = useCallback(async (page = 1, limit = 10, filters?: {
    status?: string;
    admissionNo?: string;
    search?: string;
    converted?: boolean;
    include?: string;
  }): Promise<{
    students: Student[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      
      const response = await secureApiService.getStudents(params);
      if (response.success) {
        return response.data;
      } else {
        const errorMessage = response.message || 'Failed to fetch students';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch students';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get Student by ID with Events
  const getStudentById = useCallback(async (studentId: string): Promise<Student> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await secureApiService.getStudentById(studentId);
      if (response.success) {
        return response.data;
      } else {
        const errorMessage = response.message || 'Failed to fetch student';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch student';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get Student Events
  const getStudentEvents = useCallback(async (studentId: string, page = 1, limit = 10): Promise<{
    events: StudentEvent[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await secureApiService.getStudentEvents(studentId, page, limit);
      if (response.success) {
        return response.data;
      } else {
        const errorMessage = response.message || 'Failed to fetch student events';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch student events';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get All Customers
  const getAllCustomers = useCallback(async (page = 1, limit = 10, filters?: {
    status?: string;
    type?: string;
    search?: string;
    converted?: boolean;
  }): Promise<{
    customers: Customer[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      
      const response = await secureApiService.getCustomers(params);
      if (response.success) {
        return response.data;
      } else {
        const errorMessage = response.message || 'Failed to fetch customers';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch customers';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get Customer by ID
  const getCustomerById = useCallback(async (customerId: string): Promise<Customer> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await secureApiService.getCustomerById(customerId);
      if (response.success) {
        return response.data;
      } else {
        const errorMessage = response.message || 'Failed to fetch customer';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch customer';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Get Customer Events
  const getCustomerEvents = useCallback(async (customerId: string, page = 1, limit = 10): Promise<{
    events: CustomerEvent[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await secureApiService.getCustomerEvents(customerId, page, limit);
      if (response.success) {
        return response.data;
      } else {
        const errorMessage = response.message || 'Failed to fetch customer events';
        setError(errorMessage);
        showToast(errorMessage, 'error');
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch customer events';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  return {
    loading,
    error,
    // Customer operations
    createCustomer,
    updateCustomer,
    deleteCustomer,
    convertCustomerToStudent,
    getUnconvertedCustomers,
    getCustomerConversionAnalytics,
    getCustomerConversionHistory,
    getCustomerConversionRates,
    getAllCustomers,
    getCustomerById,
    getCustomerEvents,
    // Student operations
    createStudent,
    updateStudent,
    deleteStudent,
    getConvertedStudents,
    getStudentConversionAnalytics,
    getStudentConversionStats,
    getAllStudents,
    getStudentById,
    getStudentEvents,
  };
};
