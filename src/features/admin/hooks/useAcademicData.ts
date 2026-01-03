import { useState, useEffect } from 'react';
import { AcademicData } from '../types';

interface UseAcademicDataReturn {
  academicData: AcademicData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const useAcademicData = (): UseAcademicDataReturn => {
  const [academicData, setAcademicData] = useState<AcademicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAcademicData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for now - replace with actual API call
      const mockAcademicData: AcademicData = {
        classes: [
          {
            id: '1',
            name: 'Mathematics 101',
            code: 'MATH101',
            teacher: 'John Doe',
            students: 25,
            capacity: 30,
            schedule: 'Mon, Wed, Fri 9:00 AM',
            room: 'Room 201',
          },
          {
            id: '2',
            name: 'English Literature',
            code: 'ENG201',
            teacher: 'Jane Smith',
            students: 20,
            capacity: 25,
            schedule: 'Tue, Thu 10:30 AM',
            room: 'Room 105',
          },
        ],
        subjects: [
          {
            id: '1',
            name: 'Mathematics',
            code: 'MATH',
            department: 'Science',
            credits: 3,
            description: 'Advanced mathematics course',
          },
          {
            id: '2',
            name: 'English',
            code: 'ENG',
            department: 'Humanities',
            credits: 3,
            description: 'English literature and composition',
          },
        ],
        grades: [
          {
            id: '1',
            studentId: 'student1',
            subjectId: 'subject1',
            grade: 'A',
            percentage: 92,
            semester: 'Fall 2024',
          },
        ],
        examTimetables: [
          {
            id: '1',
            subject: 'Mathematics 101',
            date: '2024-12-15',
            time: '10:00 AM',
            duration: '2 hours',
            room: 'Room 201',
          },
        ],
        upcomingExams: 8,
        totalStudents: 2500,
        totalTeachers: 180,
        academicStats: {
          averageGrade: 85.5,
          attendanceRate: 92.3,
          completionRate: 88.7,
        },
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 700));

      setAcademicData(mockAcademicData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch academic data');
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchAcademicData();
  };

  useEffect(() => {
    fetchAcademicData();
  }, []);

  return {
    academicData,
    loading,
    error,
    refetch,
  };
};

export default useAcademicData; 
