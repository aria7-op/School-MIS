import React, { useState, useEffect } from 'react';
import gradeManagementService from '../services/gradeManagementService';
import { useStudentListHeaderFields } from '../context/StudentListHeaderContext';

/**
 * Results List Sheet - Matches Excel "فهرست جدول" worksheet
 * Alternative results listing format in vertical table
 */
interface ResultsListSheetProps {
  classId: string;
  examType: 'MIDTERM' | 'FINAL';
  editable?: boolean;
  onDataChange?: () => void;
}

const ResultsListSheet: React.FC<ResultsListSheetProps> = ({ classId, examType }) => {
  const [annualData, setAnnualData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const headerFields = useStudentListHeaderFields();

  useEffect(() => {
    loadData();
  }, [classId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Always load annual data for this sheet (Excel pattern)
      const data = await gradeManagementService.getExcelGradeSheetByType(classId, 'FINAL');
      setAnnualData(data);
    } catch (error) {
      console.error('Error loading results list:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results list...</p>
        </div>
      </div>
    );
  }

  if (!annualData) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <span className="material-icons text-5xl text-red-500">error_outline</span>
          <p className="mt-4 text-red-600">Failed to load results list</p>
        </div>
      </div>
    );
  }

  const students = annualData.students || [];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header Section */}
      <div className="bg-white p-6 border-b-2 border-gray-300 shadow-sm">
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Summary */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              خلص نتایج سالانه
              <span className="block text-sm text-gray-600 mt-1">Annual Results Summary</span>
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="text-xs text-gray-600">تعداد داخله</p>
                <p className="text-2xl font-bold text-blue-700">
                  {annualData.classStatistics?.totalStudents || 0}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <p className="text-xs text-gray-600">شامل امتحان</p>
                <p className="text-2xl font-bold text-green-700">
                  {annualData.classStatistics?.totalStudents || 0}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded border border-green-300">
                <p className="text-xs text-gray-600">ارتقا صنف</p>
                <p className="text-2xl font-bold text-green-800">
                  {annualData.classStatistics?.successfulCount || 0}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <p className="text-xs text-gray-600">تکرار صنف</p>
                <p className="text-2xl font-bold text-red-700">
                  {annualData.classStatistics?.failedCount || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Class Info */}
          <div className="flex flex-col justify-center">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">مکتب (School):</span>
                <span className="font-semibold">لیسه عالی</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">صنف (Class):</span>
                <span className="font-semibold">{annualData.classInfo?.className}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">سال تعلیمی (Year):</span>
                <span className="font-semibold">1404 هجري شمسي</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">نگران صنف:</span>
                <span className="font-semibold">{headerFields.supervisorName || '(   )'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">سر معلم مربوطه:</span>
                <span className="font-semibold">{headerFields.headTeacherName || '(   )'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">مدیر/آمر مکتب:</span>
                <span className="font-semibold">{headerFields.principalName || '(   )'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Table Header */}
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-3 text-center border border-gray-600">
                  شماره<br/><span className="text-xs">(#)</span>
                </th>
                <th className="px-6 py-3 text-center border border-gray-600">
                  شهرت<br/><span className="text-xs">(Name)</span>
                </th>
                <th className="px-6 py-3 text-center border border-gray-600">
                  نام پدر<br/><span className="text-xs">(Father)</span>
                </th>
                <th className="px-6 py-3 text-center border border-gray-600">
                  نام پدر کلان<br/><span className="text-xs">(Grandfather)</span>
                </th>
                <th className="px-4 py-3 text-center border border-gray-600">
                  نمبر اساس<br/><span className="text-xs">(Admission)</span>
                </th>
                <th className="px-4 py-3 text-center border border-gray-600">
                  نمبر تذکره<br/><span className="text-xs">(ID)</span>
                </th>
                <th className="px-4 py-3 text-center border border-gray-600 bg-blue-700">
                  مجموعه نمرات<br/><span className="text-xs">(Total)</span>
                </th>
                <th className="px-4 py-3 text-center border border-gray-600 bg-blue-700">
                  اوسط<br/><span className="text-xs">(Average)</span>
                </th>
                <th className="px-6 py-3 text-center border border-gray-600 bg-green-700">
                  نتیجه<br/><span className="text-xs">(Result)</span>
                </th>
                <th className="px-4 py-3 text-center border border-gray-600 bg-purple-700">
                  درجه<br/><span className="text-xs">(Rank)</span>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student: any, index: number) => (
                <tr 
                  key={student.studentId}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="px-4 py-3 text-center border font-semibold">
                    {student.rowNumber}
                  </td>
                  <td className="px-6 py-3 border font-medium">
                    {student.name}
                  </td>
                  <td className="px-6 py-3 border text-gray-600">
                    {student.fatherName}
                  </td>
                  <td className="px-6 py-3 border text-gray-600">
                    -
                  </td>
                  <td className="px-4 py-3 text-center border text-gray-600">
                    {student.admissionNo}
                  </td>
                  <td className="px-4 py-3 text-center border text-gray-600">
                    {student.cardNo || '-'}
                  </td>
                  <td className="px-4 py-3 text-center border font-bold text-blue-700 bg-blue-50">
                    {student.totalMarks?.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center border font-bold text-blue-700 bg-blue-50">
                    {student.averageMarks?.toFixed(2)}
                  </td>
                  <td className={`px-6 py-3 text-center border font-bold ${
                    student.status === 'ارتقا صنف' || student.status === 'موفق'
                      ? 'text-green-700 bg-green-50'
                      : student.status === 'مشروط'
                      ? 'text-yellow-700 bg-yellow-50'
                      : 'text-red-700 bg-red-50'
                  }`}>
                    {student.status}
                  </td>
                  <td className="px-4 py-3 text-center border font-bold text-purple-700 bg-purple-50">
                    {index + 1}
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Summary Footer */}
            <tfoot className="bg-gray-100 font-bold">
              <tr>
                <td colSpan={6} className="px-6 py-3 border text-right">
                  مجموع (Total)
                </td>
                <td className="px-4 py-3 text-center border text-blue-700">
                  {students.reduce((sum: number, s: any) => sum + (s.totalMarks || 0), 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center border text-blue-700">
                  {(students.reduce((sum: number, s: any) => sum + (s.averageMarks || 0), 0) / students.length).toFixed(2)}
                </td>
                <td colSpan={2} className="border"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Footer - Signature Area */}
      <div className="bg-white border-t-2 border-gray-300 p-6">
        <div className="grid grid-cols-3 gap-8">
          <div className="text-center">
            <div className="h-16 border-b-2 border-gray-800 mb-2 flex items-end justify-center">
              <span className="text-xs text-gray-600">
                {headerFields.supervisorName || '----------------'}
              </span>
            </div>
            <p className="text-sm font-semibold">امضا، نگران صنف</p>
            <p className="text-xs text-gray-600">Class Teacher</p>
          </div>
          <div className="text-center">
            <div className="h-16 border-b-2 border-gray-800 mb-2 flex items-end justify-center">
              <span className="text-xs text-gray-600">
                {headerFields.headTeacherName || '----------------'}
              </span>
            </div>
            <p className="text-sm font-semibold">امضا، سر معلم مربوطه</p>
            <p className="text-xs text-gray-600">Head Teacher</p>
          </div>
          <div className="text-center">
            <div className="h-16 border-b-2 border-gray-800 mb-2 flex items-end justify-center">
              <span className="text-xs text-gray-600">
                {headerFields.principalName || '----------------'}
              </span>
            </div>
            <p className="text-sm font-semibold">امضا، مدیر مکتب</p>
            <p className="text-xs text-gray-600">Principal</p>
          </div>
        </div>
      </div>

      {/* Print Button */}
      <div className="bg-gray-50 border-t p-4 flex justify-end gap-3">
        <button className="px-6 py-2 bg-gray-100 border rounded hover:bg-gray-200 flex items-center gap-2">
          <span className="material-icons text-sm">print</span>
          Print List
        </button>
        <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
          <span className="material-icons text-sm">download</span>
          Export
        </button>
      </div>
    </div>
  );
};

export default ResultsListSheet;

