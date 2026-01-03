import React, { useState, useEffect } from 'react';
import gradeManagementService from '../services/gradeManagementService';
import { AFGHAN_SUBJECTS } from '../constants/afghanSubjects';
import { useStudentListHeaderFields } from '../context/StudentListHeaderContext';

interface StudentReportCardProps {
  classId: string;
  studentId?: string;
  examType: 'MIDTERM' | 'FINAL';
}

/**
 * Student Report Card (اطلاع نامه) - 4th Sheet
 * Individual printable report card matching Excel layout pixel-perfect
 */
const StudentReportCard: React.FC<StudentReportCardProps> = ({
  classId,
  studentId,
  examType
}) => {
  const [reportData, setReportData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState(studentId || '');
  const [loading, setLoading] = useState(true);
  const headerFields = useStudentListHeaderFields();

  useEffect(() => {
    loadStudents();
  }, [classId]);

  useEffect(() => {
    if (selectedStudentId) {
      loadReportCard();
    }
  }, [selectedStudentId, examType]);

  const loadStudents = async () => {
    try {
      const sheet = await gradeManagementService.getExcelGradeSheetByType(classId, 'MIDTERM');
      setStudents(sheet.students);
      if (!selectedStudentId && sheet.students.length > 0) {
        setSelectedStudentId(sheet.students[0].studentId);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadReportCard = async () => {
    try {
      setLoading(true);
      const [midterm, annual] = await Promise.all([
        gradeManagementService.getExcelGradeSheetByType(classId, 'MIDTERM'),
        gradeManagementService.getExcelGradeSheetByType(classId, 'FINAL')
      ]);

      const midtermStudent = midterm.students.find((s: any) => s.studentId === selectedStudentId);
      const annualStudent = annual.students.find((s: any) => s.studentId === selectedStudentId);

      setReportData({
        student: midtermStudent || annualStudent,
        midtermSheet: midterm,
        annualSheet: annual,
        classInfo: midterm.classInfo,
        examInfo: midterm.examInfo
      });
    } catch (error) {
      console.error('Error loading report card:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMark = (subjectCode: string, type: 'MIDTERM' | 'FINAL') => {
    if (!reportData) return 0;
    const sheet = type === 'MIDTERM' ? reportData.midtermSheet : reportData.annualSheet;
    const student = sheet.students.find((s: any) => s.studentId === selectedStudentId);
    return student?.subjectMarks[subjectCode]?.marks || 0;
  };

  const getTotal = (type: 'MIDTERM' | 'FINAL') => {
    if (!reportData) return 0;
    const sheet = type === 'MIDTERM' ? reportData.midtermSheet : reportData.annualSheet;
    const student = sheet.students.find((s: any) => s.studentId === selectedStudentId);
    return student?.totalMarks || 0;
  };

  const getAverage = (type: 'MIDTERM' | 'FINAL') => {
    if (!reportData) return 0;
    const sheet = type === 'MIDTERM' ? reportData.midtermSheet : reportData.annualSheet;
    const student = sheet.students.find((s: any) => s.studentId === selectedStudentId);
    return student?.averageMarks || 0;
  };

  const getStatus = (type: 'MIDTERM' | 'FINAL') => {
    if (!reportData) return '';
    const sheet = type === 'MIDTERM' ? reportData.midtermSheet : reportData.annualSheet;
    const student = sheet.students.find((s: any) => s.studentId === selectedStudentId);
    return student?.status || '';
  };

  if (loading || !reportData) {
    return <div className="flex items-center justify-center h-64">Loading report card...</div>;
  }

  const student = reportData.student;
  // Use ALL subjects from Afghan curriculum (Excel shows all subjects)
  const allSubjects = AFGHAN_SUBJECTS;

  return (
    <div className="bg-white p-8">
      {/* Student Selector */}
      <div className="mb-6 flex items-center gap-4">
        <label className="font-semibold">Select Student:</label>
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {students.map((s) => (
            <option key={s.studentId} value={s.studentId}>
              {s.rowNumber}. {s.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 print:hidden"
        >
          Print Report Card
        </button>
      </div>

      {/* Report Card - Pixel Perfect to Excel A4 Size */}
      <div className="border-2 border-black bg-white" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontSize: '11pt' }}>
        
        {/* Header Section - Exact Excel Match */}
        <div className="grid grid-cols-3 border-b-0 border-black " style={{ background: 'linear-gradient(to right, #bfdbfe, #60a5fa, #bfdbfe)', minHeight: '120px' }}>
          {/* Left Header */}
          <div className="border-r-0 border-black  p-6 flex flex-col items-center justify-center" style={{ minHeight: '120px' }}>
              <img src="https://moe.gov.af/sites/default/files/2021-10/logo12.png"/>
          </div>

          {/* Center Header - Banner (Excel Blue Gradient) */}
          <div className="border-r-0 border-black flex flex-col items-center justify-center" >
            <div className="text-center py-2">
              <div className=" text-white px-12 py-4 rounded-md  inline-block">
                <h1 className="text-3xl font-bold">اطلاع نامه</h1>
              </div>
              <p className="text-sm mt-3 font-semibold">سال تعلیمی: 1404 هـ ش</p>
              <p className="text-sm mt-1">صنف: <span className="font-bold">{reportData.classInfo.className}</span></p>
              <p dir="rtl" className="text-sm text-center">نګران صنف: (       )</p>
            </div>
          </div>

          {/* Right Header */}
          <div className="p-6 flex flex-col items-center justify-center" style={{ minHeight: '120px' }}>
              <img src="https://www.freeiconspng.com/thumbs/school-icon-png/high-school-icon-png-8.png" className=' w-[150px] h-[150px]'/>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-2 gap-0">
          
          {/* LEFT SIDE */}
          <div className="border-r border-black p-4">
            
            {/* Student Information - Excel Format */}
            <div className="mb-3 space-y-1" style={{ fontSize: '11pt' }}>
              <div className="flex items-center py-1 ">
                <span className="flex-1 border-b border-gray-600 pb-0.5">{student.rowNumber}</span>
                <span className="font-bold text-right w-32">شماره حاضری</span>
              </div>
              <div className="flex items-center py-1">
                <span className="flex-1 border-b border-gray-600 pb-0.5">{student.name}</span>
                <span className="font-bold text-right w-32">نام:</span>
              </div>
              <div className="flex items-center py-1">
                <span className="flex-1 border-b border-gray-600 pb-0.5">{student.fatherName}</span>
                <span className="font-bold text-right w-32">نام پدر:</span>
              </div>
              <div className="flex items-center py-1">
                <span className="flex-1 border-b border-gray-600 pb-0.5">-</span>
                <span className="font-bold text-right w-32">نام پدرکلان:</span>
              </div>
              <div className="flex items-center py-1">
                <span className="flex-1 border-b border-gray-600 pb-0.5">{student.admissionNo}</span>
                <span className="font-bold text-right w-32">نمبر اساس:</span>
              </div>
              <div className="flex items-center py-1">
                <span className="flex-1 border-b border-gray-600 pb-0.5">{student.cardNo || '-'}</span>
                <span className="font-bold text-right w-32">نمبر تذکره:</span>
              </div>
            </div>

            {/* Subjects and Marks Table - Excel Styling */}
            <div className="border border-black mt-2">
              <table className="w-full border-collapse" style={{ fontSize: '10pt' }}>
                <thead>
                  <tr className="border-b border-black" style={{ background: '#d1d5db' }}>
                    <th className="border-r border-black p-1.5 text-[10pt] text-right font-bold">امتحانات / مضامین</th>
                    <th className="border-r border-black p-1.5 text-[10pt] text-center font-bold" style={{ width: '70px' }}>چهارونیم ماهه</th>
                    <th className="border-r border-black p-1.5 text-[10pt] text-center font-bold" style={{ width: '70px' }}>سالانه</th>
                    <th className="p-1.5 text-[10pt] text-center font-bold" style={{ width: '70px' }}>نمرات نهائی</th>
                  </tr>
                </thead>
                <tbody>
                  {allSubjects.map((subject) => {
                    const midMark = getMark(subject.code, 'MIDTERM');
                    const annMark = getMark(subject.code, 'FINAL');
                    const finalMark = midMark + annMark;
                    
                    return (
                      <tr key={subject.code} className="border-b border-gray-300">
                        <td className="border-r border-black p-1.5 text-[10pt] text-right">{subject.nameLocal}</td>
                        <td className="border-r border-black p-1.5 text-[10pt] text-center">{midMark || '-'}</td>
                        <td className="border-r border-black p-1.5 text-[10pt] text-center">{annMark || '-'}</td>
                        <td className="p-1.5 text-[10pt] text-center font-semibold">{finalMark || '-'}</td>
                      </tr>
                    );
                  })}
                  
                  {/* Summary Rows - Excel Exact Colors */}
                  <tr className="border-b border-black font-bold" style={{ background: '#fef3c7' }}>
                    <td className="border-r border-black p-1.5 text-[10pt] text-right">مجموعه نمرات</td>
                    <td className="border-r border-black p-1.5 text-[10pt] text-center">{getTotal('MIDTERM')}</td>
                    <td className="border-r border-black p-1.5 text-[10pt] text-center">{getTotal('FINAL')}</td>
                    <td className="p-1.5 text-[10pt] text-center">{getTotal('MIDTERM') + getTotal('FINAL')}</td>
                  </tr>
                  <tr className="border-b border-black" style={{ background: '#bfdbfe' }}>
                    <td className="border-r border-black p-1.5 text-[10pt] text-right font-bold">اوسط نمرات</td>
                    <td className="border-r border-black p-1.5 text-[10pt] text-center">{getAverage('MIDTERM').toFixed(2)}</td>
                    <td className="border-r border-black p-1.5 text-[10pt] text-center" colSpan={2}>{getAverage('FINAL').toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-black" style={{ background: '#e9d5ff' }}>
                    <td className="border-r border-black p-1.5 text-[10pt] text-right font-bold">نتیجه</td>
                    <td className="border-r border-black p-1.5 text-[10pt] text-center">{getStatus('MIDTERM')}</td>
                    <td className="border-r border-black p-1.5 text-[10pt] text-center" colSpan={2}>{getStatus('FINAL')}</td>
                  </tr>
                  <tr style={{ background: '#e9d5ff' }}>
                    <td className="border-r border-black p-1.5 text-[10pt] text-right font-bold">درجه</td>
                    <td className="border-r border-black p-1.5 text-[10pt] text-center">/</td>
                    <td className="border-r border-black p-1.5 text-[10pt] text-center" colSpan={2}>/</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Attendance Section */}
            <div className="mt-4 border-2 border-black p-3">
              <h3 className="text-sm font-bold text-center mb-2">ضوابط حاضری</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-right">ایام سال تعلیمی:</div>
                <div className="border-b border-black">{student.attendance?.totalDays || 0}</div>
                <div className="text-right">حاضر:</div>
                <div className="border-b border-black">{student.attendance?.presentDays || 0}</div>
                <div className="text-right">غیر حاضر:</div>
                <div className="border-b border-black">{student.attendance?.absentDays || 0}</div>
                <div className="text-right">مریض:</div>
                <div className="border-b border-black">0</div>
                <div className="text-right">رخصت:</div>
                <div className="border-b border-black">{student.attendance?.leave || 0}</div>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-right font-semibold">امضاء نگران صنف:</p>
                  <div className="border-b border-black h-8 flex items-end justify-end px-2 text-gray-600">
                    {headerFields.supervisorName || '----------------'}
                  </div>
                </div>
                <div>
                  <p className="text-right font-semibold">امضاء سرمعلم:</p>
                  <div className="border-b border-black h-8 flex items-end justify-end px-2 text-gray-600">
                    {headerFields.headTeacherName || '----------------'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-right font-semibold">امضاء مدیر مکتب:</p>
                  <div className="border-b border-black h-8 flex items-end justify-end px-2 text-gray-600">
                    {headerFields.principalName || '----------------'}
                  </div>
                </div>
                <div>
                  <p className="text-right font-semibold">امضاء ولی شاگرد:</p>
                  <div className="border-b border-black h-8"></div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Grading Criteria */}
          <div className="p-4">
            <h3 className="text-sm font-bold text-center mb-4 border-b-2 border-black pb-2">
              درجه بندی شاگردان
            </h3>

            {/* Midterm Grading */}
            <div className="mb-6 border-2 border-blue-500 p-3 rounded">
              <h4 className="text-xs font-bold mb-2 bg-blue-100 p-2">امتحان چهارونیم ماهه</h4>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-black">
                    <th className="text-right p-1">نمرات</th>
                    <th className="text-center p-1">درجه</th>
                    <th className="text-right p-1">نتیجه</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="p-1 text-right">36 - 40</td>
                    <td className="p-1 text-center font-bold">الف</td>
                    <td className="p-1 text-right" rowSpan={4}>موفق</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-1 text-right">30 - 35.99</td>
                    <td className="p-1 text-center font-bold">ب</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-1 text-right">24 - 29.99</td>
                    <td className="p-1 text-center font-bold">ج</td>
                  </tr>
                  <tr className="border-b-2 border-black">
                    <td className="p-1 text-right">20 - 23.99</td>
                    <td className="p-1 text-center font-bold">د</td>
                  </tr>
                  <tr>
                    <td className="p-1 text-right">0 - 19.99 یا کمتر از 16 در یک مضمون</td>
                    <td className="p-1 text-center font-bold">هـ</td>
                    <td className="p-1 text-right">تلاش بیشتر</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Annual Grading */}
            <div className="border-2 border-green-500 p-3 rounded">
              <h4 className="text-xs font-bold mb-2 bg-green-100 p-2">امتحان سالانه</h4>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-black">
                    <th className="text-right p-1">نمرات</th>
                    <th className="text-center p-1">درجه</th>
                    <th className="text-right p-1">نتیجه</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="p-1 text-right">90 - 100</td>
                    <td className="p-1 text-center font-bold">الف</td>
                    <td className="p-1 text-right" rowSpan={4}>ارتقا صنف</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-1 text-right">75 - 89.99</td>
                    <td className="p-1 text-center font-bold">ب</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-1 text-right">60 - 74.99</td>
                    <td className="p-1 text-center font-bold">ج</td>
                  </tr>
                  <tr className="border-b-2 border-black">
                    <td className="p-1 text-right">50 - 59.99</td>
                    <td className="p-1 text-center font-bold">د</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-1 text-right">50+ و 1-3 مضمون کمتر از 40</td>
                    <td className="p-1 text-center font-bold">هـ</td>
                    <td className="p-1 text-right">مشروط</td>
                  </tr>
                  <tr>
                    <td className="p-1 text-right">0-49.99 یا بیشتر از 3 مضمون کمتر از 40</td>
                    <td className="p-1 text-center font-bold">و</td>
                    <td className="p-1 text-right">تکرار صنف</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer Note */}
            <div className="mt-6 text-[10px] text-gray-700 p-2 bg-gray-50 rounded">
              <p className="text-justify">
                <strong>یادداشت:</strong> در صورت که شهرت، نام پدر، نمبر اساس، نمبر تذکره و یا سایر مشخصات مربوط به شاگرد مطابرت نداشته باشد، الی مدت سه روز بعد از ابلاغ نتایج جهت اصلاح آن به اداره مکتب مراجعه نمایند.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .border-4 {
            visibility: visible;
          }
          .border-4 * {
            visibility: visible;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentReportCard;

