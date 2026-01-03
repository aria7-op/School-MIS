import { useQuery } from '@tanstack/react-query';
import secureApiService from '../services/secureApiService';

export interface ParentSubmission {
  id: number;
  uuid: string;
  parentId: number;
  studentId: number | null;
  recipientId: number;
  recipientType: 'TEACHER' | 'ADMIN';
  type: 'SUGGESTION' | 'COMPLAINT';
  title: string;
  description: string;
  category: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'RESPONDED' | 'RESOLVED' | 'CLOSED';
  response?: string | null;
  respondedAt?: string | null;
  responderId?: number | null;
  schoolId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  parent: {
    id: number;
    userId?: number | null;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      displayName?: string | null;
      phone: string;
    };
  };
  student?: {
    id: number;
    admissionNo: string;
    class: {
      name: string;
      level: number;
    };
    section?: {
      name: string;
    } | null;
  } | null;
  recipient: {
    id: number;
    firstName: string;
    lastName: string;
    displayName?: string | null;
    role: string;
  };
  responder?: {
    id: number;
    firstName: string;
    lastName: string;
    displayName?: string | null;
    role: string;
  } | null;
}

export interface ParentSubmissionsResponse {
  success: boolean;
  message: string;
  data: ParentSubmission[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const useParentSubmissions = (userId?: string) => {
  const {
    data: submissions,
    isLoading,
    error,
    refetch,
    isError
  } = useQuery({
    queryKey: ['parentSubmissions', userId],
    queryFn: async (): Promise<ParentSubmission[]> => {
      console.log('🔍 useParentSubmissions: Fetching user submissions for userId:', userId);
       try {
         if (!userId) {
           console.log('⚠️ useParentSubmissions: No userId provided, returning empty array');
           return [];
         }

         // Try different possible endpoints for parent submissions
         // First try: /suggestion-complaints/parent/{userId}
         try {
           const response = await secureApiService.get<ParentSubmissionsResponse>(`/suggestion-complaints/parent/${userId}`);
           console.log('✅ useParentSubmissions: Success from /suggestion-complaints/parent/{userId}:', response);
           return response.data?.data || response.data || [];
         } catch (parentError) {
           console.log('⚠️ useParentSubmissions: Parent endpoint failed, trying user endpoint');
           // Fallback: try /suggestion-complaints/user/{userId}
           try {
             const response = await secureApiService.get<ParentSubmissionsResponse>(`/suggestion-complaints/user/${userId}`);
             console.log('✅ useParentSubmissions: Success from /suggestion-complaints/user/{userId}:', response);
             return response.data?.data || response.data || [];
           } catch (userError) {
             console.log('⚠️ useParentSubmissions: User endpoint also failed, trying general endpoint');
             // Final fallback: try /suggestion-complaints with parentId filter
             const response = await secureApiService.get<ParentSubmissionsResponse>(`/suggestion-complaints?parentId=${userId}`);
             console.log('✅ useParentSubmissions: Success from /suggestion-complaints?parentId={userId}:', response);
             return response.data?.data || response.data || [];
           }
         }
      } catch (error) {
        console.error('❌ useParentSubmissions: API error:', error);
        // Return empty array instead of throwing error to prevent UI crash
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return { 
    submissions: (submissions || []) as ParentSubmission[], 
    isLoading, 
    error: isError ? (error as Error) : null, 
    refetch 
  };
};
