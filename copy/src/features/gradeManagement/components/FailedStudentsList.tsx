import React, { useState, useEffect } from 'react';
import gradeManagementService from '../services/gradeManagementService';

/**
 * Failed Students List - Matches Excel "ناکام و محروم" worksheet
 * Failed and absent students
 */
interface FailedStudentsListProps {
  classId: string;
  examType: 'MIDTERM' | 'FINAL';
  editable?: boolean;
  onDataChange?: () => void;
}

const FailedStudentsList: React.FC<FailedStudentsListProps> = ({ classId }) => {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  const failedStudents = summary?.lists?.failed || [];

  return (
    <div className="p-6">
      <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-lg shadow-lg border-2 border-red-300 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-icons text-4xl text-red-600">cancel</span>
          <div>
            <h2 className="text-2xl font-bold text-red-800">ناکام و محروم - Failed & Absent</h2>
            <p className="text-red-700">Students requiring attention and support</p>
          </div>
        </div>
        <div className="bg-white rounded p-4">
          <p className="text-3xl font-bold text-red-600">
            {failedStudents.length} <span className="text-lg">students</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-red-700 text-white">
            <tr>
              <th className="px-4 py-3 text-center">#</th>
              <th className="px-4 py-3 text-center">نمبر (Roll No)</th>
              <th className="px-4 py-3 text-center">اسم (Name)</th>
              <th className="px-4 py-3 text-center">مجموع (Total)</th>
              <th className="px-4 py-3 text-center">اوسط (Average)</th>
              <th className="px-4 py-3 text-center">نتیجه (Result)</th>
              <th className="px-4 py-3 text-center">ملاحظات (Remarks)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {failedStudents.map((student: any, index: number) => (
              <tr key={student.studentId} className={index % 2 === 0 ? 'bg-white' : 'bg-red-50'}>
                <td className="px-4 py-3 text-center font-semibold">{index + 1}</td>
                <td className="px-4 py-3 text-center">{student.rollNo}</td>
                <td className="px-4 py-3">{student.name}</td>
                <td className="px-4 py-3 text-center font-semibold text-red-700">
                  {student.totalMarks?.toFixed(2) || '-'}
                </td>
                <td className="px-4 py-3 text-center font-semibold text-red-700">
                  {student.averageMarks?.toFixed(2) || '-'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-bold text-sm">
                    {student.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-600">
                  {student.remarks || 'Needs support'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {failedStudents.length === 0 && (
          <div className="text-center p-12 text-gray-500">
            <span className="material-icons text-6xl mb-4 text-green-500">celebration</span>
            <p className="text-green-700 font-semibold">Excellent! No failed students!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FailedStudentsList;





