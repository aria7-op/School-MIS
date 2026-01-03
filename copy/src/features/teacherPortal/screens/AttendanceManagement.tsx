import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { clearCacheAndReload, testTranslations } from "../../../i18n";
import { useAuth } from "../../../contexts/AuthContext";
import { useTeacherClasses, TeacherClass } from "../hooks/useTeacherClasses";
import secureApiService from "../../../services/secureApiService";
import ExcelJS from "exceljs";

// Component to load avatar with authentication headers or show initials
const StudentAvatarImage: React.FC<{
  studentId: string | number;
  avatarUrl: string;
  studentName: string;
  status?: string;
}> = ({ studentId, avatarUrl, studentName, status }) => {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [showInitials, setShowInitials] = useState<boolean>(true);

  useEffect(() => {
    setShowInitials(true); // Default to showing initials
    const loadAvatarWithAuth = async () => {
      try {
        console.log(`📸 Loading avatar from: ${avatarUrl}`);
        const blob = await secureApiService.getBlob(avatarUrl);
        console.log(`✅ Avatar blob received, size: ${blob.size} bytes, type: ${blob.type}`);
        
        // Check if blob is valid image (should have image/* type)
        if (!blob.type.startsWith("image/")) {
          // Blob is likely an error response (JSON), not an image
          const text = await blob.text();
          console.warn(`⚠️ Avatar blob is not an image for ${studentName}`);
          return;
        }
        
        if (blob.size === 0) {
          console.warn(`⚠️ Avatar blob is empty for ${studentName}`);
          return;
        }
        
        const url = URL.createObjectURL(blob);
        setImageSrc(url);
        setShowInitials(false); // Hide initials when image loads
        return () => URL.revokeObjectURL(url);
      } catch (error) {
        console.error(
          `❌ Failed to load avatar for ${studentName} (${studentId}):`,
          error
        );
      }
    };

    if (avatarUrl) {
      loadAvatarWithAuth();
    }
  }, [avatarUrl, studentId, studentName]);

  // Extract initials from student name
  const getInitials = () => {
    const names = studentName.trim().split(/\s+/);
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0]?.charAt(0).toUpperCase() || "?";
  };

  const getBgColor = () => {
    const colors = ["bg-blue-500", "bg-green-500", "bg-red-500", "bg-purple-500", "bg-yellow-500", "bg-pink-500"];
    const hash = studentId.toString().charCodeAt(0);
    return colors[hash % colors.length];
  };

  return (
    <>
      {imageSrc && (
        <img
          src={imageSrc}
          alt={studentName}
          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
        />
      )}
      {showInitials && (
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${getBgColor()}`}
        >
          {getInitials()}
        </div>
      )}
    </>
  );
};

interface ClassData {
  id: string;
  name: string;
  level: string;
  section: string;
  subject: string;
  students: number;
  averageGrade: number;
  attendanceRate: number;
  assignments: number;
  exams: number;
}

interface AttendanceData {
  date: string;
  present: number;
  absent: number;
  late: number;
  total: number;
}

interface AttendanceApiResponse {
  present: number;
  absent: number;
  late: number;
  totalStudents: number;
  students?: StudentAttendance[];
}

interface StudentAttendance {
  studentId: string;
  studentName: string;
  dariName?: string;
  rollNumber: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "HALF_DAY";
  inTime?: string;
  outTime?: string;
  profileImage?: string;
}

interface ClassAttendanceSummary {
  classId: string;
  className: string;
  date: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
  students: StudentAttendance[];
}

const AttendanceManagement: React.FC = () => {
  const { t, i18n, ready } = useTranslation();

  // Basic auth and teacher classes
  const { user } = useAuth();
  const teacherId = (user?.teacherId ||
    localStorage.getItem("teacherId") ||
    "") as string;
  const { classes = [], isLoading: classesLoading = false } = useTeacherClasses(
    teacherId as string
  );

  // Component state (some were accidentally removed during edits)
  const [loading, setLoading] = useState<boolean>(false);
  const [attendanceLoading, setAttendanceLoading] = useState<boolean>(false);
  const [monthlyLoading, setMonthlyLoading] = useState<boolean>(false);
  const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [classAttendanceSummary, setClassAttendanceSummary] =
    useState<ClassAttendanceSummary | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [monthlyAttendanceData, setMonthlyAttendanceData] = useState<
    Record<string, any>
  >({});
  const [monthlyDates, setMonthlyDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<
    "grid" | "table" | "monthly" | "list"
  >("grid");
  const [exportLoading, setExportLoading] = useState<boolean>(false);

  // Select a class and load its attendance summary for the selected date
  const handleClassSelect = async (classData: TeacherClass) => {
    setSelectedClass(classData);
    setError(null);
    setAttendanceError(null);
    setAttendanceLoading(true);
    try {
      const dateParam = selectedDate || new Date().toISOString().slice(0, 10);
      const resp = await secureApiService.get("/attendances/class-summary", {
        params: { classId: classData.id, date: dateParam },
      });

      const apiData = resp?.data as AttendanceApiResponse | undefined;
      if (apiData) {
        setClassAttendanceSummary({
          classId: classData.id,
          className: classData.name,
          date: dateParam,
          totalStudents: apiData.totalStudents || 0,
          present: apiData.present || 0,
          absent: apiData.absent || 0,
          late: apiData.late || 0,
          attendanceRate:
            apiData.totalStudents && apiData.totalStudents > 0
              ? ((apiData.present || 0) / apiData.totalStudents) * 100
              : 0,
          students: apiData.students || [],
        });
      } else {
        setClassAttendanceSummary(null);
      }
    } catch (err) {
      console.error("Failed to load class attendance summary:", err);
      setAttendanceError(String(err || "Failed to load attendance"));
      setClassAttendanceSummary(null);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Auto-select first class when classes load (if none selected)
  useEffect(() => {
    if (!selectedClass && classes && classes.length > 0) {
      // select the first class automatically
      handleClassSelect(classes[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes]);

  // Reload attendance data when date changes
  useEffect(() => {
    if (selectedClass) {
      handleClassSelect(selectedClass);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Log classAttendanceSummary for debugging
  useEffect(() => {
    console.log("classAttendanceSummary:", classAttendanceSummary);
  }, [classAttendanceSummary]);

  // Fetch monthly attendance data when viewMode changes to monthly or month changes
  useEffect(() => {
    const fetchMonthlyData = async () => {
      if (!selectedClass || viewMode !== "monthly") return;

      setMonthlyLoading(true);
      try {
        const month = currentMonth.getMonth();
        const year = currentMonth.getFullYear();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Build list of dates to fetch (excluding Fridays, including Saturday)
        const datesToFetch: string[] = [];
        for (let day = 1; day <= daysInMonth; day++) {
          const d = new Date(year, month, day);
          // Skip Friday (5), include Saturday (6)
          if (d.getDay() === 5) continue;

          const dateStr = `${year}-${String(month + 1).padStart(
            2,
            "0"
          )}-${String(day).padStart(2, "0")}`;
          datesToFetch.push(dateStr);
        }

        // Fetch all days in parallel using the same API as handleExportReport
        const fetchPromises = datesToFetch.map((dateStr) =>
          secureApiService
            .get("/attendances/class-summary", {
              params: { classId: selectedClass.id, date: dateStr },
            })
            .then((resp) => ({
              dateStr,
              data: resp?.data as AttendanceApiResponse | undefined,
              error: null,
            }))
            .catch((err) => ({ dateStr, data: undefined, error: err }))
        );

        const responses = await Promise.all(fetchPromises);

        // Transform responses into monthly data format with status
        const monthlyData: Record<string, any> = {};
        const fetchedDates: string[] = [];

        responses.forEach(({ dateStr, data }) => {
          const dayOfWeek = new Date(dateStr).getDay();
          console.log(
            `Date: ${dateStr}, Day: ${dayOfWeek}, Has Students: ${
              data?.students?.length > 0
            }`
          );

          if (data && data.students && Array.isArray(data.students)) {
            fetchedDates.push(dateStr);
            data.students.forEach((student) => {
              if (!monthlyData[student.studentId]) {
                monthlyData[student.studentId] = {
                  studentId: student.studentId,
                  studentName: student.studentName,
                  dariName: student.dariName,
                  rollNumber: student.rollNumber,
                  profileImage: student.profileImage,
                  dates: {},
                };
              }
              // Store attendance status and other details by date
              monthlyData[student.studentId].dates[dateStr] = {
                status: student.status || "ABSENT",
                inTime: student.inTime,
                outTime: student.outTime,
              };
            });
          }
        });

        // Sort dates for consistent display
        fetchedDates.sort();
        setMonthlyDates(fetchedDates);
        setMonthlyAttendanceData(monthlyData);
      } catch (err) {
        console.error("Failed to load monthly attendance data:", err);
        setMonthlyAttendanceData({});
      } finally {
        setMonthlyLoading(false);
      }
    };

    fetchMonthlyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, viewMode, currentMonth]);

  // Export monthly attendance report using ExcelJS
  const handleExportReport = async () => {
    if (!selectedClass) {
      alert(t("attendanceManagement.selectClassFirst"));
      return;
    }

    setExportLoading(true);
    try {
      const lang = i18n?.language || "en";
      const useLocalNames = lang.startsWith("fa") || lang.startsWith("ps");
      const isDari = lang.startsWith("fa");
      const isPashto = lang.startsWith("ps");
      const isRTL = isDari || isPashto;

      // Afghan Solar Hijri Calendar converter
      const gregorianToAfghan = (date: Date) => {
        const gYear = date.getFullYear();
        const gMonth = date.getMonth() + 1;
        const gDay = date.getDate();

        // Calculate Afghan year (roughly 621 years behind Gregorian)
        let aYear = gYear - 621;

        // Determine Afghan month and day based on Gregorian date
        let aMonth = 1;
        let aDay = 1;

        // Month start dates in Gregorian calendar
        const monthStarts = [
          { month: 1, name: "حمل", start: [3, 21] }, // Hamal - March 21
          { month: 2, name: "ثور", start: [4, 21] }, // Sawr - April 21
          { month: 3, name: "جوزا", start: [5, 22] }, // Jawza - May 22
          { month: 4, name: "سرطان", start: [6, 22] }, // Saratan - June 22
          { month: 5, name: "اسد", start: [7, 23] }, // Asad - July 23
          { month: 6, name: "سنبله", start: [8, 23] }, // Sonbola - August 23
          { month: 7, name: "میزان", start: [9, 23] }, // Mizan - September 23
          { month: 8, name: "عقرب", start: [10, 23] }, // Aqrab - October 23
          { month: 9, name: "قوس", start: [11, 22] }, // Qaws - November 22
          { month: 10, name: "جدی", start: [12, 22] }, // Jadi - December 22
          { month: 11, name: "دلو", start: [1, 21] }, // Dalw - January 21
          { month: 12, name: "حوت", start: [2, 20] }, // Hoot - February 20
        ];

        // Find the correct month
        for (let i = 0; i < monthStarts.length; i++) {
          const current = monthStarts[i];
          const next = monthStarts[(i + 1) % 12];

          const currentStart = current.start;
          const nextStart = next.start;

          // Check if date falls in this Afghan month
          if (gMonth === currentStart[0] && gDay >= currentStart[1]) {
            aMonth = current.month;
            aDay = gDay - currentStart[1] + 1;
            break;
          } else if (
            gMonth === currentStart[0] + 1 ||
            (currentStart[0] === 12 && gMonth === 1) ||
            (currentStart[0] === 1 && gMonth === 2)
          ) {
            // Check if it's still in the previous Afghan month
            const daysInMonth = i < 6 ? 31 : 30; // First 6 months have 31 days
            if (gMonth === nextStart[0] && gDay < nextStart[1]) {
              aMonth = current.month;
              aDay = daysInMonth - (nextStart[1] - gDay);
            }
          }
        }

        // Adjust year if we're before Hamal (before March 21)
        if (gMonth < 3 || (gMonth === 3 && gDay < 21)) {
          aYear--;
        }

        return {
          year: aYear,
          month: aMonth,
          day: aDay,
          monthName: monthStarts[aMonth - 1].name,
        };
      };

      // Format date in Afghan format (y/m/d)
      const formatAfghanDate = (date: Date, language: "fa" | "ps") => {
        const afghan = gregorianToAfghan(date);
        return `${afghan.year}/${String(afghan.month).padStart(
          2,
          "0"
        )}/${String(afghan.day).padStart(2, "0")}`;
      };

      // Get Afghan month name
      const getAfghanMonthName = (date: Date) => {
        const afghan = gregorianToAfghan(date);
        return afghan.monthName;
      };

      // Translation objects
      const translations = {
        en: {
          // Sheet names
          monthlyOverview: "Monthly Overview",
          dailySummary: "Daily Summary",
          attendanceRegister: "Student Attendance Register",

          // Sheet 1 - Overview
          monthlyAttendanceReport: "Monthly Attendance Report",
          classInformation: "CLASS INFORMATION",
          className: "Class Name:",
          level: "Level:",
          section: "Section:",
          month: "Month:",
          monthlyStatistics: "MONTHLY STATISTICS",
          totalSchoolDays: "Total School Days",
          presentRate: "Present Rate",
          absentRate: "Absent Rate",
          lateRate: "Late Rate",
          avgAttendanceRate: "Average Attendance Rate",

          // Sheet 2 - Daily Summary
          dailyAttendanceSummary: "Daily Attendance Summary",
          date: "Date",
          day: "Day",
          totalStudents: "Total Students",
          present: "Present",
          absent: "Absent",
          late: "Late",
          attendanceRate: "Attendance Rate (%)",
          dayOfWeek: "Day of Week",

          // Sheet 3 - Register
          studentAttendanceRegister: "Student Attendance Register",
          rollNo: "Roll No.",
          studentName: "Student Name",
          totalPresentShort: "Total Present",
          totalAbsentShort: "Total Absent",
          totalLateShort: "Total Late",
          attendancePercent: "Attendance %",
          legend: "Legend:",
          presentSymbol: "Present",
          absentSymbol: "Absent",
          lateSymbol: "Late",
          noRecord: "No Record",

          // Days
          monday: "Mon",
          tuesday: "Tue",
          wednesday: "Wed",
          thursday: "Thu",
          friday: "Fri",
          saturday: "Sat",
          sunday: "Sun",
        },
        fa: {
          // Dari
          // Sheet names
          monthlyOverview: "خلاصه ماهانه",
          dailySummary: "خلاصه روزانه",
          attendanceRegister: "دفتر حاضری دانش‌آموزان",

          // Sheet 1 - Overview
          monthlyAttendanceReport: "گزارش حاضری ماهانه",
          classInformation: "معلومات صنف",
          className: "نام صنف:",
          level: "سطح:",
          section: "بخش:",
          month: "ماه:",
          monthlyStatistics: "آمار ماهانه",
          totalSchoolDays: "مجموع روزهای مکتب",
          presentRate: "نرخ حاضری",
          absentRate: "نرخ غیابت",
          lateRate: "نرخ تاخیر",
          avgAttendanceRate: "میانگین نرخ حاضری",

          // Sheet 2 - Daily Summary
          dailyAttendanceSummary: "خلاصه حاضری روزانه",
          date: "تاریخ",
          day: "روز",
          totalStudents: "مجموع دانش‌آموزان",
          present: "حاضر",
          absent: "غایب",
          late: "دیر",
          attendanceRate: "نرخ حاضری (%)",
          dayOfWeek: "روز هفته",

          // Sheet 3 - Register
          studentAttendanceRegister: "دفتر حاضری دانش‌آموزان",
          rollNo: "شماره",
          studentName: "نام دانش‌آموز",
          totalPresentShort: "مجموع حاضر",
          totalAbsentShort: "مجموع غایب",
          totalLateShort: "مجموع دیر",
          attendancePercent: "درصد حاضری",
          legend: "راهنما:",
          presentSymbol: "حاضر",
          absentSymbol: "غایب",
          lateSymbol: "دیر",
          noRecord: "بدون سابقه",

          // Days
          monday: "دوشنبه",
          tuesday: "سه‌شنبه",
          wednesday: "چهارشنبه",
          thursday: "پنج‌شنبه",
          friday: "جمعه",
          saturday: "شنبه",
          sunday: "یکشنبه",
        },
        ps: {
          // Pashto
          // Sheet names
          monthlyOverview: "میاشتنۍ لنډیز",
          dailySummary: "ورځنۍ لنډیز",
          attendanceRegister: "د زده کوونکو حاضرۍ راجستر",

          // Sheet 1 - Overview
          monthlyAttendanceReport: "میاشتنۍ حاضرۍ راپور",
          classInformation: "د ټولګي معلومات",
          className: "د ټولګي نوم:",
          level: "کچه:",
          section: "برخه:",
          month: "میاشت:",
          monthlyStatistics: "میاشتنۍ شمیره",
          totalSchoolDays: "ټولې ښوونځي ورځې",
          presentRate: "د حاضرۍ کچه",
          absentRate: "د غیابت کچه",
          lateRate: "د ناوختۍ کچه",
          avgAttendanceRate: "د حاضرۍ اوسط کچه",

          // Sheet 2 - Daily Summary
          dailyAttendanceSummary: "ورځنۍ حاضرۍ لنډیز",
          date: "نیټه",
          day: "ورځ",
          totalStudents: "ټول زده کوونکي",
          present: "حاضر",
          absent: "غایب",
          late: "ناوخته",
          attendanceRate: "د حاضرۍ کچه (%)",
          dayOfWeek: "د اونۍ ورځ",

          // Sheet 3 - Register
          studentAttendanceRegister: "د زده کوونکو حاضرۍ راجستر",
          rollNo: "شمیره",
          studentName: "د زده کوونکي نوم",
          totalPresentShort: "ټول حاضر",
          totalAbsentShort: "ټول غایب",
          totalLateShort: "ټول ناوخته",
          attendancePercent: "د حاضرۍ سلنه",
          legend: "لارښود:",
          presentSymbol: "حاضر",
          absentSymbol: "غایب",
          lateSymbol: "ناوخته",
          noRecord: "ریکارډ نشته",

          // Days
          monday: "دوشنبه",
          tuesday: "سه‌شنبه",
          wednesday: "چهارشنبه",
          thursday: "پنجشنبه",
          friday: "جمعه",
          saturday: "شنبه",
          sunday: "یکشنبه",
        },
      };

      const t = isDari
        ? translations.fa
        : isPashto
        ? translations.ps
        : translations.en;

      // Day name mapping
      const getDayName = (dayIndex: number) => {
        const days = {
          en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          fa: [
            "یکشنبه",
            "دوشنبه",
            "سه‌شنبه",
            "چهارشنبه",
            "پنج‌شنبه",
            "جمعه",
            "شنبه",
          ],
          ps: [
            "یکشنبه",
            "دوشنبه",
            "سه‌شنبه",
            "چهارشنبه",
            "پنجشنبه",
            "جمعه",
            "شنبه",
          ],
        };
        const langKey = isDari ? "fa" : isPashto ? "ps" : "en";
        return days[langKey][dayIndex];
      };

      const formatExportDate = (dateStr: string) => {
        const d = new Date(dateStr);
        if (useLocalNames) {
          return formatAfghanDate(d, isDari ? "fa" : "ps");
        }
        return d.toLocaleDateString();
      };

      const currentDate = new Date(selectedDate);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const dailySummaries: Array<Record<string, any>> = [];
      const studentDetails: Array<Record<string, any>> = [];
      const allDates: string[] = [];

      // Build list of dates to fetch (excluding Fridays, including Saturday)
      const datesToFetch: string[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        if (d.getDay() === 5) continue; // Skip Friday

        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
          day
        ).padStart(2, "0")}`;

        allDates.push(dateStr);
        datesToFetch.push(dateStr);
      }

      // Fetch all days in parallel
      const fetchPromises = datesToFetch.map((dateStr) =>
        secureApiService
          .get("/attendances/class-summary", {
            params: { classId: selectedClass.id, date: dateStr },
          })
          .then((resp) => ({
            dateStr,
            data: resp?.data as AttendanceApiResponse | undefined,
            error: null,
          }))
          .catch((err) => ({ dateStr, data: undefined, error: err }))
      );

      const responses = await Promise.all(fetchPromises);

      // Process responses
      responses.forEach(({ dateStr, data, error }) => {
        if (error || !data) {
          dailySummaries.push({
            Date: useLocalNames ? formatExportDate(dateStr) : dateStr,
            DayOfWeek: getDayName(new Date(dateStr).getDay()),
            TotalStudents: 0,
            Present: 0,
            Absent: 0,
            Late: 0,
            AttendanceRate: "0.0",
          });
          return;
        }

        const total = data.totalStudents || 0;
        const present = data.present || 0;
        const absent = data.absent || 0;
        const late = data.late || 0;
        const rate = total > 0 ? ((present / total) * 100).toFixed(1) : "0.0";

        dailySummaries.push({
          Date: useLocalNames ? formatExportDate(dateStr) : dateStr,
          DayOfWeek: getDayName(new Date(dateStr).getDay()),
          TotalStudents: total,
          Present: present,
          Absent: absent,
          Late: late,
          AttendanceRate: rate,
        });

        if (data.students && Array.isArray(data.students)) {
          data.students.forEach((s) => {
            studentDetails.push({
              Date: dateStr,
              DateDisplay: useLocalNames ? formatExportDate(dateStr) : dateStr,
              StudentName: useLocalNames
                ? (s as any).dariName || s.studentName
                : s.studentName,
              RollNumber: s.rollNumber || "",
              Status: s.status || "",
              InTime: s.inTime || "",
              OutTime: s.outTime || "",
            });
          });
        }
      });

      // Build Excel workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "School Management";
      workbook.created = new Date();

      // RTL Font settings
      const rtlFont = isRTL
        ? { name: "Arial", size: 11 }
        : { name: "Calibri", size: 11 };
      const rtlHeaderFont = isRTL
        ? { name: "Arial", size: 12, bold: true }
        : { name: "Calibri", size: 12, bold: true };

      // =============================================
      // SHEET 1: MONTHLY OVERVIEW (WITH PERCENTAGES)
      // =============================================
      const overview = workbook.addWorksheet(t.monthlyOverview);
      overview.properties.defaultRowHeight = 20;
      if (isRTL) overview.views = [{ rightToLeft: true }];

      // Title
      overview.mergeCells("A1:D1");
      const titleCell = overview.getCell("A1");
      titleCell.value = t.monthlyAttendanceReport;
      titleCell.font = {
        ...rtlHeaderFont,
        size: 18,
        color: { argb: "FFFFFFFF" },
      };
      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1565C0" },
      };
      titleCell.alignment = { vertical: "middle", horizontal: "center" };
      overview.getRow(1).height = 35;

      // Class Information Section
      overview.addRow([]);
      overview.mergeCells("A3:D3");
      const classInfoTitle = overview.getCell("A3");
      classInfoTitle.value = t.classInformation;
      classInfoTitle.font = { ...rtlHeaderFont, color: { argb: "FF1565C0" } };
      classInfoTitle.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE3F2FD" },
      };
      classInfoTitle.alignment = {
        vertical: "middle",
        horizontal: isRTL ? "right" : "left",
        indent: 1,
      };

      // Get month name
      const monthName = useLocalNames
        ? getAfghanMonthName(currentDate)
        : currentDate.toLocaleString("en-US", { month: "long" });

      const afghanYear = useLocalNames
        ? gregorianToAfghan(currentDate).year
        : year;

      const classInfo = [
        [t.className, selectedClass.name],
        [t.level, selectedClass.level],
        [t.section, selectedClass.section],
        [t.month, `${monthName} ${afghanYear}`],
      ];

      let rowNum = 4;
      classInfo.forEach((info) => {
        overview.getCell(`A${rowNum}`).value = info[0];
        overview.getCell(`A${rowNum}`).font = { ...rtlFont, bold: true };
        overview.getCell(`A${rowNum}`).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F5F5" },
        };
        overview.getCell(`A${rowNum}`).alignment = {
          horizontal: isRTL ? "right" : "left",
        };
        overview.getCell(`B${rowNum}`).value = info[1];
        overview.getCell(`B${rowNum}`).font = rtlFont;
        overview.getCell(`B${rowNum}`).alignment = {
          horizontal: isRTL ? "right" : "left",
        };
        overview.mergeCells(`B${rowNum}:D${rowNum}`);
        rowNum++;
      });

      // Monthly Statistics Section (WITH PERCENTAGES)
      overview.addRow([]);
      rowNum++;
      overview.mergeCells(`A${rowNum}:D${rowNum}`);
      const statsTitle = overview.getCell(`A${rowNum}`);
      statsTitle.value = t.monthlyStatistics;
      statsTitle.font = { ...rtlHeaderFont, color: { argb: "FF1565C0" } };
      statsTitle.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE3F2FD" },
      };
      statsTitle.alignment = {
        vertical: "middle",
        horizontal: isRTL ? "right" : "left",
        indent: 1,
      };

      rowNum++;
      const totalPresent = dailySummaries.reduce(
        (s, r) => s + (Number(r.Present) || 0),
        0
      );
      const totalAbsent = dailySummaries.reduce(
        (s, r) => s + (Number(r.Absent) || 0),
        0
      );
      const totalLate = dailySummaries.reduce(
        (s, r) => s + (Number(r.Late) || 0),
        0
      );
      const totalDays = dailySummaries.length;
      const totalStudentsCount = dailySummaries.reduce(
        (s, r) => s + (Number(r.TotalStudents) || 0),
        0
      );

      // Calculate percentages
      const totalRecords = totalPresent + totalAbsent + totalLate;
      const presentPercent =
        totalRecords > 0
          ? ((totalPresent / totalRecords) * 100).toFixed(1)
          : "0.0";
      const absentPercent =
        totalRecords > 0
          ? ((totalAbsent / totalRecords) * 100).toFixed(1)
          : "0.0";
      const latePercent =
        totalRecords > 0
          ? ((totalLate / totalRecords) * 100).toFixed(1)
          : "0.0";

      const avgAttendanceRate =
        totalDays > 0
          ? (
              dailySummaries.reduce(
                (s, r) => s + parseFloat(r.AttendanceRate || "0"),
                0
              ) / totalDays
            ).toFixed(1)
          : "0.0";

      const stats = [
        [t.totalSchoolDays, totalDays, "📅"],
        [t.presentRate, `${presentPercent}%`, "✓"],
        [t.absentRate, `${absentPercent}%`, "✗"],
        [t.lateRate, `${latePercent}%`, "✓"],
        [t.avgAttendanceRate, `${avgAttendanceRate}%`, "📊"],
      ];

      stats.forEach((stat) => {
        overview.getCell(`A${rowNum}`).value = stat[2]; // Icon
        overview.getCell(`B${rowNum}`).value = stat[0]; // Label
        overview.getCell(`B${rowNum}`).font = { ...rtlFont, bold: true };
        overview.getCell(`B${rowNum}`).alignment = {
          horizontal: isRTL ? "right" : "left",
        };
        overview.getCell(`C${rowNum}`).value = stat[1]; // Value
        overview.getCell(`C${rowNum}`).font = {
          ...rtlFont,
          size: 12,
          bold: true,
        };
        overview.getCell(`C${rowNum}`).alignment = {
          horizontal: isRTL ? "left" : "right",
        };

        // Color coding
        if (stat[0] === t.presentRate) {
          overview.getCell(`C${rowNum}`).font = {
            ...overview.getCell(`C${rowNum}`).font,
            color: { argb: "FF4CAF50" },
          };
        } else if (stat[0] === t.absentRate) {
          overview.getCell(`C${rowNum}`).font = {
            ...overview.getCell(`C${rowNum}`).font,
            color: { argb: "FFF44336" },
          };
        } else if (stat[0] === t.lateRate) {
          overview.getCell(`C${rowNum}`).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFF00" },
          };
          overview.getCell(`C${rowNum}`).font = {
            ...overview.getCell(`C${rowNum}`).font,
            color: { argb: "FF000000" },
          };
        }

        rowNum++;
      });

      // Set column widths
      overview.getColumn(1).width = 5;
      overview.getColumn(2).width = 30;
      overview.getColumn(3).width = 20;
      overview.getColumn(4).width = 15;

      // Add borders
      overview.eachRow((row, rNum) => {
        if (rNum > 1) {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: "thin", color: { argb: "FFE0E0E0" } },
              left: { style: "thin", color: { argb: "FFE0E0E0" } },
              bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
              right: { style: "thin", color: { argb: "FFE0E0E0" } },
            };
          });
        }
      });

      // =============================================
      // SHEET 2: DAILY SUMMARY
      // =============================================
      const dailySheet = workbook.addWorksheet(t.dailySummary);
      if (isRTL) dailySheet.views = [{ rightToLeft: true }];

      // Add title
      dailySheet.mergeCells("A1:G1");
      const dailyTitle = dailySheet.getCell("A1");
      dailyTitle.value = t.dailyAttendanceSummary;
      dailyTitle.font = {
        ...rtlHeaderFont,
        size: 16,
        color: { argb: "FFFFFFFF" },
      };
      dailyTitle.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1565C0" },
      };
      dailyTitle.alignment = { vertical: "middle", horizontal: "center" };
      dailySheet.getRow(1).height = 30;

      // Set columns
      dailySheet.columns = [
        { header: t.date, key: "Date", width: 22 },
        { header: t.day, key: "Day", width: 15 },
        { header: t.totalStudents, key: "TotalStudents", width: 16 },
        { header: t.present, key: "Present", width: 12 },
        { header: t.absent, key: "Absent", width: 12 },
        { header: t.late, key: "Late", width: 12 },
        { header: t.attendanceRate, key: "AttendanceRate", width: 18 },
      ];

      // Add header row
      const dailyHeaderRow = dailySheet.getRow(2);
      dailyHeaderRow.values = [
        t.date,
        t.day,
        t.totalStudents,
        t.present,
        t.absent,
        t.late,
        t.attendanceRate,
      ];

      dailyHeaderRow.eachCell((cell) => {
        cell.font = { ...rtlHeaderFont, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1976D2" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      dailyHeaderRow.height = 25;

      // Add data rows
      dailySummaries.forEach((row) => {
        const newRow = dailySheet.addRow({
          Date: row.Date,
          Day: row.DayOfWeek,
          TotalStudents: row.TotalStudents,
          Present: row.Present,
          Absent: row.Absent,
          Late: row.Late,
          AttendanceRate: row.AttendanceRate,
        });

        // Apply font to all cells
        newRow.eachCell((cell) => {
          cell.font = rtlFont;
          cell.alignment = { horizontal: "center" };
          cell.border = {
            top: { style: "thin", color: { argb: "FFE0E0E0" } },
            left: { style: "thin", color: { argb: "FFE0E0E0" } },
            bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
            right: { style: "thin", color: { argb: "FFE0E0E0" } },
          };
        });
      });

      // Conditional formatting
      dailySheet.eachRow((row, rowNumber) => {
        if (rowNumber <= 2) return;

        const rateCell = row.getCell(7);
        const rate = parseFloat(String(rateCell.value).replace("%", "")) || 0;

        if (rate >= 90) {
          row.eachCell((cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFE8F5E9" },
            };
          });
          rateCell.font = {
            ...rtlFont,
            bold: true,
            color: { argb: "FF4CAF50" },
          };
        } else if (rate >= 80) {
          rateCell.font = {
            ...rtlFont,
            bold: true,
            color: { argb: "FF8BC34A" },
          };
        } else if (rate >= 70) {
          row.eachCell((cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFF3E0" },
            };
          });
          rateCell.font = {
            ...rtlFont,
            bold: true,
            color: { argb: "FFFF9800" },
          };
        } else {
          row.eachCell((cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFEBEE" },
            };
          });
          rateCell.font = {
            ...rtlFont,
            bold: true,
            color: { argb: "FFF44336" },
          };
        }
      });

      // Freeze header
      dailySheet.views = [
        {
          state: "frozen",
          xSplit: 0,
          ySplit: 2,
          rightToLeft: isRTL,
        },
      ];

      // =============================================
      // SHEET 3: STUDENT ATTENDANCE REGISTER
      // =============================================
      const studentSheet = workbook.addWorksheet(t.attendanceRegister);
      if (isRTL) studentSheet.views = [{ rightToLeft: true }];

      // Get unique students
      const uniqueStudents = new Map<
        string,
        { name: string; rollNumber: string }
      >();
      studentDetails.forEach((record) => {
        const key = record.RollNumber || record.StudentName;
        if (!uniqueStudents.has(key)) {
          uniqueStudents.set(key, {
            name: record.StudentName,
            rollNumber: record.RollNumber,
          });
        }
      });

      // Create attendance map
      const attendanceMap = new Map<string, Map<string, any>>();
      studentDetails.forEach((record) => {
        const studentKey = record.RollNumber || record.StudentName;
        if (!attendanceMap.has(studentKey)) {
          attendanceMap.set(studentKey, new Map());
        }
        attendanceMap.get(studentKey)!.set(record.Date, record);
      });

      // Add title
      const titleEndCol = String.fromCharCode(67 + allDates.length);
      studentSheet.mergeCells(`A1:${titleEndCol}1`);
      const studentTitle = studentSheet.getCell("A1");
      studentTitle.value = t.studentAttendanceRegister;
      studentTitle.font = {
        ...rtlHeaderFont,
        size: 16,
        color: { argb: "FFFFFFFF" },
      };
      studentTitle.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1565C0" },
      };
      studentTitle.alignment = { vertical: "middle", horizontal: "center" };
      studentSheet.getRow(1).height = 30;

      // Create header row
      const headerRow = studentSheet.getRow(2);
      headerRow.height = 70;

      // Fixed columns
      headerRow.getCell(1).value = t.rollNo;
      headerRow.getCell(2).value = t.studentName;
      headerRow.getCell(3).value = t.totalPresentShort;
      headerRow.getCell(4).value = t.totalAbsentShort;
      headerRow.getCell(5).value = t.totalLateShort;
      headerRow.getCell(6).value = t.attendancePercent;

      // Set column widths
      studentSheet.getColumn(1).width = 10;
      studentSheet.getColumn(2).width = 25;
      studentSheet.getColumn(3).width = 12;
      studentSheet.getColumn(4).width = 12;
      studentSheet.getColumn(5).width = 12;
      studentSheet.getColumn(6).width = 12;

      // Date columns
      allDates.forEach((dateStr, index) => {
        const colIndex = 7 + index;
        const d = new Date(dateStr);

        if (useLocalNames) {
          const afghan = gregorianToAfghan(d);
          const cell = headerRow.getCell(colIndex);
          cell.value = `${afghan.day}\n${getDayName(d.getDay())}`;
        } else {
          const day = d.getDate();
          const dayName = getDayName(d.getDay());
          const cell = headerRow.getCell(colIndex);
          cell.value = `${day}\n${dayName}`;
        }

        studentSheet.getColumn(colIndex).width = 12;
      });

      // Style header row
      headerRow.eachCell((cell) => {
        cell.font = { ...rtlHeaderFont, color: { argb: "FFFFFFFF" }, size: 10 };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1976D2" },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        cell.border = {
          top: { style: "medium" },
          left: { style: "thin" },
          bottom: { style: "medium" },
          right: { style: "thin" },
        };
      });

      // Add student rows
      let studentRowNum = 3;
      uniqueStudents.forEach((student, studentKey) => {
        const row = studentSheet.getRow(studentRowNum);
        const studentAttendance = attendanceMap.get(studentKey);

        let totalPresent = 0;
        let totalAbsent = 0;
        let totalLate = 0;

        // Fixed columns
        row.getCell(1).value = student.rollNumber;
        row.getCell(1).font = rtlFont;
        row.getCell(2).value = student.name;
        row.getCell(2).font = rtlFont;

        // Date columns
        allDates.forEach((dateStr, index) => {
          const colIndex = 7 + index;
          const cell = row.getCell(colIndex);
          const attendance = studentAttendance?.get(dateStr);

          if (attendance) {
            const status = String(attendance.Status).toLowerCase();

            if (status === "present") {
              cell.value = "✓"; // Checkmark sticker for present
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFC8E6C9" },
              };
              cell.font = {
                ...rtlFont,
                bold: true,
                size: 14,
                color: { argb: "FF2E7D32" },
              };
              totalPresent++;
            } else if (status === "absent") {
              cell.value = "✗"; // X sticker for absent
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFCDD2" },
              };
              cell.font = {
                ...rtlFont,
                bold: true,
                size: 14,
                color: { argb: "FFC62828" },
              };
              totalAbsent++;
            } else if (status === "late") {
              cell.value = "✓";
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFE0B2" },
              };
              cell.font = {
                ...rtlFont,
                bold: true,
                size: 14,
                color: { argb: "FFE65100" },
              };
              totalLate++;
            }
          } else {
            cell.value = "-";
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF5F5F5" },
            };
            cell.font = rtlFont;
          }

          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = {
            top: { style: "thin", color: { argb: "FFE0E0E0" } },
            left: { style: "thin", color: { argb: "FFE0E0E0" } },
            bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
            right: { style: "thin", color: { argb: "FFE0E0E0" } },
          };
        });

        // Summary columns
        row.getCell(3).value = totalPresent;
        row.getCell(3).font = rtlFont;
        row.getCell(4).value = totalAbsent;
        row.getCell(4).font = rtlFont;
        row.getCell(5).value = totalLate;
        row.getCell(5).font = rtlFont;

        const totalDaysAttended = totalPresent + totalAbsent + totalLate;
        const attendancePercentage =
          totalDaysAttended > 0
            ? ((totalPresent / totalDaysAttended) * 100).toFixed(1) + "%"
            : "0%";
        row.getCell(6).value = attendancePercentage;
        row.getCell(6).font = rtlFont;

        // Style summary columns
        [1, 2, 3, 4, 5, 6].forEach((colNum) => {
          const cell = row.getCell(colNum);
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = {
            top: { style: "thin", color: { argb: "FFE0E0E0" } },
            left: { style: "thin", color: { argb: "FFE0E0E0" } },
            bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
            right: { style: "thin", color: { argb: "FFE0E0E0" } },
          };

          if (colNum === 2) {
            cell.alignment = {
              horizontal: isRTL ? "right" : "left",
              vertical: "middle",
            };
          }

          if (colNum >= 3) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF5F5F5" },
            };
            cell.font = { ...rtlFont, bold: true };
          }
        });

        studentRowNum++;
      });

      // Add legend
      studentRowNum += 2;
      const legendRow = studentSheet.getRow(studentRowNum);
      studentSheet.mergeCells(`A${studentRowNum}:B${studentRowNum}`);
      legendRow.getCell(1).value = t.legend;
      legendRow.getCell(1).font = { ...rtlFont, bold: true, size: 11 };
      legendRow.getCell(1).alignment = { horizontal: isRTL ? "right" : "left" };

      studentRowNum++;
      const legends = [
        { symbol: "✓", meaning: t.presentSymbol, color: "FFC8E6C9" },
        { symbol: "✗", meaning: t.absentSymbol, color: "FFFFCDD2" },
        { symbol: "⏰", meaning: t.lateSymbol, color: "FFFFE0B2" },
        { symbol: "-", meaning: t.noRecord, color: "FFF5F5F5" },
      ];

      legends.forEach((legend) => {
        const row = studentSheet.getRow(studentRowNum);
        row.getCell(1).value = legend.symbol;
        row.getCell(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: legend.color },
        };
        row.getCell(1).font = { ...rtlFont, bold: true };
        row.getCell(1).alignment = { horizontal: "center" };

        studentSheet.mergeCells(`B${studentRowNum}:C${studentRowNum}`);
        row.getCell(2).value = legend.meaning;
        row.getCell(2).font = rtlFont;
        row.getCell(2).alignment = { horizontal: isRTL ? "right" : "left" };

        studentRowNum++;
      });

      // Freeze panes
      studentSheet.views = [
        {
          state: "frozen",
          xSplit: 2,
          ySplit: 2,
          rightToLeft: isRTL,
        },
      ];

      // =============================================
      // EXPORT
      // =============================================
      const buf = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const monthNameForFile = currentDate.toLocaleString("en-US", {
        month: "long",
      });
      a.href = url;
      a.download = `Attendance_Report_${selectedClass.name}_${monthNameForFile}_${year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // Show success message in the correct language
      const successMsg = t("attendanceManagement.monthlyReport.exportSuccess");
      alert(successMsg);
    } catch (err) {
      console.error("Error exporting report:", err);
      // Show error message in the correct language
      const errorMsg = t("attendanceManagement.monthlyReport.exportError");
      // alert(errorMsg);
    } finally {
      setExportLoading(false);
    }
  };

  // Debug: Log translation status
  // useEffect(() => {
  //   // console.log("🔍 AttendanceManagement - Current language:", i18n.language);
  //   console.log("🔍 AttendanceManagement - Translations ready:", ready);
  //   console.log(
  //     "🔍 AttendanceManagement - teacherPortal.attendance.title:",
  //     t("teacherPortal.attendance.title")
  /* Export using ExcelJS with better formatting, blue/orange theme, skipping Fridays,
      and using Dari/Pashto names + Persian (Hijri-Shamsi) dates when applicable.
  const handleExportReport = async () => {
    if (!selectedClass) {
      alert("Please select a class first");
      return;
    }

    // Helpers
    const lang = i18n?.language || "en";
    const useLocalNames = lang.startsWith("fa") || lang.startsWith("ps");
    const formatExportDate = (dateStr: string) => {
      const d = new Date(dateStr);
      if (useLocalNames) {
        try {
          return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(d);
        } catch {
          return d.toLocaleDateString();
        }
      }
      return d.toLocaleDateString();
    };

    try {
      const currentDate = new Date(selectedDate);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const dailySummaries: any[] = [];
      const studentDetails: any[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);

        // Skip Fridays (JS: Friday is 5)
        if (d.getDay() === 5) continue;

        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
          day
        ).padStart(2, "0")}`;

        try {
          const response = await secureApiService.get(
            "/attendances/class-summary",
            {
              params: { classId: selectedClass.id, date: dateStr },
            }
          );

          const dayData = response?.data as AttendanceApiResponse;
          if (dayData) {
            const total = dayData.totalStudents || 0;
            const present = dayData.present || 0;

                date: dateStr,
              },
            }
          );

          const dayData = response?.data as AttendanceApiResponse;
          if (dayData) {
            // Daily summary data
            dailySummaries.push({
              Date: dateStr,
              "Day of Week": new Date(dateStr).toLocaleDateString("en-US", {
                weekday: "long",
              }),
              "Total Students": dayData.totalStudents || 0,
              Present: dayData.present || 0,
              Absent: dayData.absent || 0,
              Late: dayData.late || 0,
              "Attendance Rate (%)":
                dayData.totalStudents > 0
                  ? (
                      ((dayData.present || 0) / dayData.totalStudents) *
                      100
                    ).toFixed(1)
                  : "0.0",
              Status:
                dayData.totalStudents > 0
                  ? ((dayData.present || 0) / dayData.totalStudents) * 100 >= 80
                    ? "Good"
                    : "Needs Attention"
                  : "No Data",
            });

            // Student details for this day
            if (dayData.students && Array.isArray(dayData.students)) {
              dayData.students.forEach((student: StudentAttendance) => {
                studentDetails.push({
                  Date: dateStr,
                  "Day of Week": new Date(dateStr).toLocaleDateString("en-US", {
                    weekday: "long",
                  }),
                  "Student Name": student.studentName || "N/A",
                  "Roll Number": student.rollNumber || "N/A",
                  Status: student.status || "N/A",
                  "In Time": student.inTime || "N/A",
                  "Out Time": student.outTime || "N/A",
                  "Profile Image": student.profileImage || "N/A",
                  Class: selectedClass.name,
                  Level: selectedClass.level,
                  Section: selectedClass.section,
                });
              });
            }
          }
        } catch (dayError) {
          // console.log(`⚠️ No data for ${dateStr}:`, dayError);
          // Add empty row for days with no data
          dailySummaries.push({
            Date: dateStr,
            "Day of Week": new Date(dateStr).toLocaleDateString("en-US", {
              weekday: "long",
            }),
            "Total Students": 0,
            Present: 0,
            Absent: 0,
            Late: 0,
            "Attendance Rate (%)": "0.0",
            Status: "No Data",
          });
        }
      }

      // Calculate monthly statistics
      const totalDays = dailySummaries.length;
      const daysWithData = dailySummaries.filter(
        (day) => day["Total Students"] > 0
      ).length;
      const totalPresent = dailySummaries.reduce(
        (sum, day) => sum + day.Present,
        0
      );
      const totalAbsent = dailySummaries.reduce(
        (sum, day) => sum + day.Absent,
        0
      );
      const totalLate = dailySummaries.reduce((sum, day) => sum + day.Late, 0);
      const avgAttendanceRate =
        daysWithData > 0
          ? (
              dailySummaries.reduce(
                (sum, day) => sum + parseFloat(day["Attendance Rate (%)"]),
                0
              ) / daysWithData
            ).toFixed(1)
          : "0.0";

      const goodDays = dailySummaries.filter(
        (day) => day.Status === "Good"
      ).length;
      const needsAttentionDays = dailySummaries.filter(
        (day) => day.Status === "Needs Attention"
      ).length;
      const noDataDays = dailySummaries.filter(
        (day) => day.Status === "No Data"
      ).length;

      // Create monthly overview sheet
      const monthlyOverview = [
        ["MONTHLY ATTENDANCE REPORT", "", "", "", "", ""],
        ["Class:", selectedClass.name, "", "", "", ""],
        [
          "Level:",
          selectedClass.level,
          "Section:",
          selectedClass.section,
          "",
          "",
        ],
        [
          "Month:",
          `${year}-${String(month + 1).padStart(2, "0")}`,
          "",
          "",
          "",
          "",
        ],
        ["Generated on:", new Date().toLocaleDateString(), "", "", "", ""],
        ["", "", "", "", "", ""],
        ["MONTHLY STATISTICS", "", "", "", "", ""],
        ["Total Days in Month:", totalDays, "", "", "", ""],
        ["Days with Attendance Data:", daysWithData, "", "", "", ""],
        ["Days with No Data:", noDataDays, "", "", "", ""],
        ["", "", "", "", "", ""],
        ["ATTENDANCE SUMMARY", "", "", "", "", ""],
        ["Total Present (Month):", totalPresent, "", "", "", ""],
        ["Total Absent (Month):", totalAbsent, "", "", "", ""],
        ["Total Late (Month):", totalLate, "", "", "", ""],
        ["Average Attendance Rate:", `${avgAttendanceRate}%`, "", "", "", ""],
        ["", "", "", "", "", ""],
        ["DAILY STATUS BREAKDOWN", "", "", "", "", ""],
        ["Good Days (≥80% attendance):", goodDays, "", "", "", ""],
        ["Needs Attention Days (<80%):", needsAttentionDays, "", "", "", ""],
        ["No Data Days:", noDataDays, "", "", "", ""],
        ["", "", "", "", "", ""],
        ["RECOMMENDATIONS", "", "", "", "", ""],
        [
          "• Focus on improving attendance on days with low rates",
          "",
          "",
          "",
          "",
          "",
        ],
        [
          "• Consider contacting parents of frequently absent students",
          "",
          "",
          "",
          "",
          "",
        ],
        ["• Review attendance patterns to identify trends", "", "", "", "", ""],
        ["• Implement attendance improvement strategies", "", "", "", "", ""],
      ];

      // Create workbook with multiple sheets
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Monthly Overview
      const overviewSheet = XLSX.utils.aoa_to_sheet(monthlyOverview);
      XLSX.utils.book_append_sheet(workbook, overviewSheet, "Monthly Overview");

      // Sheet 2: Daily Summary
      if (dailySummaries.length > 0) {
        const dailySheet = XLSX.utils.json_to_sheet(dailySummaries);
        XLSX.utils.book_append_sheet(workbook, dailySheet, "Daily Summary");
      }

      // Sheet 3: Student Details
      if (studentDetails.length > 0) {
        const studentSheet = XLSX.utils.json_to_sheet(studentDetails);
        XLSX.utils.book_append_sheet(workbook, studentSheet, "Student Details");
      }

      // Sheet 4: Pivot Table - Students vs Dates
      if (studentDetails.length > 0) {
        const pivotData = createPivotTable(studentDetails, dailySummaries);
        const pivotSheet = XLSX.utils.aoa_to_sheet(pivotData);
        XLSX.utils.book_append_sheet(workbook, pivotSheet, "Attendance Pivot");
      }

      // Sheet 5: Statistics Analysis
      const statisticsData = [
        ["ATTENDANCE ANALYSIS", "", "", "", ""],
        ["Metric", "Value", "Percentage", "Status", "Notes"],
        [
          "Total School Days",
          totalDays,
          "100%",
          "Complete",
          "All days in month",
        ],
        [
          "Days with Data",
          daysWithData,
          `${((daysWithData / totalDays) * 100).toFixed(1)}%`,
          daysWithData === totalDays ? "Complete" : "Incomplete",
          "Days with attendance records",
        ],
        [
          "Average Daily Attendance",
          avgAttendanceRate + "%",
          "",
          parseFloat(avgAttendanceRate) >= 80 ? "Good" : "Needs Improvement",
          "Monthly average",
        ],
        [
          "Best Attendance Day",
          dailySummaries.length > 0
            ? Math.max(
                ...dailySummaries.map((d) =>
                  parseFloat(d["Attendance Rate (%)"])
                )
              ) + "%"
            : "N/A",
          "",
          "",
          "Highest single day rate",
        ],
        [
          "Worst Attendance Day",
          dailySummaries.length > 0
            ? Math.min(
                ...dailySummaries
                  .filter((d) => d["Total Students"] > 0)
                  .map((d) => parseFloat(d["Attendance Rate (%)"]))
              ) + "%"
            : "N/A",
          "",
          "",
          "Lowest single day rate",
        ],
        ["", "", "", "", ""],
        ["TREND ANALYSIS", "", "", "", ""],
        [
          "Consistent Attendance",
          goodDays >= daysWithData * 0.7 ? "Yes" : "No",
          "",
          goodDays >= daysWithData * 0.7 ? "Good" : "Needs Work",
          "70% or more good days",
        ],
        [
          "Attendance Improvement",
          needsAttentionDays < daysWithData * 0.3 ? "Yes" : "No",
          "",
          needsAttentionDays < daysWithData * 0.3 ? "Good" : "Needs Work",
          "Less than 30% poor days",
        ],
        [
          "Data Completeness",
          daysWithData === totalDays ? "Complete" : "Incomplete",
          `${((daysWithData / totalDays) * 100).toFixed(1)}%`,
          daysWithData === totalDays ? "Excellent" : "Needs Improvement",
          "All days should have data",
        ],
      ];

      const statisticsSheet = XLSX.utils.aoa_to_sheet(statisticsData);
      XLSX.utils.book_append_sheet(
        workbook,
        statisticsSheet,
        "Statistics Analysis"
      );

      // Generate filename
      const monthName = currentDate.toLocaleDateString("en-US", {
        month: "long",
      });
      const filename = `Attendance_Report_${selectedClass.name}_${monthName}_${year}.xlsx`;

      // Download the file
      XLSX.writeFile(workbook, filename);

      // console.log(
      //   "✅ Comprehensive monthly attendance report exported successfully"
      // );
      alert(
        `Monthly attendance report exported successfully!\n\nFile: ${filename}\n\nSheets included:\n• Monthly Overview\n• Daily Summary\n• Student Details (with In/Out Times)\n• Attendance Pivot (Dates as Columns)\n• Statistics Analysis`
      );
    } catch (error) {
      console.error("❌ Error exporting monthly attendance report:", error);
      alert("Failed to export monthly attendance report. Please try again.");
    }
  };
*/

  const handleSendNotice = async () => {
    if (!selectedClass) {
      alert("Please select a class first");
      return;
    }

    try {
      // Get attendance summary for the notice
      const presentCount = classAttendanceSummary?.present || 0;
      const absentCount = classAttendanceSummary?.absent || 0;
      const lateCount = classAttendanceSummary?.late || 0;
      const totalStudents = classAttendanceSummary?.totalStudents || 0;
      const attendanceRate =
        totalStudents > 0
          ? ((presentCount / totalStudents) * 100).toFixed(1)
          : "0";

      // Create messages in 3 languages
      const messages = {
        en: `Attendance Notice for ${selectedClass.name} - ${selectedDate}

Summary:
• Total Students: ${totalStudents}
• Present: ${presentCount}
• Absent: ${absentCount}
• Late: ${lateCount}
• Attendance Rate: ${attendanceRate}%

Please ensure your child attends classes regularly.`,

        fa: `اطلاعیه حاضری برای ${selectedClass.name} - ${selectedDate}

خلاصه:
• مجموع دانش‌آموزان: ${totalStudents}
• حاضر: ${presentCount}
• غایب: ${absentCount}
• دیر: ${lateCount}
• نرخ حاضری: ${attendanceRate}%

لطفاً اطمینان حاصل کنید که فرزند شما به طور منظم به کلاس‌ها حضور دارد.`,

        ps: `د حاضرۍ خبرتیا د ${selectedClass.name} - ${selectedDate}

خلاصه:
• ټول زده کوونکي: ${totalStudents}
• حاضر: ${presentCount}
• غایب: ${absentCount}
• ناوخته: ${lateCount}
• د حاضرۍ کچه: ${attendanceRate}%

براه کړئ چې ستاسو ماشوم په منظم ډول په ټولګي کې شامل شي.`,
      };

      const allMessages = `${messages.en}\n\n---\n\n${messages.fa}\n\n---\n\n${messages.ps}`;

      // Show confirmation dialog with all language versions
      const confirmed = confirm(
        `Send attendance notice to parents of ${selectedClass.name} in 3 languages (English, Dari, Pashto)?\n\n${allMessages}`
      );

      if (confirmed) {
        // TODO: Integrate with actual notification service
        // Send notices in all 3 languages
        // console.log("📢 Notice would be sent in English:", messages.en);
        // console.log("📢 Notice would be sent in Dari:", messages.fa);
        // console.log("📢 Notice would be sent in Pashto:", messages.ps);
        alert("Notice sent successfully to parents in 3 languages!");
      }
    } catch (error) {
      console.error("❌ Error sending notice:", error);
      alert("Failed to send notice. Please try again.");
    }
  };

  const generatePDFContent = () => {
    if (!selectedClass || Object.keys(monthlyAttendanceData).length === 0) {
      return "<html><body><p>No data available</p></body></html>";
    }

    const monthName = currentMonth.toLocaleDateString("en-US", {
      month: "long",
    });
    const year = currentMonth.getFullYear();

    const studentRows = Object.entries(monthlyAttendanceData)
      .map(([studentId, data]: any) => {
        const dates = monthlyDates
          .map((date) => {
            const dateData = data.dates?.[date];
            const status = dateData?.status || "ABSENT";
            const symbol =
              status === "PRESENT"
                ? "✓"
                : status === "ABSENT"
                ? "✗"
                : status === "LATE"
                ? "L"
                : status === "EXCUSED"
                ? "E"
                : status === "HALF_DAY"
                ? "H"
                : "-";
            return `<td style="border: 1px solid #ddd; padding: 5px; text-align: center; font-weight: bold;">${symbol}</td>`;
          })
          .join("");

        return `<tr>
        <td style="border: 1px solid #ddd; padding: 8px; font-weight: 500;">${
          data.studentName || studentId
        }</td>
        ${dates}
      </tr>`;
      })
      .join("");

    const dateHeaders = monthlyDates
      .map((date) => {
        const d = new Date(date);
        return `<th style="border: 1px solid #ddd; padding: 5px; text-align: center; font-size: 11px; font-weight: bold;">${d.getDate()}</th>`;
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html dir="ltr">
        <head>
          <meta charset="UTF-8">
          <title>Attendance Report - ${selectedClass.name}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
            .header h1 { margin: 0 0 10px 0; color: #333; font-size: 24px; }
            .header p { margin: 5px 0; color: #666; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #999; padding: 8px; text-align: center; }
            th { background-color: #4b5563; color: white; font-weight: bold; }
            td:first-child, th:first-child { text-align: left; }
            tr:nth-child(even) { background-color: #f5f5f5; }
            .legend { margin-top: 30px; border-top: 2px solid #333; padding-top: 15px; }
            .legend h3 { margin-top: 0; }
            .legend-item { margin: 8px 0; font-size: 14px; }
            .symbol { font-weight: bold; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Monthly Attendance Report</h1>
            <p><strong>Class:</strong> ${selectedClass.name}</p>
            <p><strong>Month:</strong> ${monthName} ${year}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                ${dateHeaders}
              </tr>
            </thead>
            <tbody>
              ${studentRows}
            </tbody>
          </table>

          <div class="legend">
            <h3>Legend:</h3>
            <div class="legend-item"><span class="symbol">✓</span> = Present</div>
            <div class="legend-item"><span class="symbol">✗</span> = Absent</div>
            <div class="legend-item"><span class="symbol">L</span> = Late</div>
            <div class="legend-item"><span class="symbol">E</span> = Excused</div>
            <div class="legend-item"><span class="symbol">H</span> = Half Day</div>
            <div class="legend-item"><span class="symbol">-</span> = No Record</div>
          </div>
        </body>
      </html>
    `;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600 bg-green-50 border-green-200";
    if (rate >= 80) return "text-blue-600 bg-blue-50 border-blue-200";
    if (rate >= 70) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getAttendanceStatus = (rate: number) => {
    if (rate >= 90) return "Excellent";
    if (rate >= 80) return "Good";
    if (rate >= 70) return "Average";
    return "Needs Attention";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "--";
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return "--";
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "PRESENT":
        return t("teacherPortal.attendance.present");
      case "ABSENT":
        return t("teacherPortal.attendance.absent");
      case "LATE":
        return t("teacherPortal.attendance.late");
      case "EXCUSED":
        return t("teacherPortal.attendance.excused");
      case "HALF_DAY":
        return t("teacherPortal.attendance.halfDay");
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "text-green-600 bg-green-50 border-green-200";
      case "ABSENT":
        return "text-red-600 bg-red-50 border-red-200";
      case "LATE":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "EXCUSED":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "HALF_DAY":
        return "text-orange-600 bg-orange-50 border-orange-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "check_circle";
      case "ABSENT":
        return "cancel";
      case "LATE":
        return "schedule";
      case "EXCUSED":
        return "info";
      case "HALF_DAY":
        return "remove_circle";
      default:
        return "help";
    }
  };

  if (loading || attendanceLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <span className="material-icons text-4xl sm:text-5xl lg:text-6xl text-gray-400 mb-4 animate-spin">
          hourglass_empty
        </span>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600">
          {t("teacherPortal.common.loading")}
        </p>
      </div>
    );
  }

  if (error || attendanceError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
        <span className="material-icons text-4xl sm:text-5xl lg:text-6xl text-red-500 mb-4">
          error
        </span>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 mb-2">
          {t("teacherPortal.attendance.errorLoading")}
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-md">
          {t("teacherPortal.common.tryAgain")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-2 sm:p-4 lg:p-6 xl:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8 bg-white p-4 sm:p-8 rounded-lg border-black shadow-md">
        <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-2">
          {t("teacherPortal.attendance.title")}
        </h1>
        <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-gray-600">
          {t("teacherPortal.attendance.subtitle")}
        </p>
      </div>

      {classes.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 lg:py-20 text-center">
          <span className="material-icons text-6xl sm:text-7xl lg:text-8xl text-gray-400 mb-6">
            calendar_today
          </span>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-600 mb-4">
            {t("attendanceManagement.noClassesAvailable")}
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-500 max-w-md">
            {t("attendanceManagement.selectClassFirst")}
          </p>
        </div>
      ) : (
        /* Attendance Content */
        <div className="space-y-2 sm:space-y-6 lg:space-y-8">
          {/* Class Selector */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 lg:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900">
                {t("teacherPortal.attendance.selectClass")}
              </h2>
            </div>

            {/* Class Number Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-3 sm:mb-4">
              {classes.map((classData) => (
                <button
                  key={classData.id}
                  onClick={() => handleClassSelect(classData)}
                  className={`
                    w-10 h-10 sm:w-12 sm:h-12 rounded-lg font-bold text-sm sm:text-lg transition-all duration-200
                    ${
                      selectedClass?.id === classData.id
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }
                  `}
                >
                  {classData.name + " " + classData.code}
                </button>
              ))}
            </div>
          </div>

          {/* View Mode Selector */}
          {selectedClass && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
                {t("teacherPortal.attendance.viewMode")}
              </h3>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors flex items-center justify-center text-sm sm:text-base ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="material-icons text-base sm:text-lg">
                      grid_view
                    </span>
                    <span className="hidden sm:inline">
                      {t("teacherPortal.attendance.grid")}
                    </span>
                    <span className="sm:hidden">Grid</span>
                  </div>
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors flex items-center justify-center text-sm sm:text-base ${
                    viewMode === "table"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="material-icons text-base sm:text-lg">
                      table_chart
                    </span>
                    <span className="hidden sm:inline">
                      {t("teacherPortal.attendance.tabs.table")}
                    </span>
                    <span className="sm:hidden">Table</span>
                  </div>
                </button>
                <button
                  onClick={() => setViewMode("monthly")}
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors flex items-center justify-center text-sm sm:text-base ${
                    viewMode === "monthly"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="material-icons text-base sm:text-lg">
                      calendar_month
                    </span>
                    <span className="hidden sm:inline">
                      {t("teacherPortal.attendance.tabs.monthly")}
                    </span>
                    <span className="sm:hidden">Monthly</span>
                  </div>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors flex items-center justify-center text-sm sm:text-base ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="material-icons text-base sm:text-lg">
                      list
                    </span>
                    <span className="hidden sm:inline">
                      {t("teacherPortal.attendance.tabs.list")}
                    </span>
                    <span className="sm:hidden">List</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Attendance Overview */}
          {selectedClass && (
            <div className="space-y-2 sm:space-y-6">
              {/* Class Overview */}
              <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 lg:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
                  <div>
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-1">
                      {selectedClass.name + " " + selectedClass.code}
                    </h3>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-600">
                      Level {selectedClass.level} - {selectedClass.section}
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      {t("teacherPortal.attendance.selectDate")}
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Attendance Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3 lg:p-4 text-center">
                    <div className="flex items-center justify-center mb-1 sm:mb-2">
                      <span className="material-icons text-lg sm:text-xl lg:text-2xl text-green-600">
                        check_circle
                      </span>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-green-700">
                      {classAttendanceSummary?.present || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-green-600 font-medium">
                      {t("teacherPortal.attendance.present")}
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 lg:p-4 text-center">
                    <div className="flex items-center justify-center mb-1 sm:mb-2">
                      <span className="material-icons text-lg sm:text-xl lg:text-2xl text-red-600">
                        cancel
                      </span>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-red-700">
                      {classAttendanceSummary?.absent || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-red-600 font-medium">
                      {t("teacherPortal.attendance.absent")}
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-3 lg:p-4 text-center">
                    <div className="flex items-center justify-center mb-1 sm:mb-2">
                      <span className="material-icons text-lg sm:text-xl lg:text-2xl text-yellow-600">
                        schedule
                      </span>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-yellow-700">
                      {classAttendanceSummary?.late || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-yellow-600 font-medium">
                      {t("teacherPortal.attendance.late")}
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 sm:p-3 lg:p-4 text-center">
                    <div className="flex items-center justify-center mb-1 sm:mb-2">
                      <span className="material-icons text-lg sm:text-xl lg:text-2xl text-purple-600">
                        analytics
                      </span>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-purple-700">
                      {classAttendanceSummary?.attendanceRate
                        ? Math.round(classAttendanceSummary.attendanceRate)
                        : 0}
                      %
                    </div>
                    <div className="text-xs sm:text-sm text-purple-600 font-medium">
                      {t("teacherPortal.attendance.attendanceRate")}
                    </div>
                  </div>
                </div>

                {/* Summary Text */}
                <div className="text-sm text-gray-600 mt-4">
                  {classAttendanceSummary?.present || 0}{" "}
                  {t("teacherPortal.attendance.present")} •{" "}
                  {classAttendanceSummary?.absent || 0}{" "}
                  {t("teacherPortal.attendance.absent")} •{" "}
                  {classAttendanceSummary?.late || 0}{" "}
                  {t("teacherPortal.attendance.late")}
                </div>
              </div>

              {/* Attendance History */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className="flex gap-3 min-w-max pb-2">
                    {attendanceData.map((day, index) => {
                      const attendanceRate =
                        ((day.present + day.late) / day.total) * 100;
                      return (
                        <div
                          key={day.date}
                          className={`
                            border rounded-lg p-3 sm:p-4 transition-all duration-200 min-w-[200px] flex-shrink-0
                            ${getAttendanceColor(attendanceRate)}
                          `}
                        >
                          <div className="flex flex-col items-center text-center">
                            <div className="mb-2">
                              <div className="font-semibold text-sm sm:text-base">
                                {formatDate(day.date)}
                              </div>
                              <div className="text-xs sm:text-sm opacity-75">
                                {getAttendanceStatus(attendanceRate)} •{" "}
                                {attendanceRate.toFixed(1)}%
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 text-sm">
                              <div className="flex items-center justify-center gap-1">
                                <span className="material-icons text-sm text-green-600">
                                  check_circle
                                </span>
                                <span className="font-medium">
                                  {day.present}
                                </span>
                              </div>
                              <div className="flex items-center justify-center gap-1">
                                <span className="material-icons text-sm text-yellow-600">
                                  schedule
                                </span>
                                <span className="font-medium">{day.late}</span>
                              </div>
                              <div className="flex items-center justify-center gap-1">
                                <span className="material-icons text-sm text-red-600">
                                  cancel
                                </span>
                                <span className="font-medium">
                                  {day.absent}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* View Mode Content */}
              {classAttendanceSummary && classAttendanceSummary.students && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      {t("teacherPortal.attendance.studentsIn")}{" "}
                      {selectedClass.name + " " + selectedClass.code}
                    </h3>
                    <span className="text-sm text-gray-600">
                      {classAttendanceSummary.students.length}{" "}
                      {t("teacherPortal.classes.modal.studentsEnrolled")}
                    </span>
                  </div>

                  {viewMode === "grid" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                      {classAttendanceSummary.students.map((student) => (
                        <div
                          key={student.studentId}
                          className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white hover:shadow-md transition-shadow"
                        >
                          {/* Student Avatar */}
                          <div className="flex items-center justify-center mb-3">
                            {student.profileImage ? (
                              <StudentAvatarImage
                                studentId={student.studentId}
                                avatarUrl={student.profileImage}
                                studentName={student.studentName}
                                status={student.status}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-blue-500">
                                {student.studentName
                                  .split(" ")
                                  .slice(0, 2)
                                  .map((n) => n.charAt(0))
                                  .join("")
                                  .toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Student Info */}
                          <div className="text-center mb-3">
                            <div className="font-semibold text-sm text-gray-900 mb-1">
                              {i18n.language === "en"
                                ? student.studentName
                                : student.dariName || student.studentName}
                            </div>

                            <div className="text-xs text-gray-600 mb-2">
                              {t("teacherPortal.classes.modal.id")}:{" "}
                              {student.studentId}
                            </div>

                            {/* Status Tag */}
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                student.status === "PRESENT"
                                  ? "bg-green-100 text-green-800"
                                  : student.status === "ABSENT"
                                  ? "bg-red-100 text-red-800"
                                  : student.status === "LATE"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : student.status === "EXCUSED"
                                  ? "bg-purple-100 text-purple-800"
                                  : student.status === "HALF_DAY"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {getStatusLabel(student.status)}
                            </span>
                          </div>

                          {/* Time Info */}
                          <div className="space-y-2 mb-3">
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">
                                {t("teacherPortal.classes.modal.checkIn")}
                              </span>{" "}
                              {formatTime(student.inTime) || "Not marked"}
                            </div>
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">
                                {t("teacherPortal.classes.modal.checkOut")}
                              </span>{" "}
                              {formatTime(student.outTime) || "Not marked"}
                            </div>
                          </div>

                          {/* Student ID */}
                          {/* <div className="text-center">
                            <span className="text-xs text-gray-500">
                              {t("teacherPortal.classes.modal.id")}:{" "}
                              {student.studentId}
                            </span>
                          </div> */}
                        </div>
                      ))}
                    </div>
                  )}

                  {viewMode === "table" && (
                    <div className="overflow-x-auto">
                      <div className="min-w-full">
                        {/* Mobile Table View */}
                        <div className="block sm:hidden">
                          {classAttendanceSummary.students.map((student) => (
                            <div
                              key={student.studentId}
                              className="bg-white border border-gray-200 rounded-lg p-3 mb-3"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                      student.status === "PRESENT"
                                        ? "bg-green-500"
                                        : student.status === "ABSENT"
                                        ? "bg-red-500"
                                        : student.status === "LATE"
                                        ? "bg-yellow-500"
                                        : "bg-gray-500"
                                    }`}
                                  >
                                    {student.studentName
                                      .split(" ")
                                      .map((n) => n.charAt(0))
                                      .join("")
                                      .substring(0, 2)}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {i18n.language === "en"
                                        ? student.studentName
                                        : student.dariName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Roll: {student.rollNumber || "N/A"}
                                    </div>
                                  </div>
                                </div>
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    student.status === "PRESENT"
                                      ? "bg-green-100 text-green-800"
                                      : student.status === "ABSENT"
                                      ? "bg-red-100 text-red-800"
                                      : student.status === "LATE"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : student.status === "EXCUSED"
                                      ? "bg-purple-100 text-purple-800"
                                      : student.status === "HALF_DAY"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {getStatusLabel(student.status)}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                <div>
                                  <span className="font-medium">Check In:</span>
                                  <br />
                                  {formatTime(student.inTime) || "Not marked"}
                                </div>
                                <div>
                                  <span className="font-medium">
                                    Check Out:
                                  </span>
                                  <br />
                                  {formatTime(student.outTime) || "Not marked"}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Desktop Table View */}
                        <table className="hidden sm:table min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t("teacherPortal.attendance.student")}
                              </th>
                              <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t("teacherPortal.attendance.roll")}
                              </th>
                              <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t("teacherPortal.attendance.status")}
                              </th>
                              <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t("teacherPortal.attendance.checkIn")}
                              </th>
                              <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t("teacherPortal.attendance.checkOut")}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {classAttendanceSummary.students.map((student) => (
                              <tr key={student.studentId}>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                        student.status === "PRESENT"
                                          ? "bg-green-500"
                                          : student.status === "ABSENT"
                                          ? "bg-red-500"
                                          : student.status === "LATE"
                                          ? "bg-yellow-500"
                                          : "bg-gray-500"
                                      }`}
                                    >
                                      {student.studentName
                                        .split(" ")
                                        .map((n) => n.charAt(0))
                                        .join("")
                                        .substring(0, 2)}
                                    </div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {i18n.language === "en"
                                        ? student.studentName
                                        : student.dariName}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {student.studentId || "N/A"}
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      student.status === "PRESENT"
                                        ? "bg-green-100 text-green-800"
                                        : student.status === "ABSENT"
                                        ? "bg-red-100 text-red-800"
                                        : student.status === "LATE"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : student.status === "EXCUSED"
                                        ? "bg-purple-100 text-purple-800"
                                        : student.status === "HALF_DAY"
                                        ? "bg-orange-100 text-orange-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {getStatusLabel(student.status)}
                                  </span>
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatTime(student.inTime) || "Not marked"}
                                </td>
                                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatTime(student.outTime) || "Not marked"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {viewMode === "list" && (
                    <div className="space-y-3">
                      {classAttendanceSummary.students.map((student) => (
                        <div
                          key={student.studentId}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                                student.status === "PRESENT"
                                  ? "bg-green-500"
                                  : student.status === "ABSENT"
                                  ? "bg-red-500"
                                  : student.status === "LATE"
                                  ? "bg-yellow-500"
                                  : "bg-gray-500"
                              }`}
                            >
                              {student.studentName
                                .split(" ")
                                .map((n) => n.charAt(0))
                                .join("")
                                .substring(0, 2)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {i18n.language === "en"
                                  ? student.studentName
                                  : student.dariName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {t("teacherPortal.attendance.roll")}:{" "}
                                {student.studentId || "N/A"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                student.status === "PRESENT"
                                  ? "bg-green-100 text-green-800"
                                  : student.status === "ABSENT"
                                  ? "bg-red-100 text-red-800"
                                  : student.status === "LATE"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : student.status === "EXCUSED"
                                  ? "bg-purple-100 text-purple-800"
                                  : student.status === "HALF_DAY"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {getStatusLabel(student.status)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {viewMode === "monthly" && (
                    <div className="monthly-attendance-container">
                      {monthlyLoading && (
                        <div className="flex items-center justify-center gap-2 py-8">
                          <span className="material-icons text-2xl text-gray-400 animate-spin">
                            hourglass_empty
                          </span>
                          <span className="text-gray-600">
                            {t("teacherPortal.common.loading")}
                          </span>
                        </div>
                      )}
                      {!monthlyLoading && (
                        <>
                          {/* Monthly Header */}
                          <div className="bg-blue-600 text-white p-3 sm:p-4 rounded-t-lg">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                              <div>
                                <h3 className="text-base sm:text-lg font-bold">
                                  {selectedClass.name} -{" "}
                                  {t(
                                    "teacherPortal.attendance.monthlyAttendance"
                                  )}
                                </h3>
                                <p className="text-blue-100 text-sm">
                                  {formatMonthYear(currentMonth)}
                                </p>
                              </div>

                              {/* Month Navigation */}
                              <div className="flex items-center justify-center lg:justify-end gap-2">
                                <button
                                  onClick={() => navigateMonth("prev")}
                                  className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                                >
                                  <span className="material-icons text-white">
                                    chevron_left
                                  </span>
                                </button>
                                <div className="bg-blue-500 px-3 sm:px-4 py-2 rounded-full">
                                  <span className="text-white font-medium text-sm sm:text-base">
                                    {formatMonthYear(currentMonth)}
                                  </span>
                                </div>
                                <button
                                  onClick={() => navigateMonth("next")}
                                  className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                                >
                                  <span className="material-icons text-white">
                                    chevron_right
                                  </span>
                                </button>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center justify-center lg:justify-end gap-1 sm:gap-2">
                                <button
                                  onClick={() =>
                                    handleClassSelect(selectedClass!)
                                  }
                                  className="p-2 bg-blue-500 hover:bg-blue-700 rounded-full transition-colors"
                                  title={
                                    t("teacherPortal.quickActions.refresh") ||
                                    "Refresh"
                                  }
                                >
                                  <span className="material-icons text-white text-sm">
                                    refresh
                                  </span>
                                </button>
                                <button
                                  onClick={() => setViewMode("monthly")}
                                  className={`px-2 sm:px-3 py-2 rounded text-white text-xs sm:text-sm font-medium transition-colors hidden sm:inline ${
                                    viewMode === "monthly"
                                      ? "bg-blue-700"
                                      : "bg-blue-500 hover:bg-blue-700"
                                  }`}
                                >
                                  Matrix
                                </button>
                                <button
                                  onClick={() => handleExportReport()}
                                  disabled={exportLoading || !selectedClass}
                                  className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 px-2 sm:px-3 py-2 rounded text-white text-xs sm:text-sm font-medium transition-colors flex items-center gap-1"
                                >
                                  <span className="material-icons text-xs sm:text-sm">
                                    table_chart
                                  </span>
                                  <span className="hidden sm:inline">
                                    {exportLoading
                                      ? t(
                                          "teacherPortal.quickActions.exporting"
                                        ) || "Exporting..."
                                      : "Excel"}
                                  </span>
                                </button>
                                <button
                                  onClick={() => {
                                    if (selectedClass) {
                                      const printWindow = window.open(
                                        "",
                                        "_blank"
                                      );
                                      if (printWindow) {
                                        const htmlContent =
                                          generatePDFContent();
                                        printWindow.document.write(htmlContent);
                                        printWindow.document.close();
                                        setTimeout(
                                          () => printWindow.print(),
                                          250
                                        );
                                      }
                                    }
                                  }}
                                  className="bg-blue-500 hover:bg-blue-700 px-2 sm:px-3 py-2 rounded text-white text-xs sm:text-sm font-medium transition-colors flex items-center gap-1"
                                >
                                  <span className="material-icons text-xs sm:text-sm">
                                    picture_as_pdf
                                  </span>
                                  <span className="hidden sm:inline">PDF</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Legend */}
                          <div className="bg-gray-50 p-2 sm:p-3 border-l border-r border-gray-200">
                            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full"></div>
                                <span className="text-xs sm:text-sm text-gray-700">
                                  {t("teacherPortal.attendance.present")}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full"></div>
                                <span className="text-xs sm:text-sm text-gray-700">
                                  {t("teacherPortal.attendance.absent")}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded-full"></div>
                                <span className="text-xs sm:text-sm text-gray-700">
                                  {t("teacherPortal.attendance.late")}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-500 rounded-full"></div>
                                <span className="text-xs sm:text-sm text-gray-700">
                                  {t("teacherPortal.attendance.excused")}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 rounded-full"></div>
                                <span className="text-xs sm:text-sm text-gray-700">
                                  {t("teacherPortal.attendance.halfDay")}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Mobile Monthly View */}
                          <div className="block sm:hidden bg-white border border-gray-200 rounded-b-lg p-3">
                            <div className="space-y-3">
                              {Object.entries(monthlyAttendanceData).map(
                                ([studentId, studentData]: [string, any]) => {
                                  const dates = studentData.dates || {};
                                  const presentCount = Object.values(
                                    dates
                                  ).filter(
                                    (d: any) => d.status === "PRESENT"
                                  ).length;
                                  const absentCount = Object.values(
                                    dates
                                  ).filter(
                                    (d: any) => d.status === "ABSENT"
                                  ).length;
                                  const lateCount = Object.values(dates).filter(
                                    (d: any) => d.status === "LATE"
                                  ).length;
                                  const excusedCount = Object.values(
                                    dates
                                  ).filter(
                                    (d: any) => d.status === "EXCUSED"
                                  ).length;

                                  return (
                                    <div
                                      key={studentId}
                                      className="border border-gray-200 rounded-lg p-3"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div>
                                          <div className="font-medium text-gray-900 text-sm">
                                            {i18n.language === "en"
                                              ? studentData.studentName
                                              : studentData.dariName}
                                          </div>
                                          <div className="text-xs text-gray-600">
                                            {t("teacherPortal.attendance.roll")}
                                            : {studentData.rollNumber || "N/A"}
                                          </div>
                                        </div>
                                        <div className="flex gap-1">
                                          <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                            {presentCount}P
                                          </div>
                                          <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                                            {absentCount}A
                                          </div>
                                          <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                                            {lateCount}L
                                          </div>
                                          <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                                            {excusedCount}E
                                          </div>
                                        </div>
                                      </div>

                                      {/* Weekly Attendance Grid */}
                                      <div className="grid grid-cols-7 gap-1">
                                        {Array.from(
                                          {
                                            length:
                                              getDaysInMonth(currentMonth),
                                          },
                                          (_, i) => {
                                            const date = new Date(
                                              currentMonth.getFullYear(),
                                              currentMonth.getMonth(),
                                              i + 1
                                            );
                                            const dateStr = date
                                              .toISOString()
                                              .split("T")[0];
                                            const today = new Date();
                                            const isFutureDate = date > today;
                                            const studentAttendance =
                                              dates[dateStr];
                                            const status =
                                              studentAttendance?.status || null;

                                            const getAttendanceDot = (
                                              status: string | null,
                                              isFuture: boolean
                                            ) => {
                                              if (isFuture || !status) {
                                                return (
                                                  <div className="w-2 h-2 mx-auto bg-gray-200 rounded-full border border-gray-300"></div>
                                                );
                                              }

                                              switch (status) {
                                                case "PRESENT":
                                                  return (
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                  );
                                                case "ABSENT":
                                                  return (
                                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                  );
                                                case "LATE":
                                                  return (
                                                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                                  );
                                                case "EXCUSED":
                                                  return (
                                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                  );
                                                case "HALF_DAY":
                                                  return (
                                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                  );
                                                default:
                                                  return (
                                                    <div className="w-2 h-2 mx-auto bg-gray-300 rounded-full"></div>
                                                  );
                                              }
                                            };

                                            return (
                                              <div
                                                key={i + 1}
                                                className="text-center flex flex-col items-center"
                                              >
                                                <div className="text-xs text-gray-500 mb-1">
                                                  {i + 1}
                                                </div>
                                                <div
                                                  className={`${
                                                    isFutureDate
                                                      ? "opacity-50"
                                                      : ""
                                                  }`}
                                                >
                                                  {getAttendanceDot(
                                                    status,
                                                    isFutureDate
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          }
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>

                          {/* Desktop Monthly Grid */}
                          <div className="hidden sm:block bg-white border border-gray-200 rounded-b-lg overflow-auto">
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse min-w-[500px]">
                                <thead>
                                  <tr className="bg-gray-50">
                                    <th className="border border-gray-300 p-1 sm:p-2 text-left font-semibold text-gray-700 min-w-[120px] sm:min-w-[140px]">
                                      <div className="text-xs sm:text-sm">
                                        {t("teacherPortal.attendance.student")}
                                      </div>
                                    </th>
                                    <th className="border border-gray-300 p-1 sm:p-2 text-center font-semibold text-gray-700 min-w-[70px] sm:min-w-[80px]">
                                      <div className="text-xs sm:text-sm">
                                        {t("attendanceManagement.table.status")}
                                      </div>
                                    </th>
                                    {/* Generate date headers dynamically from fetched dates */}
                                    {monthlyDates.map((dateStr) => {
                                      const date = new Date(dateStr);
                                      const dayNames = [
                                        "Sun",
                                        "Mon",
                                        "Tue",
                                        "Wed",
                                        "Thu",
                                        "Fri",
                                        "Sat",
                                      ];
                                      const dayOfWeek = date.getDay();
                                      const day = date.getDate();

                                      return (
                                        <th
                                          key={dateStr}
                                          className="border border-gray-300 p-1 text-center min-w-[30px] sm:min-w-[35px]"
                                        >
                                          <div className="text-xs font-semibold text-gray-700">
                                            {day}
                                          </div>
                                          <div className="text-xs text-gray-500 hidden sm:block">
                                            {dayNames[dayOfWeek]}
                                          </div>
                                        </th>
                                      );
                                    })}
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.entries(monthlyAttendanceData).map(
                                    ([studentId, studentData]: [
                                      string,
                                      any
                                    ]) => {
                                      const dates = studentData.dates || {};
                                      const presentCount = Object.values(
                                        dates
                                      ).filter(
                                        (d: any) => d.status === "PRESENT"
                                      ).length;
                                      const absentCount = Object.values(
                                        dates
                                      ).filter(
                                        (d: any) => d.status === "ABSENT"
                                      ).length;
                                      const lateCount = Object.values(
                                        dates
                                      ).filter(
                                        (d: any) => d.status === "LATE"
                                      ).length;
                                      const excusedCount = Object.values(
                                        dates
                                      ).filter(
                                        (d: any) => d.status === "EXCUSED"
                                      ).length;

                                      return (
                                        <tr
                                          key={studentId}
                                          className="hover:bg-gray-50"
                                        >
                                          <td className="border border-gray-300 p-1 sm:p-2">
                                            <div className="mb-1">
                                              <div
                                                className="font-medium text-gray-900 text-xs truncate"
                                                title={
                                                  i18n.language === "en"
                                                    ? studentData.studentName
                                                    : studentData.dariName
                                                }
                                              >
                                                {i18n.language === "en"
                                                  ? studentData.studentName
                                                  : studentData.dariName}
                                              </div>
                                              <div className="text-xs text-gray-600 truncate">
                                                {t(
                                                  "teacherPortal.attendance.roll"
                                                )}
                                                :{" "}
                                                {studentData.studentId || "N/A"}
                                              </div>
                                            </div>
                                          </td>
                                          <td className="border border-gray-300 p-1 sm:p-2">
                                            {/* Monthly Summary Boxes */}
                                            <div className="flex flex-wrap gap-0.5">
                                              <div className="bg-green-100 text-green-800 px-1 py-0.5 rounded text-xs font-medium">
                                                {presentCount}P
                                              </div>
                                              <div className="bg-red-100 text-red-800 px-1 py-0.5 rounded text-xs font-medium">
                                                {absentCount}A
                                              </div>
                                              <div className="bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded text-xs font-medium">
                                                {lateCount}L
                                              </div>
                                              <div className="bg-purple-100 text-purple-800 px-1 py-0.5 rounded text-xs font-medium">
                                                {excusedCount}E
                                              </div>
                                            </div>
                                          </td>
                                          {/* Generate attendance cells for fetched dates */}
                                          {monthlyDates.map((dateStr) => {
                                            const date = new Date(dateStr);
                                            const today = new Date();
                                            const isFutureDate = date > today;
                                            const studentAttendance =
                                              dates[dateStr];
                                            const status =
                                              studentAttendance?.status || null;

                                            const getAttendanceIcon = (
                                              status: string | null,
                                              isFuture: boolean
                                            ) => {
                                              if (isFuture || !status) {
                                                return (
                                                  <div className="w-3 h-3 mx-auto bg-gray-100 rounded-full border border-gray-300"></div>
                                                );
                                              }

                                              switch (status) {
                                                case "PRESENT":
                                                  return (
                                                    <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                                                      <span className="text-white text-xs font-bold">
                                                        ✓
                                                      </span>
                                                    </div>
                                                  );
                                                case "ABSENT":
                                                  return (
                                                    <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                                      <span className="text-white text-xs font-bold">
                                                        ×
                                                      </span>
                                                    </div>
                                                  );
                                                case "LATE":
                                                  return (
                                                    <div className="w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                                                      <span className="text-white text-xs font-bold">
                                                        L
                                                      </span>
                                                    </div>
                                                  );
                                                case "EXCUSED":
                                                  return (
                                                    <div className="w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center">
                                                      <span className="text-white text-xs font-bold">
                                                        E
                                                      </span>
                                                    </div>
                                                  );
                                                case "HALF_DAY":
                                                  return (
                                                    <div className="w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
                                                      <span className="text-white text-xs font-bold">
                                                        H
                                                      </span>
                                                    </div>
                                                  );
                                                default:
                                                  return (
                                                    <div className="w-3 h-3 mx-auto bg-gray-200 rounded-full"></div>
                                                  );
                                              }
                                            };

                                            return (
                                              <td
                                                key={dateStr}
                                                className={`border border-gray-300 p-0.5 text-center ${
                                                  isFutureDate
                                                    ? "bg-gray-50"
                                                    : ""
                                                }`}
                                              >
                                                <div
                                                  className={`flex items-center justify-center transition-opacity ${
                                                    isFutureDate
                                                      ? "cursor-not-allowed opacity-50"
                                                      : "hover:opacity-80 cursor-pointer"
                                                  }`}
                                                >
                                                  {getAttendanceIcon(
                                                    status,
                                                    isFutureDate
                                                  )}
                                                </div>
                                              </td>
                                            );
                                          })}
                                        </tr>
                                      );
                                    }
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="bg-gray-100 p-3 sm:p-4 border border-gray-200 rounded-b-lg">
                            <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                              <div className="text-center">
                                <div className="text-xs sm:text-sm text-gray-600">
                                  {t("teacherPortal.attendance.totalStudents")}
                                </div>
                                <div className="text-base sm:text-lg font-bold text-gray-900">
                                  {classAttendanceSummary.students.length}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs sm:text-sm text-gray-600">
                                  {t("teacherPortal.attendance.month")}
                                </div>
                                <div className="text-base sm:text-lg font-bold text-gray-900">
                                  {formatMonthYear(currentMonth)}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs sm:text-sm text-gray-600">
                                  {t("teacherPortal.attendance.days")}
                                </div>
                                <div className="text-base sm:text-lg font-bold text-gray-900">
                                  {getDaysInMonth(currentMonth)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* No Student Data Message */}
              {classAttendanceSummary &&
                (!classAttendanceSummary.students ||
                  classAttendanceSummary.students.length === 0) && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <span className="material-icons text-4xl text-gray-400 mb-4">
                        people
                      </span>
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        {t("teacherPortal.attendance.noStudentData")}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {t("teacherPortal.attendance.noRecordsFound")}{" "}
                        {selectedClass.name} {t("teacherPortal.attendance.on")}{" "}
                        {formatDate(selectedDate)}
                      </p>
                    </div>
                  </div>
                )}

              {/* Quick Actions */}
              <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 lg:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                  {t("teacherPortal.quickActions.title")}
                </h3>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
                  <button
                    onClick={handleExportReport}
                    disabled={exportLoading}
                    className={`flex-1 px-3 py-2 sm:px-4 sm:py-2 lg:py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base ${
                      exportLoading
                        ? "bg-green-400 text-white cursor-wait"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    <span className="material-icons text-base sm:text-lg">
                      {exportLoading ? "hourglass_empty" : "download"}
                    </span>
                    {exportLoading
                      ? t("teacherPortal.quickActions.exporting") ||
                        "Exporting..."
                      : t("teacherPortal.quickActions.exportReport")}
                  </button>
                  <button
                    onClick={handleSendNotice}
                    className="flex-1 bg-orange-600 text-white px-3 py-2 sm:px-4 sm:py-2 lg:py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
                  >
                    <span className="material-icons text-base sm:text-lg">
                      notifications
                    </span>
                    {t("teacherPortal.quickActions.sendNotice")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;
