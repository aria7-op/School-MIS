import React, { useState, useEffect } from 'react';
import gradeManagementService from '../services/gradeManagementService';

/**
 * Subject-wise Sheet - Matches Excel "فهرست مضمونوار" worksheet
 * Subject-wise performance analysis
 */
interface SubjectWiseSheetProps {
  classId: string;
  examType: 'MIDTERM' | 'FINAL';
  editable?: boolean;
  onDataChange?: () => void;
}

const SubjectWiseSheet: React.FC<SubjectWiseSheetProps> = ({ classId }) => {
  const [statistics, setStatistics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, [classId]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await gradeManagementService.calculateStatistics(classId);
      setStatistics(data.statistics || []);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg border-2 border-blue-300 p-6 mb-6">
        <div className="flex items-center gap-3">
          <span className="material-icons text-4xl text-blue-600">analytics</span>
          <div>
            <h2 className="text-2xl font-bold text-blue-800">فهرست مضمونوار - Subject-wise Analysis</h2>
            <p className="text-blue-700">Performance breakdown by subject</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-700 text-white">
            <tr>
              <th className="px-4 py-3 text-center">#</th>
              <th className="px-4 py-3 text-center">مضمون (Subject)</th>
              <th className="px-4 py-3 text-center">کود (Code)</th>
              <th className="px-4 py-3 text-center">اوسط (Avg)</th>
              <th className="px-4 py-3 text-center">بلند (High)</th>
              <th className="px-4 py-3 text-center">پایین (Low)</th>
              <th className="px-4 py-3 text-center">شاگردان (Students)</th>
              <th className="px-4 py-3 text-center">کامیاب (Passed)</th>
              <th className="px-4 py-3 text-center">ناکام (Failed)</th>
              <th className="px-4 py-3 text-center">فیصدی (Pass %)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {statistics.map((stat, index) => (
              <tr key={stat.subjectId} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                <td className="px-4 py-3 text-center font-semibold">{index + 1}</td>
                <td className="px-4 py-3 font-medium">{stat.subjectName}</td>
                <td className="px-4 py-3 text-center text-gray-600">{stat.subjectCode}</td>
                <td className="px-4 py-3 text-center font-semibold text-blue-700">
                  {stat.averageMarks?.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center font-semibold text-green-700">
                  {stat.highestMarks}
                </td>
                <td className="px-4 py-3 text-center font-semibold text-red-700">
                  {stat.lowestMarks}
                </td>
                <td className="px-4 py-3 text-center">{stat.totalStudents}</td>
                <td className="px-4 py-3 text-center text-green-700 font-semibold">
                  {stat.passedCount}
                </td>
                <td className="px-4 py-3 text-center text-red-700 font-semibold">
                  {stat.failedCount}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className={`inline-block px-3 py-1 rounded-full font-bold text-sm ${
                    parseFloat(stat.passPercentage) >= 80
                      ? 'bg-green-100 text-green-800'
                      : parseFloat(stat.passPercentage) >= 60
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {stat.passPercentage}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {statistics.length === 0 && (
          <div className="text-center p-12 text-gray-500">
            <span className="material-icons text-6xl mb-4">assessment</span>
            <p>No data available. Enter grades first.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectWiseSheet;





