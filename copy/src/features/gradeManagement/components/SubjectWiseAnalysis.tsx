import React, { useState, useEffect } from 'react';
import gradeManagementService from '../services/gradeManagementService';
import { AFGHAN_SUBJECTS } from '../constants/afghanSubjects';
import { useStudentListHeaderFields } from '../context/StudentListHeaderContext';

interface SubjectWiseAnalysisProps {
  classId: string;
  examType: 'MIDTERM' | 'FINAL';
}

/**
 * Subject-wise Analysis Sheet (فهرست مضمونوار) - 5th Sheet
 * Shows students as rows, subjects as columns
 * Excel Formula Pattern: All data pulled from "جدول نتایج" sheet
 */
const SubjectWiseAnalysis: React.FC<SubjectWiseAnalysisProps> = ({
  classId,
  examType
}) => {
  const [sheetData, setSheetData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const headerFields = useStudentListHeaderFields();

  useEffect(() => {
    loadData();
  }, [classId, examType]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await gradeManagementService.getExcelGradeSheetByType(classId, examType);
      setSheetData(data);
    } catch (error) {
      console.error('Error loading subject-wise analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !sheetData) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const { students, subjects, classInfo, examInfo, classStatistics } = sheetData;

  return (
    <div className="bg-white p-4">
      {/* Header Section - Excel Row 1-3 */}
      <div className="border-2 border-black mb-4 p-4">
        <div className="grid grid-cols-3 gap-4 mb-2">
          <div>
            <h2 className="text-xl font-bold text-right">فهرست نتایج مضمونوار</h2>
          </div>
          <div className="text-center">
            <p className="text-sm">مکتب: <span className="font-bold">{classInfo.className}</span></p>
          </div>
          <div className="text-left">
            <p className="text-sm">مربوط حوزه/ ولسوالی: _________</p>
          </div>
        </div>

        {/* Summary Statistics - Excel Row 2 */}
        <div className="grid grid-cols-6 gap-4 text-sm border-t border-black pt-2">
          <div className="text-right">
            <span className="font-bold">تعداد داخله:</span> {classStatistics.totalStudents}
          </div>
          <div>
            <span className="font-bold">شامل امتحان:</span> {classStatistics.totalStudents}
          </div>
          <div>
            <span className="font-bold">ارتقا صنف:</span> {classStatistics.successfulCount}
          </div>
          <div>
            <span className="font-bold">تکرار صنف:</span> {classStatistics.failedCount}
          </div>
          <div>
            <span className="font-bold">مشروط:</span> {classStatistics.conditionalCount}
          </div>
          <div>
            <span className="font-bold">محروم:</span> 0
          </div>
        </div>
      </div>

      {/* Main Table - Students as Rows, Subjects as Columns */}
      <div className="overflow-x-auto border-2 border-black">
        <table className="border-collapse" style={{ minWidth: '100%', fontSize: '10pt' }}>
          <thead>
            {/* Row 3: Subject Names */}
            <tr className="border-b-2 border-black" style={{ background: '#e5e7eb' }}>
              <th className="sticky left-0 bg-gray-200 border-r border-black p-2 text-center font-bold z-20" style={{ minWidth: '60px' }}>
                شماره
              </th>
              <th className="sticky left-14 bg-gray-200 border-r border-black p-2 text-center font-bold z-20" style={{ minWidth: '150px' }}>
                نام
              </th>
              <th className="border-r border-black p-2 text-center font-bold" style={{ minWidth: '120px' }}>
                نام پدر
              </th>
              <th className="border-r border-black p-2 text-center font-bold" style={{ minWidth: '120px' }}>
                نام پدر کلان
              </th>
              <th className="border-r border-black p-2 text-center font-bold" style={{ minWidth: '120px' }}>
                نمبر اساس
              </th>
              
              {/* Subject Columns */}
              {AFGHAN_SUBJECTS.map((subject) => (
                <th key={subject.code} className="border-r border-black p-2 text-center font-bold" style={{ minWidth: '70px' }}>
                  {subject.nameLocal}
                </th>
              ))}

              {/* Attendance Columns */}
              <th className="border-r border-black p-2 text-center font-bold bg-blue-100" style={{ minWidth: '80px' }}>
                ایام تعلیمی
              </th>
              <th className="border-r border-black p-2 text-center font-bold bg-green-100" style={{ minWidth: '70px' }}>
                حاضر
              </th>
              <th className="border-r border-black p-2 text-center font-bold bg-red-100" style={{ minWidth: '70px' }}>
                غیر حاضر
              </th>
              <th className="border-r border-black p-2 text-center font-bold bg-yellow-100" style={{ minWidth: '70px' }}>
                رخصت
              </th>

              {/* Summary Columns */}
              <th className="border-r border-black p-2 text-center font-bold bg-purple-100" style={{ minWidth: '100px' }}>
                مجموعه نمرات
              </th>
              <th className="border-r border-black p-2 text-center font-bold bg-purple-100" style={{ minWidth: '100px' }}>
                اوسط نمرات
              </th>
              <th className="border-r border-black p-2 text-center font-bold bg-orange-100" style={{ minWidth: '100px' }}>
                نتیجه
              </th>
              <th className="border-r border-black p-2 text-center font-bold bg-orange-100" style={{ minWidth: '80px' }}>
                درجه
              </th>
              <th className="p-2 text-center font-bold" style={{ minWidth: '150px' }}>
                ملاحظات
              </th>
            </tr>
          </thead>

          <tbody>
            {students.map((student: any, index: number) => (
              <tr key={student.studentId} className="border-b border-gray-300 hover:bg-gray-50">
                {/* Row Number */}
                <td className="sticky left-0 bg-white border-r border-black p-2 text-center font-semibold z-10">
                  {index + 1}
                </td>

                {/* Student Name */}
                <td className="sticky left-14 bg-white border-r border-black p-2 text-right z-10">
                  {student.name}
                </td>

                {/* Father Name */}
                <td className="border-r border-black p-2 text-right">
                  {student.fatherName}
                </td>

                {/* Grandfather Name */}
                <td className="border-r border-black p-2 text-right">
                  -
                </td>

                {/* Admission Number */}
                <td className="border-r border-black p-2 text-center text-xs">
                  {student.admissionNo}
                </td>

                {/* Subject Marks */}
                {AFGHAN_SUBJECTS.map((subject) => {
                  const mark = student.subjectMarks[subject.code]?.marks;
                  const isAbsent = student.subjectMarks[subject.code]?.isAbsent;
                  
                  return (
                    <td 
                      key={subject.code} 
                      className="border-r border-black p-2 text-center"
                      style={{ 
                        background: isAbsent ? '#fee2e2' : mark && mark < 40 ? '#fef3c7' : 'white'
                      }}
                    >
                      {isAbsent ? 'غ' : (mark || '-')}
                    </td>
                  );
                })}

                {/* Attendance */}
                <td className="border-r border-black p-2 text-center bg-blue-50">
                  {student.attendance?.totalDays || 0}
                </td>
                <td className="border-r border-black p-2 text-center bg-green-50">
                  {student.attendance?.presentDays || 0}
                </td>
                <td className="border-r border-black p-2 text-center bg-red-50">
                  {student.attendance?.absentDays || 0}
                </td>
                <td className="border-r border-black p-2 text-center bg-yellow-50">
                  {student.attendance?.leave || 0}
                </td>

                {/* Summary */}
                <td className="border-r border-black p-2 text-center font-bold bg-purple-50">
                  {student.totalMarks}
                </td>
                <td className="border-r border-black p-2 text-center bg-purple-50">
                  {student.averageMarks.toFixed(2)}
                </td>
                <td className="border-r border-black p-2 text-center text-xs font-semibold bg-orange-50">
                  {student.status}
                </td>
                <td className="border-r border-black p-2 text-center font-bold bg-orange-50">
                  /
                </td>
                <td className="p-2 text-xs">
                  {student.subjectMarks?.remarks || ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer - Approval Sections (Excel Bottom) */}
      <div className="grid grid-cols-3 gap-4 mt-6 border-t-2 border-black pt-4">
        <div className="border border-black p-4">
          <h3 className="text-sm font-bold text-center mb-2">تائیدی آمر لیسه</h3>
          <div className="h-24 border-t border-gray-400 flex items-end justify-center text-xs text-gray-600">
            {headerFields.principalName || '----------------'}
          </div>
        </div>
        <div className="border border-black p-4">
          <h3 className="text-sm font-bold text-center mb-2">عضو علمی و انکشاف مسلکی</h3>
          <div className="h-24 border-t border-gray-400 flex items-end justify-center text-xs text-gray-600">
            {headerFields.committeeFirst || '----------------'}
          </div>
        </div>
        <div className="border border-black p-4">
          <h3 className="text-sm font-bold text-center mb-2">تائیدی آمریت معارف حوزه ولسوالی</h3>
          <div className="h-24 border-t border-gray-400 flex items-end justify-center text-xs text-gray-600">
            {headerFields.academicManagerName || '----------------'}
          </div>
        </div>
      </div>

      {/* Print Button */}
      <div className="mt-4 flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Print Subject-wise List
        </button>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SubjectWiseAnalysis;


