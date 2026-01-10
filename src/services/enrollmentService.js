import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

/**
 * Remove a student from a course
 * @param {Object} data - The removal data
 * @param {number} data.studentId - Student ID
 * @param {number} data.courseId - Course/Class ID 
 * @param {number} data.academicSessionId - Academic session ID
 * @param {string} data.remarks - Optional remarks
 * @returns {Promise} API response
 */
export const removeStudentFromCourse = async (data) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/enrollments/remove-from-course`, {
      data,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error removing student from course:', error);
    throw error.response?.data || error;
  }
};

export default {
  removeStudentFromCourse,
};
