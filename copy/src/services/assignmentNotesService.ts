import secureApiService from './secureApiService';

/**
 * Service for managing assignment notes and parent-teacher communication
 */

interface ParentNote {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  assignmentSubject: string;
  parentId: string;
  parentName: string;
  studentId: string;
  studentName: string;
  className: string;
  note: string;
  createdAt: string;
  teacherId: string;
  teacherName: string;
  teacherResponse?: string;
  teacherResponseAt?: string;
  teacherResponderName?: string;
  teacherResponderId?: string;
  status: 'PENDING' | 'RESPONDED';
}

interface RespondToNoteParams {
  assignmentId: string;
  noteId: string;
  response: string;
  responderId: string;
  responderName: string;
}

interface AddParentNoteParams {
  assignmentId: string;
  parentId: string;
  studentId: string;
  note: string;
}

/**
 * Fetch all assignment notes with parent-teacher communication
 * @returns Promise with all assignment notes
 */
export const getAllAssignmentNotes = async (): Promise<ParentNote[]> => {
  try {
    const response = await secureApiService.get('/assignments/parent-notes/all');
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error('Error fetching assignment notes:', error);
    throw error;
  }
};

/**
 * Fetch assignment notes for a specific assignment
 * @param assignmentId - The assignment ID
 * @returns Promise with assignment notes
 */
export const getAssignmentNotes = async (assignmentId: string): Promise<ParentNote[]> => {
  try {
    const response = await secureApiService.get(`/assignments/${assignmentId}/parent-notes`);
    return response.data?.data?.notes || response.data?.notes || [];
  } catch (error) {
    console.error(`Error fetching notes for assignment ${assignmentId}:`, error);
    throw error;
  }
};

/**
 * Fetch assignment notes for a specific parent
 * @param parentId - The parent user ID
 * @returns Promise with parent's assignment notes
 */
export const getParentAssignmentNotes = async (parentId: string): Promise<ParentNote[]> => {
  try {
    const response = await secureApiService.get(`/parents/${parentId}/assignment-notes`);
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error(`Error fetching notes for parent ${parentId}:`, error);
    throw error;
  }
};

/**
 * Fetch assignment notes for a specific teacher
 * @param teacherId - The teacher user ID
 * @returns Promise with teacher's assignment notes to respond to
 */
export const getTeacherAssignmentNotes = async (teacherId: string): Promise<ParentNote[]> => {
  try {
    const response = await secureApiService.get(`/teachers/${teacherId}/assignment-notes`);
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error(`Error fetching notes for teacher ${teacherId}:`, error);
    throw error;
  }
};

/**
 * Add a parent note to an assignment
 * @param params - Parameters for adding a note
 * @returns Promise with the created note
 */
export const addParentNote = async (params: AddParentNoteParams): Promise<ParentNote> => {
  try {
    const response = await secureApiService.post(
      `/assignments/${params.assignmentId}/parent-notes`,
      {
        parentId: params.parentId,
        studentId: params.studentId,
        note: params.note,
        createdAt: new Date().toISOString()
      }
    );
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error adding parent note:', error);
    throw error;
  }
};

/**
 * Respond to a parent note (teacher/admin response)
 * @param params - Parameters for responding to a note
 * @returns Promise with the updated note
 */
export const respondToParentNote = async (params: RespondToNoteParams): Promise<ParentNote> => {
  try {
    const response = await secureApiService.post(
      `/assignments/${params.assignmentId}/parent-notes/${params.noteId}/respond`,
      {
        response: params.response,
        responderId: params.responderId,
        responderName: params.responderName,
        respondedAt: new Date().toISOString()
      }
    );
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error responding to parent note:', error);
    throw error;
  }
};

/**
 * Mark an assignment as seen by parent
 * @param assignmentId - The assignment ID
 * @param parentId - The parent user ID
 * @returns Promise with the updated assignment
 */
export const markAssignmentAsSeen = async (
  assignmentId: string,
  parentId: string
): Promise<any> => {
  try {
    const response = await secureApiService.post(
      `/assignments/${assignmentId}/mark-seen`,
      {
        parentId,
        viewedAt: new Date().toISOString()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error marking assignment as seen:', error);
    throw error;
  }
};

/**
 * Acknowledge an assignment (parent confirms they've reviewed it)
 * @param assignmentId - The assignment ID
 * @param parentId - The parent user ID
 * @param notes - Optional parent notes
 * @returns Promise with the updated assignment
 */
export const acknowledgeAssignment = async (
  assignmentId: string,
  parentId: string,
  notes?: string
): Promise<any> => {
  try {
    const response = await secureApiService.post(
      `/assignments/${assignmentId}/acknowledge`,
      {
        parentId,
        acknowledgedAt: new Date().toISOString(),
        notes: notes || ''
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error acknowledging assignment:', error);
    throw error;
  }
};

/**
 * Get statistics for assignment notes
 * @returns Promise with statistics
 */
export const getAssignmentNotesStats = async (): Promise<{
  total: number;
  pending: number;
  responded: number;
  bySubject: Record<string, number>;
  byClass: Record<string, number>;
}> => {
  try {
    const response = await secureApiService.get('/assignments/parent-notes/stats');
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error fetching assignment notes stats:', error);
    throw error;
  }
};

export default {
  getAllAssignmentNotes,
  getAssignmentNotes,
  getParentAssignmentNotes,
  getTeacherAssignmentNotes,
  addParentNote,
  respondToParentNote,
  markAssignmentAsSeen,
  acknowledgeAssignment,
  getAssignmentNotesStats
};




