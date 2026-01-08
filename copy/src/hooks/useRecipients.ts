import { useQuery } from '@tanstack/react-query';
import secureApiService from '../services/secureApiService';

export interface Recipient {
  id: number;
  name: string;
  role: string;
  recipientType: 'TEACHER' | 'ADMIN';
}

export interface RecipientsResponse {
  teachers: Recipient[];
  admins: Recipient[];
}

export const useRecipients = (userId?: string, studentId?: string, studentDetails?: any) => {
  const {
    data: recipients,
    isLoading,
    error,
    refetch,
    isError
  } = useQuery({
    queryKey: ['recipients', userId, studentId],
    queryFn: async (): Promise<RecipientsResponse> => {
      console.log('🔍 useRecipients: Fetching recipients for userId:', userId, 'studentId:', studentId, 'studentDetails provided:', !!studentDetails);
       
       if (!userId) {
         console.log('⚠️ useRecipients: No userId provided, returning empty data');
         return { teachers: [], admins: [] };
       }

       try {
         const context = secureApiService.getManagedContext
           ? secureApiService.getManagedContext()
           : { schoolId: null, branchId: null, courseId: null };

         // Build params object for API calls
         const baseParams: any = {};
         if (context.schoolId) {
           baseParams.schoolId = context.schoolId;
         }
         if (context.branchId) {
           baseParams.branchId = context.branchId;
         }
         if (context.courseId) {
           baseParams.courseId = context.courseId;
         }
         
         console.log('🔍 useRecipients: Fetching with params:', baseParams);
         
         // NOTE: Role swap - Users with "TEACHER" role are actually admins, and vice versa
         // So we fetch "SCHOOL_ADMIN" role users as "TEACHER" recipients
         // And we fetch "TEACHER" role users as "ADMIN" recipients
         
         // Fetch "teachers" (actually users with SCHOOL_ADMIN role)
         let teachers: Recipient[] = [];
         
         // If studentId is provided and studentDetails are available, extract teachers from student details
         if (studentId && studentDetails && studentDetails[studentId]) {
           console.log('🔍 useRecipients: Extracting teachers from student details for student:', studentId);
           const studentData = studentDetails[studentId];
           
           // Extract teachers from student class information
           if (studentData.class && studentData.class.teachers) {
             teachers = studentData.class.teachers.map((teacher: any) => ({
               id: teacher.id,
               name: teacher.name || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim(),
               role: teacher.role || 'Teacher',
               recipientType: 'TEACHER'
             }));
             console.log('✅ useRecipients: Extracted teachers from student details:', teachers.length);
           } else {
             console.log('⚠️ useRecipients: No teachers found in student details for student:', studentId);
           }
         } else {
           // No student selected or no student details available, fetch all teachers
           console.log('🔍 useRecipients: No student details available, fetching all teachers');
           const teachersParams = { ...baseParams, role: 'SCHOOL_ADMIN', limit: 100 };
           let teachersResponse;
           try {
             // Try /users endpoint first (more reliable)
             teachersResponse = await secureApiService.get('/users', { params: teachersParams });
             console.log('✅ useRecipients: Received teachers response from /users:', teachersResponse);
           } catch (usersError: any) {
             console.warn('⚠️ useRecipients: /users API failed for teachers, trying /teachers endpoint:', usersError);
             // Fallback to /teachers endpoint
             try {
               teachersResponse = await secureApiService.get('/teachers', { params: baseParams });
               console.log('✅ useRecipients: Received teachers from /teachers:', teachersResponse);
             } catch (teachersError: any) {
               console.error('❌ useRecipients: Both /users and /teachers failed for teachers:', {
                 usersError: usersError?.message || usersError,
                 teachersError: teachersError?.message || teachersError,
               });
               teachersResponse = { success: true, data: { data: [] } };
             }
           }
           
           // Transform to "TEACHER" recipients (but these are actually SCHOOL_ADMIN role users)
           const teachersRaw = teachersResponse.data?.data || teachersResponse.data || [];
           console.log('🔍 useRecipients: Raw teachers data:', teachersRaw.length, 'items');
           teachers = teachersRaw
             .filter((user: any) => {
               // Only include users with SCHOOL_ADMIN role (these are actual teachers)
               const userRole = (user.role || '').toUpperCase();
               return userRole === 'SCHOOL_ADMIN' || userRole === 'ADMIN';
             })
             .map((user: any) => ({
               id: user.id,
               name: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
               role: user.role || 'Teacher',
               recipientType: 'TEACHER'
             }));
           console.log('✅ useRecipients: Filtered teachers (SCHOOL_ADMIN):', teachers.length);
         }
         
         // Fetch "admins" (actually users with TEACHER role)
         // Try fetching with role filter first, but if that doesn't work, fetch all and filter client-side
         const adminsParams = { ...baseParams, limit: 200 }; // Get more users to filter client-side
         console.log('🔍 useRecipients: Fetching admins (will filter for TEACHER role) with params:', adminsParams);
         
         let adminsResponse;
         try {
           // Try /users endpoint with TEACHER role filter first
           const adminsParamsWithRole = { ...adminsParams, role: 'TEACHER' };
           adminsResponse = await secureApiService.get('/users', { params: adminsParamsWithRole });
           console.log('✅ useRecipients: Received admins response from /users with TEACHER filter:', adminsResponse);
         } catch (usersError: any) {
           console.warn('⚠️ useRecipients: /users API with role filter failed, trying without filter:', usersError);
           // Fallback: fetch all users and filter client-side
           try {
             adminsResponse = await secureApiService.get('/users', { params: adminsParams });
             console.log('✅ useRecipients: Received all users, will filter for TEACHER role:', adminsResponse);
           } catch (allUsersError: any) {
             console.warn('⚠️ useRecipients: /users API failed, trying /staff endpoint:', allUsersError);
             // Fallback to /staff endpoint if /users fails
             try {
               adminsResponse = await secureApiService.get('/staff', { params: adminsParams });
               console.log('✅ useRecipients: Received admins from /staff:', adminsResponse);
             } catch (staffError: any) {
               console.error('❌ useRecipients: All endpoints failed for admins:', {
                 usersError: usersError?.message || usersError,
                 allUsersError: allUsersError?.message || allUsersError,
                 staffError: staffError?.message || staffError,
               });
               // Return empty array instead of failing completely
               adminsResponse = { success: true, data: { data: [] } };
             }
           }
         }
         
         // Transform to "ADMIN" recipients (but these are actually TEACHER role users)
         const adminsRaw = adminsResponse.data?.data || adminsResponse.data || [];
         console.log('🔍 useRecipients: Raw admins data before filtering:', adminsRaw.length, 'items');
         console.log('🔍 useRecipients: Sample roles in raw data:', adminsRaw.slice(0, 5).map((u: any) => u.role));
         
         const admins: Recipient[] = adminsRaw
           .filter((user: any) => {
             // Only include users with TEACHER role (these are actual admins)
             const userRole = (user.role || '').toUpperCase();
             const isTeacher = userRole === 'TEACHER';
             if (!isTeacher) {
               console.log('🔍 Filtered out user:', user.name, 'with role:', user.role);
             }
             return isTeacher;
           })
           .map((user: any) => ({
             id: user.id,
             name: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
             role: user.role || 'Admin',
             recipientType: 'ADMIN'
           }));
         console.log('✅ useRecipients: Filtered admins (TEACHER role only):', admins.length);
         
         console.log('✅ useRecipients: Transformed recipients - teachers:', teachers.length, 'admins:', admins.length);
         
         return { teachers, admins };
       } catch (error) {
         console.error('❌ useRecipients: Error fetching recipients:', error);
         return { teachers: [], admins: [] };
       }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Helper function to get recipient name by ID
  const getRecipientName = (recipientId: number, recipientType: 'TEACHER' | 'ADMIN'): string => {
    if (!recipients) return 'N/A';
    
    const recipientList = recipientType === 'TEACHER' ? recipients.teachers : recipients.admins;
    const recipient = recipientList.find(r => r.id === recipientId);
    return recipient ? recipient.name : 'N/A';
  };

  // Helper function to get all recipients as a flat array
  const getAllRecipients = (): Recipient[] => {
    if (!recipients) return [];
    return [...(recipients?.teachers || []), ...(recipients?.admins || [])];
  };

  return { 
    recipients: (recipients || { teachers: [], admins: [] }) as RecipientsResponse, 
    isLoading, 
    error: isError ? (error as Error) : null, 
    refetch,
    getRecipientName,
    getAllRecipients
  };
};
