import React, { useState, useEffect } from 'react';
import gradeManagementService from '../services/gradeManagementService';

/**
 * Successful Students List - Matches Excel "کامیاب" worksheet
 * Auto-populated list using Excel COUNTIF formulas
 */
interface SuccessfulStudentsListProps {
  classId: string;
  examType: 'MIDTERM' | 'FINAL';
  editable?: boolean;
  onDataChange?: () => void;
}

const SuccessfulStudentsList: React.FC<SuccessfulStudentsListProps> = ({ classId }) => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, [classId]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await gradeManagementService.getResultsSummary(classId);
      setSummary(data);
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const successfulStudents = summary?.lists?.successful || [];

  return (
    <div className="p-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-lg border-2 border-green-300 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-icons text-4xl text-green-600">emoji_events</span>
          <div>
            <h2 className="text-2xl font-bold text-green-800">کامیاب - Successful Students</h2>
            <p className="text-green-700">Honor Roll - Students who passed with excellence</p>
          </div>
        </div>
        <div className="bg-white rounded p-4">
          <p className="text-3xl font-bold text-green-600">
            {successfulStudents.length} <span className="text-lg">students</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-green-700 text-white">
            <tr>
              <th className="px-4 py-3 text-center">#</th>
              <th className="px-4 py-3 text-center">نمبر (Roll No)</th>
              <th className="px-4 py-3 text-center">اسم (Name)</th>
              <th className="px-4 py-3 text-center">مجموع (Total)</th>
              <th className="px-4 py-3 text-center">اوسط (Average)</th>
              <th className="px-4 py-3 text-center">نتیجه (Result)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {successfulStudents.map((student: any, index: number) => (
              <tr key={student.studentId} className={index % 2 === 0 ? 'bg-white' : 'bg-green-50'}>
                <td className="px-4 py-3 text-center font-semibold">{index + 1}</td>
                <td className="px-4 py-3 text-center">{student.rollNo}</td>
                <td className="px-4 py-3">{student.name}</td>
                <td className="px-4 py-3 text-center font-semibold text-green-700">
                  {student.totalMarks?.toFixed(2) || '-'}
                </td>
                <td className="px-4 py-3 text-center font-semibold text-green-700">
                  {student.averageMarks?.toFixed(2) || '-'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-bold text-sm">
                    {student.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {successfulStudents.length === 0 && (
          <div className="text-center p-12 text-gray-500">
            <span className="material-icons text-6xl mb-4">school</span>
            <p>No successful students yet. Enter grades first.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuccessfulStudentsList;





