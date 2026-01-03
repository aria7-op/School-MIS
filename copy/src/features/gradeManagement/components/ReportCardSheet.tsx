import React, { useState, useEffect } from 'react';
import gradeManagementService from '../services/gradeManagementService';
import { useStudentListHeaderFields } from '../context/StudentListHeaderContext';

/**
 * Report Card Sheet - Matches Excel "اطلاع نامه" worksheet
 * Shows personalized report cards with motivational messages
 */
interface ReportCardSheetProps {
  classId: string;
  examType: 'MIDTERM' | 'FINAL';
  editable?: boolean;
  onDataChange?: () => void;
}

const ReportCardSheet: React.FC<ReportCardSheetProps> = ({ classId, examType }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [reportCard, setReportCard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const headerFields = useStudentListHeaderFields();

  useEffect(() => {
    loadStudents();
  }, [classId]);

  const loadStudents = async () => {
    try {
      const data = await gradeManagementService.getClassStudents(classId);
      setStudents(data || []);
      if (data && data.length > 0) {
        setSelectedStudent(data[0].id);
        loadReportCard(data[0].id);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadReportCard = async (studentId: string) => {
    try {
      setLoading(true);
      const data = await gradeManagementService.generateReportCard(
        studentId,
        examType.toLowerCase() as 'midterm' | 'final'
      );
      setReportCard(data);
    } catch (error) {
      console.error('Error loading report card:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-liner-to-r from-gray-100 to-gray-200 py-6 px-4">
      {/* Print Styles */}
      <style>{`
        @media print {
          /* Hide everything except printable content */
          .no-print {
            display: none !important;
          }

          /* Reset body */
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Show only printable area */
          .printable-area {
            display: block !important;
            position: relative !important;
            left: auto !important;
            top: auto !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }

          /* A4 paper for print */
          .a4-paper {
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            box-shadow: none !important;
            margin: 0 !important;
            page-break-after: always;
          }

          /* Remove shadows and rounded corners for print */
          .report-card-content * {
            box-shadow: none !important;
          }

          /* Page settings */
          @page {
            size: A4 portrait;
            margin: 15mm;
          }

          /* Ensure backgrounds print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }

        /* A4 Paper Dimensions for screen */
        @media screen {
          .a4-paper {
            width: 210mm;
            min-height: 297mm;
            background: white;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
            margin: 0 auto;
          }
        }
      `}</style>

      {/* Student Selector & Print Button - NO PRINT */}
      <div className="no-print max-w-[210mm] mx-auto mb-6 space-y-4">
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <label className="flex-1 text-sm font-bold mb-2 text-gray-700 flex items-center gap-2">
                <span className="material-icons text-blue-600">person</span>
                Select Student:
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => {
                  setSelectedStudent(e.target.value);
                  loadReportCard(e.target.value);
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-base font-medium"
              >
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.rollNo} - {student.user?.firstName} {student.user?.lastName}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handlePrint}
              disabled={!reportCard || loading}
              className="px-8 py-3 bg-liner-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all hover:shadow-xl hover:scale-105 mt-auto"
            >
              <span className="material-icons text-xl">print</span>
              <span>Print Report Card</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Card Display - PRINTABLE */}
      {loading ? (
        <div className="no-print flex flex-col justify-center items-center p-20 bg-white rounded-xl shadow-lg max-w-[210mm] mx-auto">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Report Card...</p>
        </div>
      ) : reportCard ? (
        <div className="printable-area">
          <div className="a4-paper report-card-content">
            {/* Decorative Header Border */}
            <div className="h-3 bg-liner-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
            
            <div className="p-12">
              {/* Report Card Header */}
              <div className="text-center border-4 border-double border-gray-800 rounded-lg p-6 mb-8 bg-liner-to-r from-blue-50 to-indigo-50">
                <div className="flex justify-center mb-4">
                  <div className="bg-blue-600 text-white rounded-full p-4">
                    <span className="material-icons text-5xl">school</span>
                  </div>
                </div>
                <h1 className="text-4xl font-black mb-3 text-gray-900" style={{ fontFamily: 'Arial, sans-serif' }}>
                  اطلاع نامه نتایج
                </h1>
                <h2 className="text-2xl font-bold text-blue-700 mb-2">Student Report Card</h2>
                <div className="flex justify-center gap-4 mt-4 flex-wrap">
                  <p className="text-sm font-semibold bg-white px-4 py-2 rounded-full border-2 border-blue-300">
                    Academic Year 1404 هجري شمسي
                  </p>
                  <p className="text-sm font-semibold bg-white px-4 py-2 rounded-full border-2 border-green-300">
                    {examType === 'MIDTERM' ? 'امتحان چهارنیما' : 'امتحان سالانه'}
                  </p>
                </div>
              </div>

              {/* Student Information Card */}
              <div className="mb-8 border-2 border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-liner-to-r from-blue-600 to-indigo-600 text-white px-6 py-3">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <span className="material-icons">badge</span>
                    Student Information
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-6 p-6 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 rounded-full p-2">
                      <span className="material-icons text-blue-600">person</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600 block">Student Name</span>
                      <p className="font-bold text-lg text-gray-900">{reportCard.student?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 rounded-full p-2">
                      <span className="material-icons text-green-600">tag</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600 block">Roll Number</span>
                      <p className="font-bold text-lg text-gray-900">{reportCard.student?.rollNo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 rounded-full p-2">
                      <span className="material-icons text-purple-600">class</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600 block">Class</span>
                      <p className="font-bold text-lg text-gray-900">{reportCard.student?.class}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 rounded-full p-2">
                      <span className="material-icons text-amber-600">confirmation_number</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600 block">Admission No</span>
                      <p className="font-bold text-lg text-gray-900">{reportCard.student?.admissionNo}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exam Results */}
              {reportCard.reportCard?.map((exam: any, index: number) => (
                <div key={index} className="mb-8">
                  <div className="bg-liner-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-t-lg">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <span className="material-icons">assessment</span>
                      {exam.examName}
                    </h3>
                  </div>
                  
                  {/* Subjects Table */}
                  <table className="w-full border-2 border-gray-300 mb-6">
                    <thead className="bg-liner-to-r from-gray-700 to-gray-800 text-white">
                      <tr>
                        <th className="border-2 border-gray-600 px-4 py-3 text-left">
                          <div className="flex items-center gap-2">
                            <span className="material-icons text-sm">menu_book</span>
                            Subject / مضمون
                          </div>
                        </th>
                        <th className="border-2 border-gray-600 px-4 py-3 text-center w-32">
                          <div className="flex items-center justify-center gap-2">
                            <span className="material-icons text-sm">grade</span>
                            Marks / نمرات
                          </div>
                        </th>
                        <th className="border-2 border-gray-600 px-4 py-3 text-center w-24">
                          <div className="flex items-center justify-center gap-2">
                            <span className="material-icons text-sm">stars</span>
                            Grade
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {exam.subjects?.map((subject: any, idx: number) => (
                        <tr 
                          key={idx} 
                          className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        >
                          <td className="border-2 border-gray-300 px-4 py-3 font-semibold text-gray-900">
                            {subject.subject?.name}
                          </td>
                          <td className="border-2 border-gray-300 px-4 py-3 text-center">
                            {subject.isAbsent ? (
                              <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                                غایب (Absent)
                              </span>
                            ) : (
                              <span className="text-xl font-black text-blue-700">
                                {subject.marks}
                              </span>
                            )}
                          </td>
                          <td className="border-2 border-gray-300 px-4 py-3 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full font-bold text-sm ${
                              subject.grade === 'A+' || subject.grade === 'A' 
                                ? 'bg-green-100 text-green-700'
                                : subject.grade === 'B+' || subject.grade === 'B'
                                ? 'bg-blue-100 text-blue-700'
                                : subject.grade === 'C+' || subject.grade === 'C'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {subject.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-liner-to-r from-blue-600 to-indigo-600 text-white font-bold">
                        <td className="border-2 border-blue-700 px-4 py-4 text-lg">
                          <div className="flex items-center gap-2">
                            <span className="material-icons">calculate</span>
                            Total / Average
                          </div>
                        </td>
                        <td className="border-2 border-blue-700 px-4 py-4 text-center text-2xl font-black">
                          {exam.totalMarks}
                        </td>
                        <td className="border-2 border-blue-700 px-4 py-4 text-center text-xl font-black">
                          {exam.averageMarks?.toFixed(2)}%
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Status and Message */}
                  <div className={`rounded-lg p-6 border-4 ${
                    exam.status === 'ارتقا صنف' || exam.status === 'موفق'
                      ? 'bg-liner-to-r from-green-50 to-emerald-50 border-green-400'
                      : exam.status === 'مشروط'
                      ? 'bg-liner-to-r from-yellow-50 to-amber-50 border-yellow-400'
                      : 'bg-liner-to-r from-red-50 to-rose-50 border-red-400'
                  }`}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`material-icons text-4xl ${
                        exam.status === 'ارتقا صنف' || exam.status === 'موفق'
                          ? 'text-green-600'
                          : exam.status === 'مشروط'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}>
                        {exam.status === 'ارتقا صنف' || exam.status === 'موفق'
                          ? 'check_circle'
                          : exam.status === 'مشروط'
                          ? 'warning'
                          : 'cancel'}
                      </span>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Result / نتیجه</p>
                        <p className={`font-black text-3xl ${
                          exam.status === 'ارتقا صنف' || exam.status === 'موفق'
                            ? 'text-green-700'
                            : exam.status === 'مشروط'
                            ? 'text-yellow-700'
                            : 'text-red-700'
                        }`}>
                          {exam.status}
                        </p>
                      </div>
                    </div>
                    {exam.message && (
                      <div className="bg-white/60 rounded-lg p-4 border-l-4 border-gray-400">
                        <p className="text-sm leading-relaxed text-gray-800 italic font-medium">
                          <span className="material-icons text-xs align-middle mr-2">format_quote</span>
                          {exam.message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Signatures Section */}
              <div className="mt-12 pt-8 border-t-4 border-gray-300">
                <div className="grid grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="h-20 mb-3 flex items-end justify-center text-sm text-gray-600">
                      {headerFields.supervisorName || '----------------'}
                    </div>
                    <div className="border-t-3 border-gray-800 pt-3">
                      <p className="text-base font-bold text-gray-900">نگران صنف</p>
                      <p className="text-sm text-gray-600 mt-1">Class Teacher</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="h-20 mb-3 flex items-end justify-center text-sm text-gray-600">
                      {headerFields.academicManagerName || '----------------'}
                    </div>
                    <div className="border-t-3 border-gray-800 pt-3">
                      <p className="text-base font-bold text-gray-900">مدیر تدریسی</p>
                      <p className="text-sm text-gray-600 mt-1">Academic Director</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="h-20 mb-3 flex items-end justify-center text-sm text-gray-600">
                      {headerFields.principalName || '----------------'}
                    </div>
                    <div className="border-t-3 border-gray-800 pt-3">
                      <p className="text-base font-bold text-gray-900">آمر مکتب</p>
                      <p className="text-sm text-gray-600 mt-1">Principal</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 text-center text-xs text-gray-500 border-t pt-4">
                <p>This is a computer-generated report card. Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Decorative Footer Border */}
            <div className="h-3 bg-liner-to-r from-purple-600 via-indigo-600 to-blue-600"></div>
          </div>
        </div>
      ) : (
        <div className="no-print flex flex-col items-center justify-center p-20 bg-white rounded-xl shadow-lg max-w-[210mm] mx-auto border-2 border-dashed border-gray-300">
          <span className="material-icons text-8xl text-gray-300 mb-4">description</span>
          <p className="text-gray-500 text-lg font-medium">Select a student to view report card</p>
        </div>
      )}
    </div>
  );
};

export default ReportCardSheet;

