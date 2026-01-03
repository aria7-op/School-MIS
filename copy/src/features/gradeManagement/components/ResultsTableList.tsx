import React, { useState, useEffect } from 'react';
import gradeManagementService from '../services/gradeManagementService';
import { useStudentListHeaderFields } from '../context/StudentListHeaderContext';

interface ResultsTableListProps {
  classId: string;
  examType: 'MIDTERM' | 'FINAL';
}

/**
 * Results Table List (فهرست جدول) - 6th Sheet
 * Clean summary list of all students with their final results
 * Excel Formula Pattern: All data from "جدول نتایج" sheet
 */
const ResultsTableList: React.FC<ResultsTableListProps> = ({
  classId,
  examType
}) => {
  const [annualData, setAnnualData] = useState<any>(null);
  const [midtermData, setMidtermData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const headerFields = useStudentListHeaderFields();

  useEffect(() => {
    loadData();
  }, [classId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [annual, midterm] = await Promise.all([
        gradeManagementService.getExcelGradeSheetByType(classId, 'FINAL'),
        gradeManagementService.getExcelGradeSheetByType(classId, 'MIDTERM')
      ]);
      setAnnualData(annual);
      setMidtermData(midterm);
    } catch (error) {
      console.error('Error loading results table list:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !annualData || !midtermData) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  // Excel formula references column E (Final Total = Midterm + Annual)
  // But for display, use the selected exam type
  const displayData = examType === 'FINAL' ? annualData : midtermData;
  const { students, classInfo } = displayData;

  return (
    <div className="bg-white p-4" style={{ fontSize: '10pt' }}>
      {/* Exam Type Selector */}
      <div className="mb-4 text-center print:hidden">
        <p className="text-sm text-gray-600 mb-2">
          Note: 6th sheet shows <strong>FINAL exam</strong> results by default. 
          Switch to see {examType === 'FINAL' ? 'MIDTERM' : 'FINAL'} data.
        </p>
      </div>

      {/* Header Section - Excel EXACT Layout */}
      <div className="border-2 border-black mb-2 p-3">
        <div className="grid grid-cols-12 gap-2">
          
          {/* LEFT SIDE: Two Summary Tables (Excel Columns A-D) */}
          <div className="col-span-3 space-y-2" dir="rtl">
            {/* Annual Results Summary */}
            <div className="border border-black">
              <div className="border-b border-black p-1 text-center">
                <h3 className="text-xs font-bold">خلص نتایج سالانه</h3>
              </div>
              <table className="w-full text-[9pt]" dir="rtl">
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="p-1 text-right">{annualData.classStatistics.totalStudents}</td>
                    <td className="p-1 text-right font-semibold">تعداد داخله</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-1 text-right">{annualData.classStatistics.totalStudents}</td>
                    <td className="p-1 text-right">شامل امتحان</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-1 text-right font-bold">{annualData.classStatistics.successfulCount}</td>
                    <td className="p-1 text-right">ارتقا صنف</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-1 text-right font-bold">{annualData.classStatistics.failedCount}</td>
                    <td className="p-1 text-right">تکرار صنف</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-1 text-right font-bold">{annualData.classStatistics.conditionalCount}</td>
                    <td className="p-1 text-right">مشروط</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-1 text-right">0</td>
                    <td className="p-1 text-right">معذرتی</td>
                  </tr>
                  <tr>
                    <td className="p-1 text-right">0</td>
                    <td className="p-1 text-right">محروم</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Midterm Results Summary */}
            <div className="border border-black">
              <div className="border-b border-black p-1 text-center">
                <h3 className="text-xs font-bold">خلص نتایج چهارونیم ماهه</h3>
              </div>
              <table className="w-full text-[9pt]" dir="rtl">
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="p-1 text-right">{midtermData.classStatistics.totalStudents}</td>
                    <td className="p-1 text-right font-semibold">تعداد داخله</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-1 text-right">{midtermData.classStatistics.totalStudents}</td>
                    <td className="p-1 text-right">شامل امتحان</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-1 text-right font-bold">{midtermData.classStatistics.successfulCount}</td>
                    <td className="p-1 text-right">موفق</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-1 text-right">0</td>
                    <td className="p-1 text-right">تلاش بیشتر</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-1 text-right">0</td>
                    <td className="p-1 text-right">معذرتی</td>
                  </tr>
                  <tr>
                    <td className="p-1 text-right">0</td>
                    <td className="p-1 text-right">غایب</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* CENTER: Ministry Info & Logos (Excel Columns E-H) */}
          <div className="col-span-6 text-center flex flex-col justify-center">
            <div className="flex justify-center gap-8 items-start mb-2">
              {/* Left Logo */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-2 border-gray-400 flex items-center justify-center bg-gray-50 mb-1">
                  <span className="text-xl">🏛️</span>
                </div>
                <p className="text-[8pt]">امضاء، سر معلم مربوطه</p>
                <div className="border-b border-black w-32 mt-1 text-[8pt] text-gray-600">
                  {headerFields.headTeacherName || '----------------'}
                </div>
              </div>

              {/* Ministry Info */}
              <div>
                <h2 className="text-lg font-bold mb-1">وزارت معارف</h2>
                <p className="text-xs">(   ) ریاست معارف</p>
                <p className="text-xs">(   ) امریت معارف</p>
                <p className="text-xs">(   ) لیسه عالی</p>
                <p className="text-sm font-bold mt-2 border-t-2 border-b-2 border-black py-1">خلص جدول نتایج</p>
                <p className="text-xs mt-1">1447</p>
              </div>

              {/* Right Logo */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-2 border-gray-400 flex items-center justify-center bg-gray-50 mb-1">
                  <span className="text-xl">📚</span>
                </div>
                <p className="text-[8pt]">امضاء، نگران صنف</p>
                <div className="border-b border-black w-32 mt-1 text-[8pt] text-gray-600">
                  {headerFields.supervisorName || '----------------'}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-2 text-xs">
              <p>صنف: <span className="font-bold">{classInfo?.className || '(   )'}</span></p>
              <p>سال تعلیمی: <span className="font-bold">1404</span></p>
            </div>
          </div>

          {/* RIGHT SIDE: Column Headers Preview (Excel Columns I-K) */}
          <div className="col-span-3 flex flex-col justify-end">
            <div className="grid grid-cols-3 gap-1 text-[8pt] text-center border border-black">
              <div className="border-r border-black p-1 font-bold">نام</div>
              <div className="border-r border-black p-1 font-bold">نام پدر</div>
              <div className="p-1 font-bold">نام پدر کلان</div>
            </div>
            <div className="text-[8pt] text-center border border-black border-t-0 p-1 font-bold">
              شهرت
            </div>
          </div>
        </div>
      </div>

      {/* Main Table - Excel Exact Column Order (RIGHT TO LEFT: K, J, I, H, G, F, E, D, C, B, A) */}
      <div className="border border-black">
        <table className="w-full border-collapse text-[10pt]">
          <thead>
            {/* Excel Row 9: Column Headers */}
            <tr className="border-b border-black" style={{ background: '#f3f4f6' }}>
              {/* K - شماره (Number) - Rightmost */}
              <th className="border-l border-black p-1.5 text-center font-bold" style={{ width: '50px' }}>
                شماره
              </th>
              {/* J - Space for student info */}
              <th className="border-l border-black p-1.5 text-center font-bold" colSpan={3} style={{ width: '400px' }}>
                <div className="grid grid-cols-3">
                  <div>نام</div>
                  <div>نام پدر</div>
                  <div>نام پدر کلان</div>
                </div>
              </th>
              {/* G - شهرت */}
              <th className="border-l border-black p-1.5 text-center font-bold" style={{ width: '100px' }}>
                شهرت
              </th>
              {/* F - نمبر اساس */}
              <th className="border-l border-black p-1.5 text-center font-bold" style={{ width: '120px' }}>
                نمبر اساس
              </th>
              {/* E - نمبر تذکره */}
              <th className="border-l border-black p-1.5 text-center font-bold" style={{ width: '120px' }}>
                نمبر تذکره
              </th>
              {/* D - مجموعه نمرات */}
              <th className="border-l border-black p-1.5 text-center font-bold" style={{ width: '100px' }}>
                مجموعه نمرات
              </th>
              {/* C - اوسط */}
              <th className="border-l border-black p-1.5 text-center font-bold" style={{ width: '70px' }}>
                اوسط
              </th>
              {/* B - نتیجه */}
              <th className="border-l border-black p-1.5 text-center font-bold" style={{ width: '100px' }}>
                نتیجه
              </th>
              {/* A - درجه (Leftmost) */}
              <th className="p-1.5 text-center font-bold" style={{ width: '60px' }}>
                درجه
              </th>
            </tr>
          </thead>

          <tbody>
            {students.map((student: any, index: number) => (
              <tr key={student.studentId} className="border-b border-gray-200 hover:bg-gray-50">
                {/* K - شماره (Number) = Excel J11 */}
                <td className="border-l border-black p-1 text-center font-semibold">
                  {index + 1}
                </td>

                {/* J, I, H - Student Names = Excel I11, H11, G11 */}
                <td className="border-l border-black p-1 text-right text-[9pt]">
                  {student.name}
                </td>
                <td className="border-l border-black p-1 text-right text-[9pt]">
                  {student.fatherName}
                </td>
                <td className="border-l border-black p-1 text-right text-[9pt]">
                  -
                </td>

                {/* G - شهرت (Surname) = Excel blank */}
                <td className="border-l border-black p-1 text-center text-[9pt]">
                  -
                </td>

                {/* F - نمبر اساس = Excel F11 = 'جدول نتایج '!$C$16 */}
                <td className="border-l border-black p-1 text-center text-[8pt]">
                  {student.admissionNo}
                </td>

                {/* E - نمبر تذکره = Excel E11 = 'جدول نتایج '!$C$17 */}
                <td className="border-l border-black p-1 text-center text-[8pt]">
                  {student.cardNo || '-'}
                </td>

                {/* D - مجموعه نمرات = Excel D11 = 'جدول نتایج '!$E$36 */}
                <td className="border-l border-black p-1 text-center font-bold">
                  {student.totalMarks}
                </td>

                {/* C - اوسط = Excel C11 = 'جدول نتایج '!$E$37 */}
                <td className="border-l border-black p-1 text-center">
                  {student.averageMarks.toFixed(2)}
                </td>

                {/* B - نتیجه = Excel B11 = 'جدول نتایج '!$D$38 */}
                <td 
                  className="border-l border-black p-1 text-center text-[9pt] font-semibold"
                  style={{
                    background: student.status === 'ارتقا صنف' ? '#d1fae5' : 
                               student.status === 'تکرار صنف' ? '#fee2e2' :
                               student.status === 'مشروط' ? '#fef3c7' : 'white'
                  }}
                >
                  {student.status}
                </td>

                {/* A - درجه = Excel A11 = 'جدول نتایج '!$D$39 */}
                <td className="p-1 text-center font-bold">
                  /
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer - Excel Exact Format */}
      <div className="border-t-2 border-black mt-3 pt-3">
        <div className="grid grid-cols-3 gap-2 text-[9pt]">
          {/* Left Section */}
          <div className="text-right">
            <p>قرار شرح فوق فهرست صنف: (   )</p>
            <p className="mt-1">در <span className="border-b border-black px-4">0.0</span> ورق ترتیب و تقدیم است.</p>
            <p className="mt-2">
              امضاء و نام نگران صنف:
              <span className="inline-block border-b border-black px-2 ml-1 min-w-[120px] text-center">
                {headerFields.supervisorName || '----------------'}
              </span>
            </p>
            <div className="border-t border-black mt-8 h-12"></div>
          </div>

          {/* Center Section */}
          <div className="text-center border-x-2 border-black px-2">
            <p className="font-semibold mb-1">تائیدی آمر لیسه</p>
            <div className="border-t border-black mt-16 h-12 flex items-end justify-center text-xs text-gray-600">
              {headerFields.principalName || '----------------'}
            </div>
            <p className="font-semibold mt-8 mb-1">عضو علمی و انکشاف مسلکی</p>
            <div className="border-t border-black mt-4 h-12"></div>
          </div>

          {/* Right Section */}
          <div className="text-center">
            <p className="font-semibold mb-1">تائیدی آمریت معارف حوزه ولسوالی</p>
            <div className="border-t border-black mt-16 h-12 flex items-end justify-center text-xs text-gray-600">
              {headerFields.academicManagerName || '----------------'}
            </div>
          </div>
        </div>
      </div>

      {/* Print Button */}
      <div className="mt-4 flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Print Results List
        </button>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ResultsTableList;

