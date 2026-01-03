import { useState, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import secureApiService from '../../../services/secureApiService';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  section: string;
  rollNumber: string;
  attendance: number;
  averageGrade: number;
  recentActivity: string;
  photo?: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  phoneNumber: string;
  bloodGroup: string;
  enrollmentDate: string;
  status: string;
  subjects: string[];
  teacherName: string;
  teacherEmail: string;
  teacherPhone: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export const useParentData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getParentChildren = useCallback(async (): Promise<ApiResponse<Child[]>> => {
    if (!user?.id) {
      return {
        success: false,
        data: [],
        error: 'User not authenticated'
      };
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await secureApiService.get(`/parents/${user.id}/children`);
      
      // Mock data for now
      const mockChildren: Child[] = [
        {
          id: 'child1',
          firstName: 'Emma',
          lastName: 'Johnson',
          grade: 'Grade 5',
          section: 'A',
          rollNumber: '2024-001',
          attendance: 95,
          averageGrade: 88,
          recentActivity: 'Completed Math assignment',
          photo: 'https://example.com/emma.jpg',
          email: 'emma.johnson@school.com',
          dateOfBirth: '2013-03-15',
          gender: 'Female',
          address: '123 Main St, City',
          phoneNumber: '+1-555-0123',
          bloodGroup: 'O+',
          enrollmentDate: '2020-09-01',
          status: 'active',
          subjects: ['Mathematics', 'Science', 'English', 'History', 'Art'],
          teacherName: 'Ms. Sarah Williams',
          teacherEmail: 'sarah.williams@school.com',
          teacherPhone: '+1-555-0101',
          emergencyContact: {
            name: 'Sarah Johnson',
            relationship: 'Mother',
            phone: '+1-555-0124'
          }
        },
        {
          id: 'child2',
          firstName: 'Lucas',
          lastName: 'Johnson',
          grade: 'Grade 3',
          section: 'B',
          rollNumber: '2024-002',
          attendance: 92,
          averageGrade: 85,
          recentActivity: 'Attended Science club',
          photo: 'https://example.com/lucas.jpg',
          email: 'lucas.johnson@school.com',
          dateOfBirth: '2015-07-22',
          gender: 'Male',
          address: '123 Main St, City',
          phoneNumber: '+1-555-0125',
          bloodGroup: 'A+',
          enrollmentDate: '2022-09-01',
          status: 'active',
          subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Physical Education'],
          teacherName: 'Mr. David Brown',
          teacherEmail: 'david.brown@school.com',
          teacherPhone: '+1-555-0102',
          emergencyContact: {
            name: 'Sarah Johnson',
            relationship: 'Mother',
            phone: '+1-555-0124'
          }
        }
      ];

      return {
        success: true,
        data: mockChildren
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch children data';
      setError(errorMessage);
      return {
        success: false,
        data: [],
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const getParentNotifications = useCallback(async (): Promise<ApiResponse<Notification[]>> => {
    if (!user?.id) {
      return {
        success: false,
        data: [],
        error: 'User not authenticated'
      };
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await secureApiService.get(`/parents/${user.id}/notifications`);
      
      // Mock data for now
      const mockNotifications: Notification[] = [
        {
          id: 'notif1',
          title: 'Parent-Teacher Meeting',
          message: 'Reminder: Parent-teacher meeting scheduled for tomorrow at 3:00 PM',
          type: 'info',
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'medium'
        },
        {
          id: 'notif2',
          title: 'Exam Results Available',
          message: 'Math exam results for Emma are now available in the portal',
          type: 'success',
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          read: true,
          priority: 'low'
        },
        {
          id: 'notif3',
          title: 'Fee Payment Due',
          message: 'Monthly fee payment is due in 5 days. Please complete the payment to avoid late fees.',
          type: 'warning',
          timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          read: false,
          priority: 'high'
        },
        {
          id: 'notif4',
          title: 'School Event',
          message: 'Annual sports day is scheduled for next Friday. All parents are welcome to attend.',
          type: 'info',
          timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          read: true,
          priority: 'low'
        }
      ];

      return {
        success: true,
        data: mockNotifications
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
      return {
        success: false,
        data: [],
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const getChildAttendance = useCallback(async (childId: string): Promise<ApiResponse<any>> => {
    if (!user?.id) {
      return {
        success: false,
        data: null,
        error: 'User not authenticated'
      };
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await secureApiService.get(`/parents/${user.id}/children/${childId}/attendance`);
      
      // Mock data for now
      const mockAttendance = {
        childId,
        totalDays: 20,
        presentDays: 19,
        absentDays: 1,
        lateDays: 0,
        attendanceRate: 95,
        monthlyData: [
          { month: 'January', rate: 95 },
          { month: 'February', rate: 92 },
          { month: 'March', rate: 98 }
        ]
      };

      return {
        success: true,
        data: mockAttendance
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch attendance data';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const getChildGrades = useCallback(async (childId: string): Promise<ApiResponse<any>> => {
    if (!user?.id) {
      return {
        success: false,
        data: null,
        error: 'User not authenticated'
      };
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await secureApiService.get(`/parents/${user.id}/children/${childId}/grades`);
      
      // Mock data for now
      const mockGrades = {
        childId,
        currentSemester: 'Fall 2024',
        subjects: [
          {
            name: 'Mathematics',
            grade: 'A-',
            percentage: 88,
            assignments: [
              { name: 'Chapter 5 Quiz', score: 85, total: 100 },
              { name: 'Midterm Exam', score: 90, total: 100 }
            ]
          },
          {
            name: 'Science',
            grade: 'A',
            percentage: 92,
            assignments: [
              { name: 'Lab Report 1', score: 95, total: 100 },
              { name: 'Science Project', score: 88, total: 100 }
            ]
          },
          {
            name: 'English',
            grade: 'B+',
            percentage: 87,
            assignments: [
              { name: 'Essay Writing', score: 85, total: 100 },
              { name: 'Reading Comprehension', score: 89, total: 100 }
            ]
          }
        ],
        overallGPA: 3.67
      };

      return {
        success: true,
        data: mockGrades
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch grades data';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const getChildFees = useCallback(async (childId: string): Promise<ApiResponse<any>> => {
    if (!user?.id) {
      return {
        success: false,
        data: null,
        error: 'User not authenticated'
      };
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await secureApiService.get(`/parents/${user.id}/children/${childId}/fees`);
      
      // Mock data for now
      const mockFees = {
        childId,
        totalFees: 5000,
        paidFees: 4500,
        outstandingFees: 500,
        nextDueDate: '2024-02-01',
        paymentHistory: [
          {
            date: '2024-01-15',
            amount: 1000,
            method: 'Credit Card',
            status: 'Completed'
          },
          {
            date: '2024-01-01',
            amount: 1000,
            method: 'Bank Transfer',
            status: 'Completed'
          }
        ],
        upcomingPayments: [
          {
            dueDate: '2024-02-01',
            amount: 500,
            description: 'Monthly Tuition Fee'
          }
        ]
      };

      return {
        success: true,
        data: mockFees
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch fees data';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const markNotificationAsRead = useCallback(async (notificationId: string): Promise<ApiResponse<boolean>> => {
    if (!user?.id) {
      return {
        success: false,
        data: false,
        error: 'User not authenticated'
      };
    }

    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await secureApiService.put(`/parents/${user.id}/notifications/${notificationId}/read`);
      
      return {
        success: true,
        data: true
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark notification as read';
      setError(errorMessage);
      return {
        success: false,
        data: false,
        error: errorMessage
      };
    }
  }, [user?.id]);

  const getStudentDetails = useCallback(async (studentId: string): Promise<ApiResponse<Child | null>> => {
    if (!user?.id) {
      return {
        success: false,
        data: null,
        error: 'User not authenticated'
      };
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await secureApiService.get(`/parents/${user.id}/children/${studentId}`);
      
      // Mock data for now - find the student from the children list
      const mockChildren: Child[] = [
        {
          id: 'child1',
          firstName: 'Emma',
          lastName: 'Johnson',
          grade: 'Grade 5',
          section: 'A',
          rollNumber: '2024-001',
          attendance: 95,
          averageGrade: 88,
          recentActivity: 'Completed Math assignment',
          photo: 'https://example.com/emma.jpg',
          email: 'emma.johnson@school.com',
          dateOfBirth: '2013-03-15',
          gender: 'Female',
          address: '123 Main St, City',
          phoneNumber: '+1-555-0123',
          bloodGroup: 'O+',
          enrollmentDate: '2020-09-01',
          status: 'active',
          subjects: ['Mathematics', 'Science', 'English', 'History', 'Art'],
          teacherName: 'Ms. Sarah Williams',
          teacherEmail: 'sarah.williams@school.com',
          teacherPhone: '+1-555-0101',
          emergencyContact: {
            name: 'Sarah Johnson',
            relationship: 'Mother',
            phone: '+1-555-0124'
          }
        },
        {
          id: 'child2',
          firstName: 'Lucas',
          lastName: 'Johnson',
          grade: 'Grade 3',
          section: 'B',
          rollNumber: '2024-002',
          attendance: 92,
          averageGrade: 85,
          recentActivity: 'Attended Science club',
          photo: 'https://example.com/lucas.jpg',
          email: 'lucas.johnson@school.com',
          dateOfBirth: '2015-07-22',
          gender: 'Male',
          address: '123 Main St, City',
          phoneNumber: '+1-555-0125',
          bloodGroup: 'A+',
          enrollmentDate: '2022-09-01',
          status: 'active',
          subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Physical Education'],
          teacherName: 'Mr. David Brown',
          teacherEmail: 'david.brown@school.com',
          teacherPhone: '+1-555-0102',
          emergencyContact: {
            name: 'Sarah Johnson',
            relationship: 'Mother',
            phone: '+1-555-0124'
          }
        }
      ];

      const student = mockChildren.find(child => child.id === studentId);
      
      return {
        success: true,
        data: student || null
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch student details';
      setError(errorMessage);
      return {
        success: false,
        data: null,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  return {
    loading,
    error,
    getParentChildren,
    getParentNotifications,
    getChildAttendance,
    getChildGrades,
    getChildFees,
    getStudentDetails,
    markNotificationAsRead
  };
}; 