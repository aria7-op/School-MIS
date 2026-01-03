import React, { useState, useEffect } from "react";
import gradeManagementService from "../services/gradeManagementService";
import { AFGHAN_SUBJECTS } from "../constants/afghanSubjects";
import {
  HEADER_FIELD_DEFAULTS,
  useStudentListHeader,
} from "../context/StudentListHeaderContext";

/**
 * Student List Sheet - EXACT MATCH to Excel "لیست" worksheet
 * Based on Python analysis of actual Excel file structure
 */
interface StudentListSheetProps {
  classId: string;
  examType: "MIDTERM" | "FINAL";
  editable?: boolean;
  onDataChange?: () => void;
}

const StudentListSheet: React.FC<StudentListSheetProps> = ({
  classId,
  examType,
  editable,
}) => {
  const { headerData, refresh: refreshHeader } = useStudentListHeader();
  const [students, setStudents] = useState<any[]>([]);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceThreshold, setAttendanceThreshold] = useState(99);
  const [headerFields, setHeaderFields] = useState({ ...HEADER_FIELD_DEFAULTS });
  const [savingHeader, setSavingHeader] = useState(false);

  useEffect(() => {
    loadData();
  }, [classId, examType]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, gradeData] = await Promise.all([
        gradeManagementService.getClassStudents(classId),
        gradeManagementService.getExcelGradeSheetByType(classId, examType),
      ]);
      setStudents(studentsData || []);
      setClassInfo(gradeData?.classInfo);
      if (!headerData) {
        setAttendanceThreshold(
          gradeData?.examInfo?.attendanceThreshold ?? 99
        );
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (headerData) {
      setHeaderFields({
        ...HEADER_FIELD_DEFAULTS,
        ...(headerData.fields || {}),
      });
      setAttendanceThreshold(headerData.attendanceThreshold ?? 99);
    }
  }, [headerData]);

  const handleHeaderFieldChange = (field: keyof typeof HEADER_DEFAULTS, value: string) => {
    setHeaderFields((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAttendanceThresholdChange = (value: string) => {
    const parsed = parseInt(value, 10);
    setAttendanceThreshold(Number.isNaN(parsed) ? 0 : parsed);
  };

  const handleSaveHeader = async () => {
    if (!editable) return;
    try {
      setSavingHeader(true);
      await gradeManagementService.saveStudentListHeader(classId, examType, {
        fields: headerFields,
        attendanceThreshold,
      });
      alert('Student list information saved successfully');
      await refreshHeader();
      onDataChange?.();
    } catch (error) {
      console.error('Error saving student list header:', error);
      alert('Failed to save student list information');
    } finally {
      setSavingHeader(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Excel column width to pixels: 1 char ≈ 8px
  const colWidths = {
    A: 41, // 5.11 chars
    B: 101, // 12.66 chars
    C: 104, // 13 chars
    D: 104, // 13 chars
    E: 104, // 13 chars
    F: 125, // 15.66 chars
    G: 69, // 8.66 chars
    H: 55, // 6.89 chars
    I: 104, // 13 chars
    J: 13, // 1.66 chars - RED SEPARATOR
    K: 37, // 4.66 chars
    subject: 104, // 13 chars each - subjects L to W
  };
  // Keep header and data tables locked to the same pixel width to avoid drift
  const totalTableWidth =
    colWidths.A +
    colWidths.B +
    colWidths.C +
    colWidths.D +
    colWidths.E +
    colWidths.F +
    colWidths.G +
    colWidths.H +
    colWidths.I +
    colWidths.J +
    colWidths.K +
    // 13 subjects (L–W)
    13 * colWidths.subject +
    // 2 spacer columns (X, Y)
    2 * colWidths.subject +
    // 5 attendance columns (Z–AD)
    5 * colWidths.subject;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow-md">
  {/* First Section - 4 Inputs */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 w-full gap-4 mb-6">
    <div className="w-full flex flex-col gap-2">
      <label className="text-right font-semibold text-gray-700 text-sm">
        اسم و تخلص آمر مکتب
      </label>
      <input
        type="text"
        className="border-2 border-gray-300 rounded-lg h-12 w-full px-4 text-right 
                   focus:border-amber-500 focus:ring-2 focus:ring-amber-200 
                   transition-all duration-200 outline-none bg-white
                   hover:border-amber-400"
        placeholder="نام را وارد کنید"
        value={headerFields.principalName}
        onChange={(e) => handleHeaderFieldChange('principalName', e.target.value)}
        disabled={!editable}
      />
    </div>

    <div className="w-full flex flex-col gap-2">
      <label className="text-right font-semibold text-gray-700 text-sm">
        اسم و تخلص مدیر تدریسی
      </label>
      <input
        type="text"
        className="border-2 border-gray-300 rounded-lg h-12 w-full px-4 text-right 
                   focus:border-amber-500 focus:ring-2 focus:ring-amber-200 
                   transition-all duration-200 outline-none bg-white
                   hover:border-amber-400"
        placeholder="نام را وارد کنید"
        value={headerFields.academicManagerName}
        onChange={(e) => handleHeaderFieldChange('academicManagerName', e.target.value)}
        disabled={!editable}
      />
    </div>

    <div className="w-full flex flex-col gap-2">
      <label className="text-right font-semibold text-gray-700 text-sm">
        اسم و تخلص سرمعلم مربوطه
      </label>
      <input
        type="text"
        className="border-2 border-gray-300 rounded-lg h-12 w-full px-4 text-right 
                   focus:border-amber-500 focus:ring-2 focus:ring-amber-200 
                   transition-all duration-200 outline-none bg-white
                   hover:border-amber-400"
        placeholder="نام را وارد کنید"
        value={headerFields.headTeacherName}
        onChange={(e) => handleHeaderFieldChange('headTeacherName', e.target.value)}
        disabled={!editable}
      />
    </div>

    <div className="w-full flex flex-col gap-2">
      <label className="text-right font-semibold text-gray-700 text-sm">
        اسم و تخلص نگران مربوطه
      </label>
      <input
        type="text"
        className="border-2 border-gray-300 rounded-lg h-12 w-full px-4 text-right 
                   focus:border-amber-500 focus:ring-2 focus:ring-amber-200 
                   transition-all duration-200 outline-none bg-white
                   hover:border-amber-400"
        placeholder="نام را وارد کنید"
        value={headerFields.supervisorName}
        onChange={(e) => handleHeaderFieldChange('supervisorName', e.target.value)}
        disabled={!editable}
      />
    </div>
  </div>

  {/* Divider */}
  <div className="border-t-2 border-amber-200 my-6"></div>

  {/* Second Section - 3 Inputs */}
  <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-4">
    <div className="w-full flex flex-col gap-2">
      <label className="text-right font-semibold text-gray-700 text-sm">
        هیت اول
      </label>
      <input
        type="text"
        className="border-2 border-gray-300 rounded-lg h-12 w-full px-4 text-right 
                   focus:border-amber-500 focus:ring-2 focus:ring-amber-200 
                   transition-all duration-200 outline-none bg-white
                   hover:border-amber-400"
        placeholder="نام را وارد کنید"
        value={headerFields.committeeFirst}
        onChange={(e) => handleHeaderFieldChange('committeeFirst', e.target.value)}
        disabled={!editable}
      />
    </div>

    <div className="w-full flex flex-col gap-2">
      <label className="text-right font-semibold text-gray-700 text-sm">
        هیت دوم
      </label>
      <input
        type="text"
        className="border-2 border-gray-300 rounded-lg h-12 w-full px-4 text-right 
                   focus:border-amber-500 focus:ring-2 focus:ring-amber-200 
                   transition-all duration-200 outline-none bg-white
                   hover:border-amber-400"
        placeholder="نام را وارد کنید"
        value={headerFields.committeeSecond}
        onChange={(e) => handleHeaderFieldChange('committeeSecond', e.target.value)}
        disabled={!editable}
      />
    </div>

    <div className="w-full flex flex-col gap-2">
      <label className="text-right font-semibold text-gray-700 text-sm">
        هیت سوم
      </label>
      <input
        type="text"
        className="border-2 border-gray-300 rounded-lg h-12 w-full px-4 text-right 
                   focus:border-amber-500 focus:ring-2 focus:ring-amber-200 
                   transition-all duration-200 outline-none bg-white
                   hover:border-amber-400"
        placeholder="نام را وارد کنید"
        value={headerFields.committeeThird}
        onChange={(e) => handleHeaderFieldChange('committeeThird', e.target.value)}
        disabled={!editable}
      />
    </div>
  </div>
</div>

      {/* teacher information */}
      
      {/* Hide number spinners globally */}
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

      {/* EXCEL EXACT HEADER - Rows 1-3 */}
      <div className="flex-1 overflow-auto">
      <div className="border-2 border-black">
        {/* ROW 1 */}
        <table
          className="border-collapse table-fixed"
          dir="rtl"
          style={{ width: `${totalTableWidth}px` }}
        >
          <colgroup>
            <col style={{ width: `${colWidths.A}px` }} />
            <col style={{ width: `${colWidths.B}px` }} />
            <col style={{ width: `${colWidths.C}px` }} />
            <col style={{ width: `${colWidths.D}px` }} />
            <col style={{ width: `${colWidths.E}px` }} />
            <col style={{ width: `${colWidths.F}px` }} />
            <col style={{ width: `${colWidths.G}px` }} />
            <col style={{ width: `${colWidths.H}px` }} />
            <col style={{ width: `${colWidths.I}px` }} />
            <col style={{ width: `${colWidths.J}px` }} />
            <col style={{ width: `${colWidths.K}px` }} />
            {/* L to W: 13 subject columns */}
            {Array.from({ length: 13 }).map((_, i) => (
              // key is safe here because this is a static colgroup render
              // eslint-disable-next-line react/no-array-index-key
              <col key={`subj-col-${i}`} style={{ width: `${colWidths.subject}px` }} />
            ))}
            {/* X, Y empty spacer columns - keep same width as subject for alignment */}
            <col style={{ width: `${colWidths.subject}px` }} />
            <col style={{ width: `${colWidths.subject}px` }} />
            {/* Z to AD: 5 attendance columns */}
            {Array.from({ length: 5 }).map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <col key={`att-col-${i}`} style={{ width: `${colWidths.subject}px` }} />
            ))}
          </colgroup>
          <tbody>
            <tr className="border-b-2 border-black">
              {/* A1:C1 - Yellow */}
              <td
                colSpan={6}
                className="bg-yellow-300 border-r-2 border-black p-2 text-center"
                style={{
                  width: `${colWidths.A + colWidths.B + colWidths.C}px`,
                }}
              >
                <span className="text-sm font-semibold text-black">
                  رهنمود کاربرد جدول
                </span>
              </td>

              {/* D1 */}
              <td
                className="bg-white border-r border-black p-2 text-sm text-black"
                style={{ width: `${colWidths.D}px` }}
              >
                سال تعلیمی:
              </td>

              {/* E1 */}
              <td
                className="bg-white border-r border-black p-2 text-center text-sm font-bold text-black"
                style={{ width: `${colWidths.E}px` }}
              >
                1404
              </td>

              {/* F1:G1 */}
              <td
                colSpan={2}
                className="bg-white border-r border-black p-2 text-center text-sm text-black"
                style={{ width: `${colWidths.F + colWidths.G}px` }}
              >
                هجري شمسي
              </td>

              {/* H1:K1 */}
              <td
                colSpan={4}
                className="bg-white border-r border-black p-2 text-center text-sm font-bold text-black"
                style={{
                  width: `${
                    colWidths.H + colWidths.I + colWidths.J + colWidths.K
                  }px`,
                }}
              >
                1447
              </td>

              {/* L1:M1 */}
              <td
                colSpan={2}
                className="bg-white border-r border-black p-2 text-center text-sm text-black"
              >
                هجري قمري
              </td>

              {/* Rest of row 1 */}
              <td colSpan={10} className="bg-white p-2 text-sm text-black" dir="rtl">
                صنف: {classInfo?.className || "(       )"}{" "}
                {classInfo?.classCode ? `(${classInfo.classCode})` : ""} | نگران صنف:{" "}
                {headerFields?.supervisorName?.trim()
                  ? headerFields.supervisorName
                  : "( )"}{" "}
                | مکتب: {classInfo?.schoolName || classInfo?.school || "لیسه عالی"}
              </td>
            </tr>

            {/* ROW 2 */}
            <tr className="border-b-2 border-black">
              {/* A2:C2 - YouTube */}
              <td
                colSpan={3}
                className="bg-white border-r-2 border-black p-2"
                style={{
                  width: `${colWidths.A + colWidths.B + colWidths.C}px`,
                }}
              >
                <a
                  href="https://youtu.be/7CpctKp4Fx8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-xs underline"
                >
                  لینک ویدیو اموزشی
                </a>
              </td>

              {/* D2:E2 - Yellow */}
              <td
                colSpan={2}
                className="bg-yellow-300 border-r border-black p-2 text-sm font-semibold text-black text-center"
              >
                ایام محرومی صنف مربوطه:
              </td>

              {/* F2 - Yellow - BIG 99 */}
              <td
                className="bg-yellow-300 border-r-2 border-black p-2 text-center"
                style={{ width: `${colWidths.F}px` }}
              >
                <input
                  type="number"
                  value={attendanceThreshold}
                  className="w-full text-3xl font-bold text-black text-center bg-yellow-300 border-none"
                  disabled={!editable}
                  onChange={(e) => handleAttendanceThresholdChange(e.target.value)}
                />
              </td>

              {/* G2:G3 - Light Yellow - rowspan */}
              <td
                rowSpan={2}
                className="bg-yellow-100 border-r border-black p-2 text-center align-top"
                style={{ width: `${colWidths.G}px` }}
              >
                <div className="text-xs font-semibold text-black">
                  وضعیت شاگردان
                </div>
              </td>

              {/* H2:I2 - Yellow */}
              <td
                colSpan={2}
                className="bg-yellow-300 border-r border-black p-2 text-center text-sm font-semibold text-black"
              >
                معذرتی
              </td>

              {/* J2 - RED SEPARATOR */}
              <td
                className="bg-red-600 border-r-2 border-black"
                style={{ width: `${colWidths.J}px` }}
              ></td>

              {/* K2:AD2 - Midterm section header */}
              <td
                colSpan={20}
                className="bg-blue-200 border-r-2 border-black p-3 text-center"
              >
                <span className="text-sm font-bold text-black">
                  بخش ثبت نمرات و ضوابط امتحان چهارونیم ماهه
                </span>
              </td>

              {/* AF2:AY2 - Annual section header */}
              <td colSpan={10} className="bg-green-200 p-3 text-center">
                <span className="text-sm font-bold text-black">
                  بخش ثبت نمرات و ضوابط امتحان سالانه
                </span>
              </td>
            </tr>

            {/* ROW 3 - Column Headers */}
            <tr className="border-b-2 border-black">
              {/* A3 */}
              <td
                className="bg-gray-200 border-r border-black p-2 text-center text-xs font-bold text-black"
                style={{ width: `${colWidths.A}px` }}
                dir="rtl"
              >
                شماره
              </td>

              {/* B3-F3 - Green Student Info */}
              <td
                className="border-r border-black p-2 text-center text-xs font-bold text-black"
                style={{
                  width: `${colWidths.B}px`,
                  backgroundColor: "#92D050",
                }}
                dir="rtl"
              >
                اسم
              </td>
              <td
                className="border-r border-black p-2 text-center text-xs font-bold text-black"
                style={{
                  width: `${colWidths.C}px`,
                  backgroundColor: "#92D050",
                }}
                dir="rtl"
              >
                ولد
              </td>
              <td
                className="border-r border-black p-2 text-center text-xs font-bold text-black"
                style={{
                  width: `${colWidths.D}px`,
                  backgroundColor: "#92D050",
                }}
                dir="rtl"
              >
                ولدیت
              </td>
              <td
                className="border-r border-black p-2 text-center text-xs font-bold text-black"
                style={{
                  width: `${colWidths.E}px`,
                  backgroundColor: "#92D050",
                }}
                dir="rtl"
              >
                نمبر اساس
              </td>
              <td
                className="border-r-2 border-black p-2 text-center text-xs font-bold text-black"
                style={{
                  width: `${colWidths.F}px`,
                  backgroundColor: "#92D050",
                }}
                dir="rtl"
              >
                نمبر تذکره
              </td>

              {/* G3 - merged with G2 above */}

              {/* H3 */}
              <td
                className="bg-gray-200 border-r border-black p-1 text-center text-[10px] font-semibold text-black"
                style={{ width: `${colWidths.H}px` }}
                dir="rtl"
              >
                چهارونیم ماهه
              </td>

              {/* I3 */}
              <td
                className="bg-gray-200 border-r border-black p-1 text-center text-[10px] font-semibold text-black"
                style={{ width: `${colWidths.I}px` }}
                dir="rtl"
              >
                سالانه
              </td>

              {/* J3 - RED SEPARATOR */}
              <td
                className="bg-red-600 border-r-2 border-black"
                style={{ width: `${colWidths.J}px` }}
              ></td>

              {/* K3 - empty */}
              <td
                className="bg-gray-200 border-r border-black"
                style={{ width: `${colWidths.K}px` }}
              ></td>

              {/* L3-W3 - Subject Headers (13 subjects) */}
              <td
                className="bg-gray-200 border-r border-black p-1 text-center text-[10px] font-semibold text-black"
                style={{ width: `${colWidths.subject}px` }}
                dir="rtl"
              >
                قرانکریم
              </td>
              <td
                className="bg-gray-200 border-r border-black p-1 text-center text-[10px] font-semibold text-black"
                style={{ width: `${colWidths.subject}px` }}
                dir="rtl"
              >
                دنیات
              </td>
              <td
                className="bg-gray-200 border-r border-black p-1 text-center text-[10px] font-semibold text-black"
                style={{ width: `${colWidths.subject}px` }}
                dir="rtl"
              >
                دری
              </td>
              <td
                className="bg-gray-200 border-r border-black p-1 text-center text-[10px] font-semibold text-black"
                style={{ width: `${colWidths.subject}px` }}
                dir="rtl"
              >
                پشتو
              </td>
              <td
                className="bg-gray-200 border-r border-black p-1 text-center text-[10px] font-semibold text-black"
                style={{ width: `${colWidths.subject}px` }}
                dir="rtl"
              >
                لسان سوم
              </td>
              <td
                className="bg-gray-200 border-r border-black p-1 text-center text-[10px] font-semibold text-black"
                style={{ width: `${colWidths.subject}px` }}
                dir="rtl"
              >
                انګلیسی
              </td>
              <td
                className="bg-gray-200 border-r border-black p-1 text-center text-[10px] font-semibold text-black"
                style={{ width: `${colWidths.subject}px` }}
                dir="rtl"
              >
                ریاضی
              </td>
              <td
                className="bg-gray-200 border-r border-black p-1 text-center text-[10px] font-semibold text-black"
                style={{ width: `${colWidths.subject}px` }}
                dir="rtl"
              >
                ساینس
              </td>
              <td
                className="bg-gray-200 border-r border-black p-1 text-center text-[10px] font-semibold text-black"
                style={{ width: `${colWidths.subject}px` }}
                dir="rtl"
              >
                اجتماعیات
              </td>
              <td
                className="bg-gray-200 border-r border-black p-1 text-center text-[10px] font-semibold text-black"
                style={{ width: `${colWidths.subject}px` }}
                dir="rtl"
              >
                خط/ رسم
              </td>
              <td
                className="bg-gray-200 border-r border-black p-1 text-center text-[10px] font-semibold text-black"
                style={{ width: `${colWidths.subject}px` }}
                dir="rtl"
              >
                مهارت زندگی
              </td>
              <td
                className="bg-gray-200 border-r border-black p-1 text-center text-[10px] font-semibold text-black"
                style={{ width: `${colWidths.subject}px` }}
                dir="rtl"
              >
                تربیت بدنی
              </td>
              <td
                className="bg-gray-200 border-r-2 border-black p-1 text-center text-[10px] font-semibold text-black"
                style={{ width: `${colWidths.subject}px` }}
                dir="rtl"
              >
                تهذیب
              </td>

              {/* X3, Y3 - empty */}
              <td
                colSpan={2}
                className="bg-gray-200 border-r border-black"
              ></td>

              {/* Z3-AD3 - Attendance Headers */}
              <td
                className="bg-gray-200 border-r border-black p-1 text-center text-[10px] font-semibold text-black"
                style={{ width: `${colWidths.subject}px` }}
                dir="rtl"
              >
                ایام سال تعلیمی
              </td>
              <td
                className="bg-gray-200 border-r border-black p-1 text-center text-[10px] font-semibold text-black"
                style={{ width: `${colWidths.subject}px` }}
                dir="rtl"
              >
                حاضر
              </td>
              <td
                className="bg-gray-200 border-r border-black p-1 text-center text-[10px] font-semibold text-black"
                style={{ width: `${colWidths.subject}px` }}
                dir="rtl"
              >
                غیرحاضر
              </td>
              <td
                className="bg-gray-200 border-r border-black p-1 text-center text-[10px] font-semibold text-black"
                style={{ width: `${colWidths.subject}px` }}
                dir="rtl"
              >
                مریض
              </td>
              <td
                className="bg-gray-200 border-r border-black p-1 text-center text-[10px] font-semibold text-black"
                style={{ width: `${colWidths.subject}px` }}
                dir="rtl"
              >
                رخصت
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ORANGE DATA GRID - Starts from Row 5 */}
      <div>
        <table
          className="border-collapse table-fixed"
          dir="rtl"
          style={{ width: `${totalTableWidth}px` }}
        >
          <colgroup>
            <col style={{ width: `${colWidths.A}px` }} />
            <col style={{ width: `${colWidths.B}px` }} />
            <col style={{ width: `${colWidths.C}px` }} />
            <col style={{ width: `${colWidths.D}px` }} />
            <col style={{ width: `${colWidths.E}px` }} />
            <col style={{ width: `${colWidths.F}px` }} />
            <col style={{ width: `${colWidths.G}px` }} />
            <col style={{ width: `${colWidths.H}px` }} />
            <col style={{ width: `${colWidths.I}px` }} />
            <col style={{ width: `${colWidths.J}px` }} />
            <col style={{ width: `${colWidths.K}px` }} />
            {Array.from({ length: 13 }).map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <col key={`subj2-col-${i}`} style={{ width: `${colWidths.subject}px` }} />
            ))}
            <col style={{ width: `${colWidths.subject}px` }} />
            <col style={{ width: `${colWidths.subject}px` }} />
            {Array.from({ length: 5 }).map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <col key={`att2-col-${i}`} style={{ width: `${colWidths.subject}px` }} />
            ))}
          </colgroup>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td
                  colSpan={40}
                  className="p-12 text-center"
                  style={{ backgroundColor: "#FFC000" }}
                >
                  <span className="text-gray-600">
                    No students in this class yet
                  </span>
                </td>
              </tr>
            ) : (
              students.map((student, index) => (
                <tr
                  key={student.id}
                  className="border-b border-black"
                  style={{ height: "28px" }}
                >
                  {/* A - Row Number */}
                  <td
                    className="border-r border-black p-1 text-center text-sm font-bold text-black"
                    style={{
                      width: `${colWidths.A}px`,
                      backgroundColor: "#FFC000",
                    }}
                  >
                    {index + 1}
                  </td>

                  {/* B - Name */}
                  <td
                    className="border-r border-black p-1 text-sm text-black"
                    style={{
                      width: `${colWidths.B}px`,
                      backgroundColor: "#FFC000",
                    }}
                    dir="rtl"
                  >
                    {student.user?.dariName || 
                     `${student.user?.firstName || ""} ${student.user?.lastName || ""}`.trim()}
                  </td>

                  {/* C - Father (Yellow in data rows) */}
                  <td
                    className="border-r border-black p-1 text-sm text-black"
                    style={{
                      width: `${colWidths.C}px`,
                      backgroundColor: "#FFFF00",
                    }}
                    dir="rtl"
                  >
                    {student.parent?.user?.dariName || 
                     student.user?.fatherName || 
                     `${student.parent?.user?.firstName || ""} ${student.parent?.user?.lastName || ""}`.trim() || ""}
                  </td>

                  {/* D - Birth (Yellow in data rows) */}
                  <td
                    className="border-r border-black p-1 text-center text-sm text-black"
                    style={{
                      width: `${colWidths.D}px`,
                      backgroundColor: "#FFFF00",
                    }}
                  >
                    -
                  </td>

                  {/* E - Admission (Yellow in data rows) */}
                  <td
                    className="border-r border-black p-1 text-center text-xs text-black"
                    style={{
                      width: `${colWidths.E}px`,
                      backgroundColor: "#FFFF00",
                    }}
                  >
                    {student.admissionNo}
                  </td>

                  {/* F - ID Card (Yellow in data rows) */}
                  <td
                    className="border-r-2 border-black p-1 text-center text-xs text-black"
                    style={{
                      width: `${colWidths.F}px`,
                      backgroundColor: "#FFFF00",
                    }}
                  >
                    {student.cardNo || ""}
                  </td>

                  {/* G - Empty */}
                  <td
                    className="border-r border-black"
                    style={{
                      width: `${colWidths.G}px`,
                      backgroundColor: "#FFC000",
                    }}
                  ></td>

                  {/* H - Midterm/Annual toggle */}
                  <td
                    className="border-r border-black"
                    style={{
                      width: `${colWidths.H}px`,
                      backgroundColor: "#FFC000",
                    }}
                  ></td>

                  {/* I - Empty */}
                  <td
                    className="border-r border-black"
                    style={{
                      width: `${colWidths.I}px`,
                      backgroundColor: "#FFC000",
                    }}
                  ></td>

                  {/* J - RED SEPARATOR */}
                  <td
                    className="bg-red-600 border-r-2 border-black"
                    style={{ width: `${colWidths.J}px` }}
                  ></td>

                  {/* K - Empty */}
                  <td
                    className="border-r border-black"
                    style={{
                      width: `${colWidths.K}px`,
                      backgroundColor: "#FFC000",
                    }}
                  ></td>

                  {/* L-W - Subject grade inputs (13 subjects) */}
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((idx) => (
                    <td
                      key={`subj-${idx}`}
                      className={`border-r border-black p-0.5 text-center ${
                        idx === 12 ? "border-r-2" : ""
                      }`}
                      style={{
                        width: `${colWidths.subject}px`,
                        backgroundColor: "#FFC000",
                      }}
                    >
                      {editable ? (
                        <input
                          type="number"
                          className="w-full h-6 px-1 text-center border border-gray-400 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                          placeholder="0"
                          min="0"
                          max="100"
                        />
                      ) : (
                        <span className="text-sm">-</span>
                      )}
                    </td>
                  ))}

                  {/* X, Y - Empty */}
                  <td
                    colSpan={2}
                    className="border-r border-black"
                    style={{ backgroundColor: "#FFC000" }}
                  ></td>

                  {/* Z-AD - Attendance columns (5 columns) */}
                  <td
                    className="border-r border-black p-0.5 text-center"
                    style={{
                      width: `${colWidths.subject}px`,
                      backgroundColor: "#FFC000",
                    }}
                  >
                    <input
                      type="number"
                      className="w-full h-6 px-1 text-center border border-gray-400 text-sm bg-white"
                      placeholder="0"
                      disabled={!editable}
                    />
                  </td>
                  <td
                    className="border-r border-black p-0.5 text-center"
                    style={{
                      width: `${colWidths.subject}px`,
                      backgroundColor: "#FFC000",
                    }}
                  >
                    <input
                      type="number"
                      className="w-full h-6 px-1 text-center border border-gray-400 text-sm bg-green-50"
                      placeholder="0"
                      disabled={!editable}
                    />
                  </td>
                  <td
                    className="border-r border-black p-0.5 text-center"
                    style={{
                      width: `${colWidths.subject}px`,
                      backgroundColor: "#FFC000",
                    }}
                  >
                    <input
                      type="number"
                      className="w-full h-6 px-1 text-center border border-gray-400 text-sm bg-red-50"
                      placeholder="0"
                      disabled={!editable}
                    />
                  </td>
                  <td
                    className="border-r border-black p-0.5 text-center"
                    style={{
                      width: `${colWidths.subject}px`,
                      backgroundColor: "#FFC000",
                    }}
                  >
                    <input
                      type="number"
                      className="w-full h-6 px-1 text-center border border-gray-400 text-sm bg-yellow-50"
                      placeholder="0"
                      disabled={!editable}
                    />
                  </td>
                  <td
                    className="border-r border-black p-0.5 text-center"
                    style={{
                      width: `${colWidths.subject}px`,
                      backgroundColor: "#FFC000",
                    }}
                  >
                    <input
                      type="number"
                      className="w-full h-6 px-1 text-center border border-gray-400 text-sm bg-blue-50"
                      placeholder="0"
                      disabled={!editable}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Action Bar */}
      {editable && (
        <div className="bg-white border-t-2 border-gray-300 p-4 flex justify-end gap-3">
          <button
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={loadData}
            disabled={savingHeader}
          >
            Cancel
          </button>
          <button
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleSaveHeader}
            disabled={!editable || savingHeader}
          >
            {savingHeader ? (
              <>
                <span className="material-icons animate-spin text-sm">autorenew</span>
                Saving...
              </>
            ) : (
              <>
                <span className="material-icons text-sm">save</span>
                Save Student List
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentListSheet;
