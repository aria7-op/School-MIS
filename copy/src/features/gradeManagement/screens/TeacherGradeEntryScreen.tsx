import React, { useState, useEffect, useMemo, useCallback } from "react";
import ExcelWorkbook from "../components/ExcelWorkbook";
import gradeManagementService from "../services/gradeManagementService";
import { getTeacherClasses } from "../../teacherPortal/services/teacherDashboardService";
import { useAuth } from "../../../contexts/AuthContext";
import type { TeacherClass } from "../types/gradeManagement";
import { useTranslation } from "react-i18next";

import { saveAs } from "file-saver";
// import { useTranslation } from "react-i18next";

import ExcelJS from "exceljs";
import { HEADER_FIELD_DEFAULTS } from "../context/StudentListHeaderContext";

type WorkbookView = "grades" | "adminForms";

interface TeacherGradeEntryScreenProps {
  defaultView?: WorkbookView;
}

/**
 * Teacher Grade Entry Screen
 * Allows teachers to enter grades for their classes and subjects
 * Matches Excel workflow: Select Class → Select Exam → Enter Grades
 */
const TeacherGradeEntryScreen: React.FC<TeacherGradeEntryScreenProps> = ({
  defaultView = "grades",
}) => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedExamType, setSelectedExamType] = useState<"MIDTERM" | "FINAL">(
    "MIDTERM"
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null
  );
  const [activeWorkbookSheet, setActiveWorkbookSheet] =
    useState<WorkbookView>(defaultView);
  const [loading, setLoading] = useState(true);

  // Check if user is admin (not a regular teacher)
  const { i18n, t } = useTranslation();

  const isAdmin = useMemo(() => {
    if (!user) return false;
    const role = user.role?.toUpperCase() || "";
    const adminRoles = [
      "SUPER_ADMIN",
      "SUPERADMIN",
      "SCHOOL_ADMIN",
      "ADMIN",
      "ADMIN_USER",
      "OWNER",
      "BRANCH_MANAGER",
    ];
    return adminRoles.includes(role);
  }, [user]);

  // Excel pattern: Only two exam types (Mid-term and Final)
  const examTypes = [
    {
      value: "MIDTERM",
      label: "Mid-term Exam (چهارونیم ماهه)",
      labelEn: "Mid-term Exam | امتحان چهارنیما",
      labelFa: "امتجان چهارنیما",
      labelPa: "چهارنیما آزموینی",
    },
    {
      value: "FINAL",
      label: "Final/Annual Exam (امتحان سالانه)",
      labelEn: "Final Exam |  امتحان سالانه",

    },
  ];

  useEffect(() => {
    loadTeacherClasses();
  }, [isAdmin, user]);

  useEffect(() => {
    // If teacher tries to access adminForms, redirect to grades
    if (defaultView === "adminForms" && !isAdmin) {
      setActiveWorkbookSheet("grades");
    } else {
      setActiveWorkbookSheet(defaultView);
    }
  }, [defaultView, isAdmin]);

  // Ensure teachers can't access adminForms view
  useEffect(() => {
    if (!isAdmin && activeWorkbookSheet === "adminForms") {
      setActiveWorkbookSheet("grades");
    }
  }, [isAdmin, activeWorkbookSheet]);

  // Ensure a default subject is selected when entering Admin Forms
  useEffect(() => {
    if (!isAdmin) return;
    if (activeWorkbookSheet !== "adminForms") return;
    // Find the currently selected class
    const currentClass =
      classes.find((c) => c.id === selectedClassId) || classes[0];
    if (!currentClass || !Array.isArray(currentClass.subjects)) return;
    if (!selectedSubjectId && currentClass.subjects.length > 0) {
      setSelectedSubjectId(currentClass.subjects[0].id);
    }
  }, [
    activeWorkbookSheet,
    isAdmin,
    classes,
    selectedClassId,
    selectedSubjectId,
  ]);

  const loadTeacherClasses = useCallback(async () => {
   try {
     setLoading(true);

     // SECURITY: Get teacher ID from localStorage (same as classes tab)
     // This ensures we only show data for the logged-in teacher
     const storedUserRaw =
       typeof window !== "undefined" ? localStorage.getItem("user") : null;
     const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
     const storedTeacherId =
       typeof window !== "undefined"
         ? localStorage.getItem("teacherId")
         : null;
     const teacherId = (
       storedUser?.teacherId ||
       storedTeacherId ||
       storedUser?.id ||
       ""
     ).toString();

     console.log("🔒 User role:", user?.role);
     console.log("🔒 Is Admin:", isAdmin);

     let response;
     if (isAdmin) {
       // For admins (superAdmin/admin_user), fetch ALL classes
       console.log("👨‍💼 Loading ALL classes for admin user");
       const secureApiService = (
         await import("../../../services/secureApiService")
       ).default;
       response = await secureApiService.get("/classes");
     } else {
       // For regular teachers, fetch only their assigned classes
       if (!teacherId) {
          console.warn("No teacher ID found");
          setClasses([]);
          return;
        }

        console.log("🔒 Loading classes for teacher ID:", teacherId);

        // SECURITY: Use the same service as the classes tab to get only classes assigned to this teacher
        // API endpoint: GET /classes/teacher/${teacherId} - backend filters by teacherId
        response = await getTeacherClasses(teacherId);
      }
      console.log("Loading classes response:", response);

      // Handle response structure - same as classes tab
      let classesArray: any[] = [];
      if (response) {
        // For successful responses with success flag
        if (response.success === true) {
          const responseData = response.data;
          classesArray = Array.isArray(responseData)
            ? responseData
            : Array.isArray(responseData?.classes)
            ? responseData.classes
            : Array.isArray(responseData?.data)
            ? responseData.data
            : [];
        }
        // For responses that are directly an array or object with data
        else if (Array.isArray(response)) {
          classesArray = response;
        } else if (Array.isArray(response.data)) {
          classesArray = response.data;
        } else if (Array.isArray(response.classes)) {
          classesArray = response.classes;
        }
      }

      console.log("📚 Classes array:", classesArray);
      console.log("📚 Classes count:", classesArray.length);

      // SECURITY: Fetch subjects separately for each class
      // For admins: fetch ALL subjects for the class
      // For teachers: fetch only subjects this teacher teaches
      // API endpoint: GET /classes/${cls.id}/subjects?teacherId=${teacherId} - backend filters by teacherId
      const secureApiService = (
        await import("../../../services/secureApiService")
      ).default;
      const mappedClasses: TeacherClass[] = await Promise.all(
        classesArray.map(async (cls: any) => {
          let teacherSubjects: any[] = [];

          // Fetch subjects - admins see all subjects, teachers see only their subjects
          if (cls.id) {
            try {
              const subjectFetchUrl = `/classes/${cls.id}/subjects${
                !isAdmin && teacherId ? `?teacherId=${teacherId}` : ""
              }`;
              console.log(
                `🔒 Class ${cls.name} - Fetching ${isAdmin ? "ALL" : "teacher-assigned"} subjects...`
              );
              const res: any = await secureApiService.get(subjectFetchUrl);

              const data = Array.isArray(res.data)
                ? res.data
                : res.data?.data || res.data?.subjects || [];

              teacherSubjects = data
                .map((s: any) => ({
                  id: s.id?.toString() || "",
                  name: s.name || s.code || `Subject ${s.id}`,
                  code: s.code || "",
                }))
                .filter((s: any) => s.id && s.name);

              console.log(
                `📚 Class ${cls.name} - Fetched ${teacherSubjects.length} subjects`
              );
            } catch (error) {
              console.error(
                `❌ Error fetching subjects for class ${cls.name}:`,
                error
              );
              // If API fails, try to use subjects from class object if available
              if (Array.isArray(cls.subjects) && cls.subjects.length > 0) {
                if (isAdmin) {
                  // For admins, include all subjects
                  teacherSubjects = cls.subjects
                    .map((subject: any) => ({
                      id:
                        subject.id?.toString() ||
                        subject.subjectId?.toString() ||
                        "",
                      name: subject.name || subject.subject?.name || "",
                      code:
                        subject.code ||
                        subject.subjectCode ||
                        subject.subject?.code ||
                        "",
                    }))
                    .filter((s: any) => s.id && s.name);
                } else {
                  // For teachers, only include subjects where teacherId matches
                  teacherSubjects = cls.subjects
                    .filter((subject: any) => {
                      const subjectTeacherId =
                        subject?.teacherId?.toString() ||
                        subject?.teacher_id?.toString() ||
                        subject?.teacher?.id?.toString() ||
                        subject?.assignedTeacherId?.toString();
                      // STRICT: Only include if teacherId matches exactly - do not include unassigned subjects
                      return subjectTeacherId === teacherId;
                    })
                    .map((subject: any) => ({
                      id:
                        subject.id?.toString() ||
                        subject.subjectId?.toString() ||
                        "",
                      name: subject.name || subject.subject?.name || "",
                      code:
                        subject.code ||
                        subject.subjectCode ||
                        subject.subject?.code ||
                        "",
                    }))
                    .filter((s: any) => s.id && s.name);
                }
              }
            }
          }

          return {
            id: cls.id?.toString() || "",
            name: cls.name || "Unnamed Class",
            code: cls.code || cls.classCode || "",
            level: cls.level || cls.gradeLevel || 0,
            section: cls.section || cls.sectionName || null,
            studentCount: cls._count?.students || cls.studentCount || 0,
            subjects: teacherSubjects,
          };
        })
      );

      setClasses(mappedClasses);
      console.log("📚 Mapped classes:", mappedClasses);
      console.log("📚 Set classes state:", mappedClasses.length);

      if (mappedClasses.length > 0) {
        const firstClass = mappedClasses[0];
        setSelectedClassId(firstClass.id);

        // Preselect first subject for admins so downstream sheets get a default
        if (
          isAdmin &&
          Array.isArray(firstClass.subjects) &&
          firstClass.subjects.length > 0
        ) {
          setSelectedSubjectId(firstClass.subjects[0].id);
        }

        // Only allow adminForms view for admins
        if (
          isAdmin &&
          defaultView === "adminForms" &&
          Array.isArray(firstClass.subjects) &&
          firstClass.subjects.length > 0
        ) {
          setActiveWorkbookSheet("adminForms");
        } else {
          // Ensure teachers can't access adminForms
          if (activeWorkbookSheet === "adminForms" && !isAdmin) {
            setActiveWorkbookSheet("grades");
          }
        }
      }
    } catch (error) {
      console.error("❌ Error loading classes:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        isAdmin,
        user: user?.role,
      });
      alert(t("teacherPortal.exams.loadError"));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user, t]);

  const handleGradesSaved = () => {
    alert(t("teacherPortal.exams.saved"));
  };

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId),
    [classes, selectedClassId]
  );

  const selectedSubject = useMemo(() => {
    if (!selectedClass || !selectedSubjectId) return null;
    return (
      selectedClass.subjects.find(
        (subject) => subject.id === selectedSubjectId
      ) || null
    );
  }, [selectedClass, selectedSubjectId]);

  const handleSelectClass = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSubjectId(null);
    setActiveWorkbookSheet("grades");
  };

  const handleSelectSubject = (classId: string, subjectId: string) => {
    setSelectedClassId(classId);
    setSelectedSubjectId(subjectId);
    // Only allow adminForms for admins
    if (isAdmin) {
      setActiveWorkbookSheet("adminForms");
    } else {
      setActiveWorkbookSheet("grades");
    }
  };

  async function exportToExcel() {
    try {
      console.log("Exporting... ");

      // Fetch real data from API including header metadata
      const [
        studentsData,
        midtermData,
        finalData,
        computerMidtermData,
        computerFinalData,
        headerData,
      ] = await Promise.all([
        gradeManagementService.getClassStudents(selectedClassId),
        gradeManagementService.getExcelGradeSheetByType(
          selectedClassId,
          "MIDTERM"
        ),
        gradeManagementService.getExcelGradeSheetByType(
          selectedClassId,
          "FINAL"
        ),
        gradeManagementService.getSubjectComponentMarks(
          selectedClassId,
          "MIDTERM",
          "COMPUTER"
        ),
        gradeManagementService.getSubjectComponentMarks(
          selectedClassId,
          "FINAL",
          "COMPUTER"
        ),
        gradeManagementService.getStudentListHeader(
          selectedClassId,
          selectedExamType
        ),
      ]);

      // Handle response structure - extract data array
      const students = Array.isArray(studentsData?.data)
        ? studentsData.data
        : Array.isArray(studentsData)
        ? studentsData
        : [];

      console.log("Students data:", students);
      console.log("Header data:", headerData);

      // Sort students alphabetically by Dari name
      const sortedStudents = [...students].sort((a, b) => {
        const nameA =
          a.user?.dariName?.trim() ||
          a.studentDariName?.trim() ||
          a.user?.firstName + " " + a.user?.lastName ||
          "";

        const nameB =
          b.user?.dariName?.trim() ||
          b.studentDariName?.trim() ||
          b.user?.firstName + " " + b.user?.lastName ||
          "";

        return nameA.localeCompare(nameB, "fa");
      });

      const response = await fetch("/documents/six.xlsx");
      if (!response.ok) throw new Error("File not found!");
      const arrayBuffer = await response.arrayBuffer();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      const sheet = workbook.worksheets[0];

      // Extract header information from API
      const fields = headerData?.fields || {};

      // General Information from API - Dynamic data
      sheet.getCell("BA1").value = fields.educationDepartment || "";
      sheet.getCell("AM1").value = fields.educationDistrict || "";
      sheet.getCell("AB1").value = fields.schoolName || "";
      sheet.getCell("E1").value = fields.academicYear || "";
      sheet.getCell("H1").value = fields.studentYear || "";
      sheet.getCell("P1").value = selectedClass?.name || fields.className || "";

      // Class Supervisor (نگران صنف)
      sheet.getCell("W1").value =
        fields.classSupervisor || fields.classTeacher || "";

      // Principal/Director (مدیر)
      sheet.getCell("BC1").value = fields.principal || fields.director || "";

      // Deputy Principal (معاون مدیر)
      sheet.getCell("BC2").value =
        fields.deputyPrincipal || fields.vicePrincipal || "";

      // Academic Deputy (معاون علمی)
      sheet.getCell("BC3").value =
        fields.academicDeputy || fields.academicVicePrincipal || "";

      // Committee Members (کمیته ها)
      // First Committee (هیت اول)
      sheet.getCell("BC5").value = fields.committee1Member1 || "";
      sheet.getCell("BC6").value = fields.committee1Member2 || "";

      // Second Committee (هیت دوم)
      sheet.getCell("BC7").value =
        fields.committee2Member1 || fields.committee2 || "";

      // Third Committee (هیت سوم)
      sheet.getCell("BC8").value =
        fields.committee3Member1 || fields.committee3 || "";

      // Additional committee members if available
      if (fields.committee1Member3) {
        // Add to appropriate cell if there's a fourth row for committee 1
        const nextRow = sheet.getCell("BC9");
        if (nextRow) nextRow.value = fields.committee1Member3;
      }

      if (fields.committee2Member2) {
        const nextRow = sheet.getCell("BC10");
        if (nextRow) nextRow.value = fields.committee2Member2;
      }

      if (fields.committee3Member2) {
        const nextRow = sheet.getCell("BC11");
        if (nextRow) nextRow.value = fields.committee3Member2;
      }

      // Loop through sorted students, starting from row 5
      sortedStudents.forEach((student: any, index: number) => {
        const insertRow = 5 + index; // 5, 6, 7, 8, 9, 10, etc.

        console.log(`Row ${insertRow}:`, {
          studentName: student.user?.dariName,
          fatherName: student.parent?.user?.dariName,
          studentId: student.id,
        });

        // B column - Student name in Dari
        const studentNameCell = sheet.getCell(`B${insertRow}`);
        // studentNameCell.value = String(student.user?.dariName || student.studentDariName || "");
        studentNameCell.value = String(
          student.user?.dariName?.trim() ||
            student.studentDariName?.trim() ||
            `${student.user?.firstName || ""} ${
              student.user?.lastName || ""
            }`.trim()
        );

        studentNameCell.font = {
          name: "Calibri",
          size: 11,
          bold: false,
          italic: false,
        };

        // C column - Father name in Dari
        const fatherNameCell = sheet.getCell(`C${insertRow}`);
        fatherNameCell.value = String(
          student.parent?.user?.dariName || student.fatherDariName || ""
        );
        fatherNameCell.font = {
          name: "Calibri",
          size: 11,
          bold: false,
          italic: false,
        };

        // Apply font to other personal info columns (D, E, F)
        const personalInfoCols = ["D", "E", "F"];
        personalInfoCols.forEach((col) => {
          const c = sheet.getCell(`${col}${insertRow}`);
          c.font = { name: "Calibri", size: 11 };
        });

        // Get midterm grades for this student
        const midtermStudent = midtermData.students?.find(
          (s: any) => s.studentId === student.id
        );
        const finalStudent = finalData.students?.find(
          (s: any) => s.studentId === student.id
        );

        // Helper function to get mark value (only if it exists and is not 0)
        const getMarkValue = (mark: any) => {
          if (
            mark === null ||
            mark === undefined ||
            mark === "" ||
            mark === 0
          ) {
            return "";
          }
          return mark;
        };

        // Midterm marks - exam marks (K to W columns)
        const midtermSubjects = midtermStudent?.subjectMarks || {};
        sheet.getCell(`K${insertRow}`).value = getMarkValue(
          midtermSubjects["QURAN"]?.marks
        ); // QURAN
        sheet.getCell(`L${insertRow}`).value = getMarkValue(
          midtermSubjects["DEEN"]?.marks
        ); // DEEN
        sheet.getCell(`M${insertRow}`).value = getMarkValue(
          midtermSubjects["DARI"]?.marks
        ); // DARI
        sheet.getCell(`N${insertRow}`).value = getMarkValue(
          midtermSubjects["PASHTO"]?.marks
        ); // PASHTO
        sheet.getCell(`O${insertRow}`).value = getMarkValue(
          midtermSubjects["LANG3"]?.marks
        ); // LANG3
        sheet.getCell(`P${insertRow}`).value = getMarkValue(
          midtermSubjects["ENGLISH"]?.marks
        ); // ENGLISH
        sheet.getCell(`Q${insertRow}`).value = getMarkValue(
          midtermSubjects["MATH"]?.marks
        ); // MATH
        sheet.getCell(`R${insertRow}`).value = getMarkValue(
          midtermSubjects["SCIENCE"]?.marks
        ); // SCIENCE
        sheet.getCell(`S${insertRow}`).value = getMarkValue(
          midtermSubjects["SOCIAL"]?.marks
        ); // SOCIAL
        sheet.getCell(`T${insertRow}`).value = getMarkValue(
          midtermSubjects["ART"]?.marks
        ); // ART
        sheet.getCell(`U${insertRow}`).value = getMarkValue(
          midtermSubjects["LIFESKILLS"]?.marks
        ); // LIFESKILLS
        sheet.getCell(`V${insertRow}`).value = getMarkValue(
          midtermSubjects["PE"]?.marks
        ); // PE
        sheet.getCell(`W${insertRow}`).value = getMarkValue(
          midtermSubjects["ETHICS"]?.marks
        ); // ETHICS

        // Midterm attendance (Z to AD columns)
        sheet.getCell(`Z${insertRow}`).value = getMarkValue(
          midtermStudent?.attendance?.totalDays
        );
        sheet.getCell(`AA${insertRow}`).value = getMarkValue(
          midtermStudent?.attendance?.present
        );
        sheet.getCell(`AB${insertRow}`).value = getMarkValue(
          midtermStudent?.attendance?.absent
        );
        sheet.getCell(`AC${insertRow}`).value = getMarkValue(
          midtermStudent?.attendance?.sick
        );
        sheet.getCell(`AD${insertRow}`).value = getMarkValue(
          midtermStudent?.attendance?.leave
        );

        // Final exam marks - exam marks (AF to AS columns)
        const finalSubjects = finalStudent?.subjectMarks || {};
        sheet.getCell(`AF${insertRow}`).value = getMarkValue(
          finalSubjects["QURAN"]?.marks
        ); // QURAN
        sheet.getCell(`AG${insertRow}`).value = getMarkValue(
          finalSubjects["DEEN"]?.marks
        ); // DEEN
        sheet.getCell(`AH${insertRow}`).value = getMarkValue(
          finalSubjects["DARI"]?.marks
        ); // DARI
        sheet.getCell(`AI${insertRow}`).value = getMarkValue(
          finalSubjects["PASHTO"]?.marks
        ); // PASHTO
        sheet.getCell(`AJ${insertRow}`).value = getMarkValue(
          finalSubjects["LANG3"]?.marks
        ); // LANG3
        sheet.getCell(`AK${insertRow}`).value = getMarkValue(
          finalSubjects["ENGLISH"]?.marks
        ); // ENGLISH
        sheet.getCell(`AL${insertRow}`).value = getMarkValue(
          finalSubjects["MATH"]?.marks
        ); // MATH
        sheet.getCell(`AM${insertRow}`).value = getMarkValue(
          finalSubjects["SCIENCE"]?.marks
        ); // SCIENCE
        sheet.getCell(`AN${insertRow}`).value = getMarkValue(
          finalSubjects["SOCIAL"]?.marks
        ); // SOCIAL
        sheet.getCell(`AO${insertRow}`).value = getMarkValue(
          finalSubjects["ART"]?.marks
        ); // ART
        sheet.getCell(`AP${insertRow}`).value = getMarkValue(
          finalSubjects["LIFESKILLS"]?.marks
        ); // LIFESKILLS
        sheet.getCell(`AQ${insertRow}`).value = getMarkValue(
          finalSubjects["PE"]?.marks
        ); // PE
        sheet.getCell(`AR${insertRow}`).value = getMarkValue(
          finalSubjects["ETHICS"]?.marks
        ); // ETHICS

        // Final exam attendance (AU to AY columns)
        sheet.getCell(`AU${insertRow}`).value = getMarkValue(
          finalStudent?.attendance?.totalDays
        );
        sheet.getCell(`AV${insertRow}`).value = getMarkValue(
          finalStudent?.attendance?.present
        );
        sheet.getCell(`AW${insertRow}`).value = getMarkValue(
          finalStudent?.attendance?.absent
        );
        sheet.getCell(`AX${insertRow}`).value = getMarkValue(
          finalStudent?.attendance?.sick
        );
        sheet.getCell(`AY${insertRow}`).value = getMarkValue(
          finalStudent?.attendance?.leave
        );
      });

      workbook.calcProperties.fullCalcOnLoad = true;
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer]),
        `GradeReport_${selectedClass?.name || "Class"}_${
          new Date().toISOString().split("T")[0]
        }.xlsx`
      );

      console.log("Excel export completed successfully!");
    } catch (error) {
      console.error("Excel Error:", error);
      alert(t("teacherPortal.exams.exportError"));
    }
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('teacherPortal.exams.loading')}</p>
        </div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <span className="material-icons text-6xl text-gray-400 mb-4">
            school
          </span>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {t("teacherPortal.exams.noClassesAssigned")}
          </h2>
          <p className="text-gray-600">
            {t("teacherPortal.exams.noClassesMessage")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header - Fixed */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="material-icons text-blue-600 text-3xl">grade</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {t("teacherPortal.exams.title")}{" "}
            </h1>
            <p className="text-sm text-gray-600">
              {t("teacherPortal.exams.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Selection Panel - Fixed */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Class Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("teacherPortal.exams.selectClassLabel")}
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => handleSelectClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.code ? `(${cls.code})` : ""} -{" "}
                  {cls.section || "All"}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Type Selector - Excel Pattern */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("teacherPortal.exams.selectExamTypeLabel")}
            </label>
            <select
              value={selectedExamType}
              onChange={(e) =>
                setSelectedExamType(e.target.value as "MIDTERM" | "FINAL")
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            >
              {examTypes.map((examType) => (
                <option key={examType.value} value={examType.value}>
                  {examType.labelEn}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {selectedExamType === "MIDTERM"
                ? "چهارونیم ماهه (4.5 months)"
                : "امتحان سالانه (Annual)"}
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("teacherPortal.exams.exportLable")}
            </label>
            <button
              className="bg-green-500 border-sm px-4 py-2 rounded-lg text-white w-full"
              onClick={exportToExcel}
            >
              {t("teacherPortal.exams.export")}
            </button>
          </div>
        </div>
      </div>

      {/* Teacher Assignments Overview */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {t("teacherPortal.exams.assignedClasses")}
            </h3>
            <p className="text-sm text-gray-600">
                {isAdmin
                  ? t('teacherPortal.exams.adminDescription')
                  : t('teacherPortal.exams.assignedClassdescription')}
              </p>
          </div>
          {/* Only show Admin Forms button for admins */}
          {isAdmin && (
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                className={`px-4 py-2 text-sm font-semibold transition ${
                  activeWorkbookSheet === "grades"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setActiveWorkbookSheet("grades")}
                >
                  {t("teacherPortal.exams.gradeEntry")}
                </button>
                <button
                  className={`px-4 py-2 text-sm font-semibold transition ${
                    activeWorkbookSheet === "adminForms"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    // When switching to admin forms, ensure we have a default subject
                    if (isAdmin) {
                      const currentClass =
                        classes.find((c) => c.id === selectedClassId) ||
                        classes[0];
                      if (
                        currentClass &&
                        Array.isArray(currentClass.subjects) &&
                        currentClass.subjects.length > 0 &&
                        !selectedSubjectId
                      ) {
                        setSelectedSubjectId(currentClass.subjects[0].id);
                      }
                    }
                    setActiveWorkbookSheet("adminForms");
                  }}
                >
                  {t("teacherPortal.exams.adminForms")}
                </button>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((cls) => {
            const isActiveClass = cls.id === selectedClassId;
            return (
              <div
                key={cls.id}
                className={`border rounded-xl p-4 transition shadow-sm ${
                  isActiveClass
                    ? "border-blue-400 ring-2 ring-blue-100 bg-blue-50/30"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      {t("teacherPortal.exams.class")}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {cls.name} {cls.code ? `(${cls.code})` : ""}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t('teacherPortal.exams.section')} {cls.section || t('teacherPortal.exams.allSections')} · {cls.studentCount}{" "}
                      {t("teacherPortal.exams.students")}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      className="px-3 py-1 text-xs font-semibold rounded-full border border-blue-500 text-blue-600 hover:bg-blue-50 transition"
                      onClick={() => handleSelectClass(cls.id)}
                    >
                      {t("teacherPortal.exams.gradebook")}
                    </button>
                    {/* Only show Admin Form button for admins */}
                    {isAdmin && (
                      <button
                        className="px-3 py-1 text-xs font-semibold rounded-full border border-emerald-500 text-emerald-600 hover:bg-emerald-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => {
                          if (cls.subjects[0]) {
                            handleSelectSubject(cls.id, cls.subjects[0].id);
                          }
                        }}
                        disabled={cls.subjects.length === 0}
                      >
                        {t("teacherPortal.exams.adminForms")}
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase font-semibold text-gray-500 mb-2">
                    {t("teacherPortal.exams.subjects")}
                  </p>
                  {cls.subjects.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      {t("teacherPortal.exams.noSubjectsAssigned")}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {cls.subjects.map((subject) => {
                        const isActiveSubject =
                          isActiveClass && subject.id === selectedSubjectId;
                        return (
                          <button
                            key={subject.id}
                            onClick={() =>
                              handleSelectSubject(cls.id, subject.id)
                            }
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                              isActiveSubject
                                ? "bg-blue-600 text-white shadow"
                                : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300"
                            }`}
                          >
                            {subject.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Class Info Card - Fixed */}
      {selectedClass && (
        <div className="mx-6 mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4 shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              {t("teacherPortal.exams.classInfo")}
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">{t("teacherPortal.exams.class")}</p>
              <p className="text-base font-semibold text-gray-800">
                {selectedClass.name}{" "}
                {selectedClass.code ? `(${selectedClass.code})` : ""}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">{t('teacherPortal.exams.level')}</p>
              <p className="text-base font-semibold text-gray-800">
                {selectedClass.level}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">{t('teacherPortal.exams.section')}</p>
              <p className="text-base font-semibold text-gray-800">
                {selectedClass.section || "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">{t('teacherPortal.exams.students')}</p>
              <p className="text-base font-semibold text-gray-800">
                {selectedClass.studentCount}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              {t("teacherPortal.exams.subjects")}
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedClass.subjects.map((subject) => {
                const isActiveSubject = subject.id === selectedSubjectId;
                return (
                  <button
                    key={subject.id}
                    onClick={() =>
                      handleSelectSubject(selectedClass.id, subject.id)
                    }
                    className={`px-3 py-1 text-sm font-semibold rounded-full transition ${
                      isActiveSubject
                        ? "bg-blue-600 text-white shadow"
                        : "bg-gray-100 text-gray-700 hover:bg-blue-50"
                    }`}
                  >
                    {subject.name}
                  </button>
                );
              })}
            </div>

            {/* Only show Admin Form Focus for admins */}
            {selectedSubject && isAdmin && (
              <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-900">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <span className="material-icons text-base text-blue-500">
                    task
                  </span>
                  {t("teacherPortal.exams.adminFormFocus")}
                </div>
                <p>
                  {t("teacherPortal.exams.adminFormMessage1")}{" "}
                  <span className="font-semibold">{selectedSubject.name}</span>{" "}
                  ({selectedExamType === "MIDTERM" ? t("teacherPortal.exams.midterm") : t("teacherPortal.exams.final")}).
                  {t("teacherPortal.exams.adminFormMessage2")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Excel Workbook with 12 Worksheets - Page Scrollable */}
      {selectedClassId && selectedExamType ? (
        <ExcelWorkbook
          classId={selectedClassId}
          examType={selectedExamType}
          editable={isAdmin}
          initialSheet={activeWorkbookSheet}
          selectedSubjectName={
            selectedSubject?.name || selectedSubject?.code || null
          }
        />
      ) : (
        <div className="flex items-center justify-center min-h-[400px] bg-white">
          <div className="text-center p-12">
            <span className="material-icons text-8xl text-gray-300 mb-4">
              description
            </span>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {t("teacherPortal.exams.selectClassAndExamType")}
            </h3>
            <p className="text-gray-500">
              {t("teacherPortal.exams.selectClassAndExamTypeMessage")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherGradeEntryScreen;
