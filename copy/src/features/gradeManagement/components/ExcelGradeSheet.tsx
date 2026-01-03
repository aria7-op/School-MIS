import React, { useState, useEffect } from 'react';
import type { GradeSheet, GradeEntry } from '../types/gradeManagement';
import gradeManagementService from '../services/gradeManagementService';
import { AFGHAN_SUBJECTS } from '../constants/afghanSubjects';

interface ExcelGradeSheetProps {
  classId: string;
  examType: 'MIDTERM' | 'FINAL';
  editable?: boolean;
  onDataChange?: () => void;
}

/**
 * Excel-like Grade Sheet - EXACT MATCH to "جدول نتایج" worksheet
 * Structure: SUBJECTS as ROWS, STUDENTS as COLUMNS (horizontal)
 * Each student gets 4 columns: Student Info + Midterm + Annual + Total
 */
const ExcelGradeSheet: React.FC<ExcelGradeSheetProps> = ({
  classId,
  examType,
  editable = false,
  onDataChange
}) => {
  const [midtermSheet, setMidtermSheet] = useState<GradeSheet | null>(null);
  const [annualSheet, setAnnualSheet] = useState<GradeSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedGrades, setEditedGrades] = useState<Map<string, GradeEntry>>(new Map());

  useEffect(() => {
    loadBothSheets();
  }, [classId]);

  const loadBothSheets = async () => {
    try {
      setLoading(true);
      const [midterm, annual] = await Promise.all([
        gradeManagementService.getExcelGradeSheetByType(classId, 'MIDTERM'),
        gradeManagementService.getExcelGradeSheetByType(classId, 'FINAL')
      ]);
      
      setMidtermSheet(midterm);
      setAnnualSheet(annual);
    } catch (error) {
      console.error('Error loading grade sheets:', error);
      alert('Failed to load grade sheets');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId: string, subjectId: string, marks: string, type: 'MIDTERM' | 'FINAL') => {
    const key = `${studentId}-${subjectId}-${type}`;
    const marksValue = parseFloat(marks) || 0;
    
    const newMap = new Map(editedGrades);
    newMap.set(key, {
      studentId,
      subjectId,
      marks: marksValue,
      isAbsent: false,
      examType: type
    } as any);
    
    setEditedGrades(newMap);
  };

  const handleSaveGrades = async () => {
    if (editedGrades.size === 0) {
      alert('No changes to save');
      return;
    }

    try {
      setSaving(true);
      
      const midtermGrades: GradeEntry[] = [];
      const annualGrades: GradeEntry[] = [];
      
      editedGrades.forEach((grade: any) => {
        if (grade.examType === 'MIDTERM') {
          midtermGrades.push(grade);
        } else {
          annualGrades.push(grade);
        }
      });
      
      const promises = [];
      if (midtermGrades.length > 0) {
        promises.push(gradeManagementService.bulkGradeEntryByType(classId, 'MIDTERM', { grades: midtermGrades }));
      }
      if (annualGrades.length > 0) {
        promises.push(gradeManagementService.bulkGradeEntryByType(classId, 'FINAL', { grades: annualGrades }));
      }
      
      await Promise.all(promises);
      
      alert('Grades saved successfully');
      setEditedGrades(new Map());
      loadBothSheets();
      onDataChange?.();
    } catch (error) {
      console.error('Error saving grades:', error);
      alert('Failed to save grades');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ارتقا صنف':
      case 'موفق':
        return 'text-green-600 bg-green-50';
      case 'مشروط':
      case 'تلاش بیشتر':
        return 'text-yellow-600 bg-yellow-50';
      case 'تکرار صنف':
      case 'محروم':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getMark = (studentId: string, subjectId: string, type: 'MIDTERM' | 'FINAL') => {
    const key = `${studentId}-${subjectId}-${type}`;
    const edited = editedGrades.get(key);
    if (edited) return edited.marks;

    const sheet = type === 'MIDTERM' ? midtermSheet : annualSheet;
    const student = sheet?.students.find(s => s.studentId === studentId);
    return student?.subjectMarks[subjectId]?.marks || 0;
  };

  const calculateSubjectTotal = (studentId: string, subjectId: string) => {
    const midMark = getMark(studentId, subjectId, 'MIDTERM');
    const annMark = getMark(studentId, subjectId, 'FINAL');
    // Excel formula: E21 = SUM(C21:D21)
    return midMark + annMark;
  };

  const calculateStudentTotal = (studentId: string) => {
    // Excel formula: Row 36 = SUM(C21:C35)
    let total = 0;
    midtermSheet?.subjects.forEach(subject => {
      total += calculateSubjectTotal(studentId, subject.code);
    });
    return total;
  };

  const calculateStudentAverage = (studentId: string) => {
    // Excel formula: Row 37 = AVERAGE(C21:C35)
    const subjectCount = midtermSheet?.subjects.length || 0;
    if (subjectCount === 0) return 0;
    return calculateStudentTotal(studentId) / (subjectCount * 2); // *2 because midterm + annual
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Excel-like grade sheet...</p>
        </div>
      </div>
    );
  }

  if (!midtermSheet || !annualSheet) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <span className="material-icons text-5xl text-red-500">error_outline</span>
          <p className="mt-4 text-red-600">Failed to load grade sheets</p>
        </div>
      </div>
    );
  }

  const students = midtermSheet.students;
  const subjects = AFGHAN_SUBJECTS.slice(0, 13); // 13 subjects from Excel

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Hide number spinners */}
      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* HEADER SECTION - Excel Exact Match */}
      <div className="border-2 border-black">
        {/* Row 1-7: Header with summary tables */}
        <div className="grid border-b-2 border-black" style={{ gridTemplateColumns: '400px 1fr 400px' }}>
          
          {/* LEFT: Quarterly Summary */}
          <div className="border-r-2 border-black p-4 bg-blue-50" dir="rtl">
            <h3 className="text-sm font-bold text-black text-center mb-3">خلص نتایج چهارونیم ماهه</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-right">
              <div className="text-black">تعداد داخله:</div><div className="font-bold">{midtermSheet.classStatistics.totalStudents}</div>
              <div className="text-black">شامل امتحان:</div><div className="font-bold">{midtermSheet.classStatistics.totalStudents}</div>
              <div className="text-black">موفق:</div><div className="font-bold text-green-700">{midtermSheet.classStatistics.successfulCount}</div>
              <div className="text-black">تلاش بیشتر:</div><div className="font-bold text-yellow-700">0</div>
              <div className="text-black">معذرتی:</div><div className="font-bold">0</div>
              <div className="text-black">غایب:</div><div className="font-bold text-red-700">0</div>
            </div>
          </div>

          {/* CENTER: Ministry Info */}
          <div className="p-4 text-center" dir="rtl">
            <div className="flex items-center justify-center gap-4 mb-2">
              <span className="material-icons text-6xl text-gray-500">account_balance</span>
            </div>
            <p className="text-base font-bold text-black">وزارت معارف</p>
            <p className="text-sm text-black">( ) ریاست معارف</p>
            <p className="text-sm text-black">( ) امریت معارف</p>
            <p className="text-sm text-black">( ) لیسه عالی</p>
            <p className="text-sm font-bold text-black mt-2">سال تعلیمی: 1404 هـ ش - 1447 هـ ق</p>
            <p className="text-sm text-black mt-1">صنف: {midtermSheet.classInfo.className}</p>
            <p dir="rtl" className="text-sm text-black text-center">نګران صنف: (       )</p>
          </div>

          {/* RIGHT: Annual Summary */}
          <div className="border-l-2 border-black p-4 bg-green-50" dir="rtl">
            <h3 className="text-sm font-bold text-black text-center mb-3">خلص نتایج سالانه</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-right">
              <div className="text-black">تعداد داخله:</div><div className="font-bold">{annualSheet.classStatistics.totalStudents}</div>
              <div className="text-black">شامل امتحان:</div><div className="font-bold">{annualSheet.classStatistics.totalStudents}</div>
              <div className="text-black">ارتقا صنف:</div><div className="font-bold text-green-700">{annualSheet.classStatistics.successfulCount}</div>
              <div className="text-black">تکرار صنف:</div><div className="font-bold text-red-700">{annualSheet.classStatistics.failedCount}</div>
              <div className="text-black">مشروط:</div><div className="font-bold text-yellow-700">{annualSheet.classStatistics.conditionalCount}</div>
              <div className="text-black">معذرتی:</div><div className="font-bold">0</div>
              <div className="text-black">محروم:</div><div className="font-bold text-red-700">0</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN TABLE - Subjects as ROWS, Students as COLUMNS (Horizontal) */}
      <div className="flex-1 overflow-auto">
        <table className="border-collapse" style={{ minWidth: '100%' }}>
          
          {/* COLUMN HEADERS - Student blocks */}
          <thead>
            {/* Row: Student Numbers */}
            <tr className="bg-gray-100 border-b-2 border-black">
              <th className="sticky left-0 bg-gray-800 text-white border-r-2 border-black p-2 z-20" style={{ width: '150px' }}>
                <div className="text-xs">امتحانات</div>
                <div className="text-xs">مضامین</div>
              </th>
              {students.map((student, index) => (
                <th key={student.studentId} colSpan={3} className="border-r-2 border-black p-1 text-center bg-gray-200">
                  <span className="text-sm font-bold text-black">{index + 1}</span>
                </th>
              ))}
            </tr>

            {/* Row: Student Info */}
            <tr className="bg-white border-b border-black">
              <th className="sticky left-0 bg-gray-200 border-r-2 border-black p-1 text-xs text-black text-right z-20">
                شماره
              </th>
              {students.map((student) => (
                <React.Fragment key={student.studentId}>
                  <td colSpan={3} className="border-r-2 border-black p-1 text-center bg-white">
                    <div className="text-[10px] text-black font-bold">{student.rowNumber}</div>
                  </td>
                </React.Fragment>
              ))}
            </tr>

            <tr className="bg-white border-b border-black">
              <th className="sticky left-0 bg-gray-200 border-r-2 border-black p-1 text-xs text-black text-right z-20">
                اسم
              </th>
              {students.map((student) => (
                <td key={student.studentId} colSpan={3} className="border-r-2 border-black p-1 text-center bg-white">
                  <div className="text-[10px] text-black font-medium truncate">{student.name}</div>
                </td>
              ))}
            </tr>

            <tr className="bg-white border-b border-black">
              <th className="sticky left-0 bg-gray-200 border-r-2 border-black p-1 text-xs text-black text-right z-20">
                نام پدر
              </th>
              {students.map((student) => (
                <td key={student.studentId} colSpan={3} className="border-r-2 border-black p-1 text-center bg-white">
                  <div className="text-[10px] text-black">{student.fatherName}</div>
                </td>
              ))}
            </tr>

            <tr className="bg-white border-b border-black">
              <th className="sticky left-0 bg-gray-200 border-r-2 border-black p-1 text-xs text-black text-right z-20">
                نام پدر کلان
              </th>
              {students.map((student) => (
                <td key={student.studentId} colSpan={3} className="border-r-2 border-black p-1 text-center bg-white">
                  <div className="text-[10px] text-black">-</div>
                </td>
              ))}
            </tr>

            <tr className="bg-white border-b border-black">
              <th className="sticky left-0 bg-gray-200 border-r-2 border-black p-1 text-xs text-black text-right z-20">
                نمبر اساس
              </th>
              {students.map((student) => (
                <td key={student.studentId} colSpan={3} className="border-r-2 border-black p-1 text-center bg-white">
                  <div className="text-[10px] text-black">{student.admissionNo}</div>
                </td>
              ))}
            </tr>

            <tr className="bg-white border-b-2 border-black">
              <th className="sticky left-0 bg-gray-200 border-r-2 border-black p-1 text-xs text-black text-right z-20">
                نمبر تذکره
              </th>
              {students.map((student) => (
                <td key={student.studentId} colSpan={3} className="border-r-2 border-black p-1 text-center bg-white">
                  <div className="text-[10px] text-black">{student.cardNo || '-'}</div>
                </td>
              ))}
            </tr>

            {/* Row: Exam Type Headers */}
            <tr className="bg-gray-100 border-b-2 border-black">
              <th className="sticky left-0 bg-gray-800 text-white border-r-2 border-black p-2 text-xs z-20">
                امتحانات / مضامین
              </th>
              {students.map((student) => (
                <React.Fragment key={student.studentId}>
                  <th className="border-r border-black p-1 text-center bg-blue-100 text-[10px] font-bold text-black">
                    چهارونیم ماهه
                  </th>
                  <th className="border-r border-black p-1 text-center bg-green-100 text-[10px] font-bold text-black">
                    سالانه
                  </th>
                  <th className="border-r-2 border-black p-1 text-center bg-indigo-100 text-[10px] font-bold text-black">
                    نتایج نهائی
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          {/* SUBJECT ROWS (15 subjects) */}
          <tbody>
            {subjects.map((subject, subjectIndex) => (
              <tr key={subject.code} className="border-b border-black">
                {/* Subject Name - Sticky Left */}
                <td className="sticky left-0 bg-yellow-50 border-r-2 border-black p-2 text-xs font-semibold text-black text-right z-10" style={{ width: '150px' }}>
                  {subject.name}
                </td>

                {/* Student Marks - 3 columns per student */}
                {students.map((student) => {
                  const midMark = getMark(student.studentId, subject.code, 'MIDTERM');
                  const annMark = getMark(student.studentId, subject.code, 'FINAL');
                  const total = midMark + annMark; // Excel: SUM(C21:D21)

                  return (
                    <React.Fragment key={student.studentId}>
                      {/* Midterm Column */}
                      <td className="border-r border-black p-0.5 text-center bg-blue-50" style={{ width: '60px' }}>
                        {editable ? (
                          <input
                            type="number"
                            className="w-full h-6 px-1 text-xs text-center border border-blue-400 rounded focus:border-blue-600 focus:ring-1"
                            value={midMark || ''}
                            onChange={(e) => handleMarkChange(student.studentId, subject.code, e.target.value, 'MIDTERM')}
                            placeholder="0"
                          />
                        ) : (
                          <span className="text-xs text-black">{midMark || '-'}</span>
                        )}
                      </td>

                      {/* Annual Column */}
                      <td className="border-r border-black p-0.5 text-center bg-green-50" style={{ width: '60px' }}>
                        {editable ? (
                          <input
                            type="number"
                            className="w-full h-6 px-1 text-xs text-center border border-green-400 rounded focus:border-green-600 focus:ring-1"
                            value={annMark || ''}
                            onChange={(e) => handleMarkChange(student.studentId, subject.code, e.target.value, 'FINAL')}
                            placeholder="0"
                          />
                        ) : (
                          <span className="text-xs text-black">{annMark || '-'}</span>
                        )}
                      </td>

                      {/* Total Column - AUTO CALCULATED */}
                      <td className="border-r-2 border-black p-0.5 text-center bg-indigo-100" style={{ width: '60px' }}>
                        <span className="text-xs font-bold text-indigo-700">{total > 0 ? total.toFixed(0) : '-'}</span>
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            ))}

            {/* SUMMARY ROW: مجموعه نمرات (Total Marks) - Row 36 */}
            <tr className="bg-yellow-100 border-b border-black">
              <td className="sticky left-0 bg-yellow-200 border-r-2 border-black p-2 text-xs font-bold text-black text-right z-10">
                مجموعه نمرات (Total Marks)
              </td>
              {students.map((student) => {
                // Excel: C36 = SUM(C21:C35)
                let midTotal = 0, annTotal = 0;
                subjects.forEach(subject => {
                  midTotal += getMark(student.studentId, subject.code, 'MIDTERM');
                  annTotal += getMark(student.studentId, subject.code, 'FINAL');
                });
                const grandTotal = midTotal + annTotal;

                return (
                  <React.Fragment key={student.studentId}>
                    <td className="border-r border-black p-1 text-center bg-blue-100">
                      <span className="text-xs font-bold text-blue-700">{midTotal.toFixed(0)}</span>
                    </td>
                    <td className="border-r border-black p-1 text-center bg-green-100">
                      <span className="text-xs font-bold text-green-700">{annTotal.toFixed(0)}</span>
                    </td>
                    <td className="border-r-2 border-black p-1 text-center bg-indigo-200">
                      <span className="text-xs font-bold text-indigo-800">{grandTotal.toFixed(0)}</span>
                    </td>
                  </React.Fragment>
                );
              })}
            </tr>

            {/* SUMMARY ROW: اوسط نمرات (Average Marks) - Row 37 */}
            <tr className="bg-yellow-100 border-b border-black">
              <td className="sticky left-0 bg-yellow-200 border-r-2 border-black p-2 text-xs font-bold text-black text-right z-10">
                اوسط نمرات (Average Marks)
              </td>
              {students.map((student) => {
                // Excel: C37 = AVERAGE(C21:C35)
                const midAvg = subjects.length > 0 
                  ? subjects.reduce((sum, subj) => sum + getMark(student.studentId, subj.code, 'MIDTERM'), 0) / subjects.length
                  : 0;
                const annAvg = subjects.length > 0
                  ? subjects.reduce((sum, subj) => sum + getMark(student.studentId, subj.code, 'FINAL'), 0) / subjects.length
                  : 0;
                const overallAvg = (midAvg + annAvg) / 2;

                return (
                  <React.Fragment key={student.studentId}>
                    <td className="border-r border-black p-1 text-center bg-blue-100">
                      <span className="text-xs font-bold text-blue-700">{midAvg.toFixed(2)}</span>
                    </td>
                    <td className="border-r border-black p-1 text-center bg-green-100">
                      <span className="text-xs font-bold text-green-700">{annAvg.toFixed(2)}</span>
                    </td>
                    <td className="border-r-2 border-black p-1 text-center bg-indigo-200">
                      <span className="text-xs font-bold text-indigo-800">{overallAvg.toFixed(2)}</span>
                    </td>
                  </React.Fragment>
                );
              })}
            </tr>

            {/* SUMMARY ROW: نتیجه (Result Status) - Row 38 */}
            <tr className="bg-white border-b-2 border-black">
              <td className="sticky left-0 bg-gray-200 border-r-2 border-black p-2 text-xs font-bold text-black text-right z-10">
                نتیجه (Result)
              </td>
              {students.map((student) => {
                const midStudent = midtermSheet.students.find(s => s.studentId === student.studentId);
                const annStudent = annualSheet.students.find(s => s.studentId === student.studentId);

                return (
                  <React.Fragment key={student.studentId}>
                    <td className={`border-r border-black p-1 text-center ${getStatusColor(midStudent?.status || '')}`}>
                      <span className="text-[10px] font-bold">{midStudent?.status || '-'}</span>
                    </td>
                    <td className={`border-r border-black p-1 text-center ${getStatusColor(annStudent?.status || '')}`}>
                      <span className="text-[10px] font-bold">{annStudent?.status || '-'}</span>
                    </td>
                    <td className={`border-r-2 border-black p-1 text-center ${getStatusColor(annStudent?.status || '')}`}>
                      <span className="text-[10px] font-bold">{annStudent?.status || '-'}</span>
                    </td>
                  </React.Fragment>
                );
              })}
            </tr>

            {/* SUMMARY ROW: درجه (Grade Letter) - Row 39 */}
            <tr className="bg-white border-b-2 border-black">
              <td className="sticky left-0 bg-gray-200 border-r-2 border-black p-2 text-xs font-bold text-black text-right z-10">
                درجه (Grade)
              </td>
              {students.map((student) => {
                const midAvg = subjects.length > 0 
                  ? subjects.reduce((sum, subj) => sum + getMark(student.studentId, subj.code, 'MIDTERM'), 0) / subjects.length
                  : 0;
                const annAvg = subjects.length > 0
                  ? subjects.reduce((sum, subj) => sum + getMark(student.studentId, subj.code, 'FINAL'), 0) / subjects.length
                  : 0;

                // Excel grade formula
                const getGrade = (avg: number) => {
                  if (avg >= 90) return 'الف (A)';
                  if (avg >= 75) return 'ب (B)';
                  if (avg >= 60) return 'ج (C)';
                  if (avg >= 50) return 'د (D)';
                  return 'هـ (F)';
                };

                return (
                  <React.Fragment key={student.studentId}>
                    <td className="border-r border-black p-1 text-center bg-blue-50">
                      <span className="text-[10px] font-semibold text-black">{getGrade(midAvg)}</span>
                    </td>
                    <td className="border-r border-black p-1 text-center bg-green-50">
                      <span className="text-[10px] font-semibold text-black">{getGrade(annAvg)}</span>
                    </td>
                    <td className="border-r-2 border-black p-1 text-center bg-indigo-50">
                      <span className="text-[10px] font-semibold text-black">{getGrade((midAvg + annAvg) / 2)}</span>
                    </td>
                  </React.Fragment>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Action Bar */}
      {editable && (
        <div className="bg-white border-t-2 border-gray-300 p-4 flex justify-end gap-4">
          <button
            onClick={() => {
              setEditedGrades(new Map());
              loadBothSheets();
            }}
            disabled={saving || editedGrades.size === 0}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span className="material-icons text-sm">cancel</span>
            Cancel
          </button>

          <button
            onClick={handleSaveGrades}
            disabled={saving || editedGrades.size === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <span className="material-icons text-sm">save</span>
                Save ({editedGrades.size} changes)
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ExcelGradeSheet;
