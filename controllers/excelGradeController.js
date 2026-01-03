import prisma from '../utils/prismaClient.js';
import { formatResponse, handleError, createAuditLog } from '../utils/responseUtils.js';
import logger from '../config/logger.js';
import attendanceCalculator from './attendanceCalculator.js';
import { createNotification } from '../services/notificationService.js';
import StudentEventService from '../services/studentEventService.js';

const EXCEL_EXAM_TYPES = ['MIDTERM', 'FINAL'];

async function ensureExamForClass(classId, examType, schoolId, userId) {
  let exam = await prisma.exam.findFirst({
    where: {
      classId: BigInt(classId),
      type: examType,
      schoolId: BigInt(schoolId),
      deletedAt: null
    }
  });

  if (!exam) {
    exam = await prisma.exam.create({
      data: {
        name: examType === 'MIDTERM' ? 'Mid-term Exam (چهارونیم ماهه)' : 'Final Exam (امتحان سالانه)',
        code: `${examType}_CLASS_${classId}`,
        type: examType,
        startDate: new Date(),
        endDate: new Date(),
        totalMarks: 100,
        passingMarks: 40,
        attendanceThreshold: 99,
        classId: BigInt(classId),
        schoolId: BigInt(schoolId),
        createdBy: userId
      }
    });
  }

  return exam;
}

class ExcelGradeController {
  
  /**
   * Get Excel-like grade sheet by exam TYPE (MIDTERM or FINAL)
   * Matches Excel pattern: just select midterm or final, no need to create exams
   */
  async getExcelGradeSheetByType(req, res) {
    try {
      const { classId, examType } = req.params;
      const { schoolId, id: userId } = req.user;

      // Validate exam type
      if (!EXCEL_EXAM_TYPES.includes(examType)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid exam type. Use MIDTERM or FINAL'));
      }

      const exam = await ensureExamForClass(classId, examType, schoolId, userId);

      // Now get the grade sheet using the exam
      req.params.examId = exam.id.toString();
      return this.getExcelGradeSheet(req, res);

    } catch (error) {
      logger.error('Get Excel grade sheet by type error:', error);
      handleError(res, error, 'get grade sheet by type');
    }
  }

  /**
   * Bulk grade entry by exam TYPE (Excel pattern)
   */
  async bulkGradeEntryByType(req, res) {
    try {
      const { classId, examType } = req.params;
      const { schoolId, id: userId } = req.user;

      // Validate exam type
      if (!EXCEL_EXAM_TYPES.includes(examType)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid exam type. Use MIDTERM or FINAL'));
      }

      const exam = await ensureExamForClass(classId, examType, schoolId, userId);

      // Now save grades using the exam
      req.params.examId = exam.id.toString();
      return this.bulkGradeEntry(req, res);

    } catch (error) {
      logger.error('Bulk grade entry by type error:', error);
      handleError(res, error, 'bulk grade entry by type');
    }
  }

  /**
   * Get student list header metadata (آمر مکتب، هیئت، etc.)
   */
  async getStudentListHeader(req, res) {
    try {
      const { classId, examType } = req.params;
      const { schoolId, id: userId } = req.user;

      if (!EXCEL_EXAM_TYPES.includes(examType)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid exam type. Use MIDTERM or FINAL'));
      }

      const exam = await ensureExamForClass(classId, examType, schoolId, userId);

      const header = await prisma.excelGradeHeader.findUnique({
        where: {
          classId_examType_schoolId: {
            classId: BigInt(classId),
            examType,
            schoolId: BigInt(schoolId)
          }
        }
      });

      const payload = {
        headerId: header ? header.id.toString() : null,
        classId: classId.toString(),
        examId: exam.id.toString(),
        examType,
        attendanceThreshold: exam.attendanceThreshold || 99,
        fields: header?.data || {}
      };

      res.json(formatResponse(true, payload, 'Student list header retrieved successfully'));
    } catch (error) {
      logger.error('Get student list header error:', error);
      handleError(res, error, 'get student list header');
    }
  }

  /**
   * Save student list header metadata
   */
  async saveStudentListHeader(req, res) {
    try {
      const { classId, examType } = req.params;
      const { schoolId, id: userId } = req.user;
      const { fields = {}, attendanceThreshold } = req.body || {};

      if (!EXCEL_EXAM_TYPES.includes(examType)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid exam type. Use MIDTERM or FINAL'));
      }

      const exam = await ensureExamForClass(classId, examType, schoolId, userId);

      if (typeof attendanceThreshold === 'number' && attendanceThreshold > 0) {
        await prisma.exam.update({
          where: { id: exam.id },
          data: {
            attendanceThreshold,
            updatedBy: userId
          }
        });
        exam.attendanceThreshold = attendanceThreshold;
      }

      const header = await prisma.excelGradeHeader.upsert({
        where: {
          classId_examType_schoolId: {
            classId: BigInt(classId),
            examType,
            schoolId: BigInt(schoolId)
          }
        },
        update: {
          data: fields,
          examId: exam.id,
          updatedBy: userId
        },
        create: {
          classId: BigInt(classId),
          examId: exam.id,
          examType,
          schoolId: BigInt(schoolId),
          data: fields,
          createdBy: userId,
          updatedBy: userId
        }
      });

      const payload = {
        headerId: header.id.toString(),
        classId: classId.toString(),
        examId: exam.id.toString(),
        examType,
        attendanceThreshold: exam.attendanceThreshold || 99,
        fields
      };

      res.json(formatResponse(true, payload, 'Student list header saved successfully'));
    } catch (error) {
      logger.error('Save student list header error:', error);
      handleError(res, error, 'save student list header');
    }
  }

  /**
   * Get Excel-like grade sheet for a class and exam
   * Matches the Excel "جدول نتایج" worksheet structure
   */
  async getExcelGradeSheet(req, res) {
    try {
      const { classId, examId } = req.params;
      const { schoolId } = req.user;

      // Get class with students and subjects
      const classData = await prisma.class.findFirst({
        where: {
          id: BigInt(classId),
          schoolId: BigInt(schoolId),
          deletedAt: null
        },
        include: {
          students: {
            where: { deletedAt: null },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            },
            orderBy: { rollNo: 'asc' }
          },
          subjects: {
            where: { deletedAt: null },
            orderBy: { code: 'asc' }
          }
        }
      });

      if (!classData) {
        return res.status(404).json(formatResponse(false, null, 'Class not found'));
      }

      // Get exam details
      const exam = await prisma.exam.findFirst({
        where: {
          id: BigInt(examId),
          schoolId: BigInt(schoolId),
          deletedAt: null
        }
      });

      if (!exam) {
        return res.status(404).json(formatResponse(false, null, 'Exam not found'));
      }

      // Get all grades for this class and exam
      // Note: Some grades may have null subjectId, we'll filter those out in JavaScript
      let allGrades;
      try {
        allGrades = await prisma.grade.findMany({
          where: {
            examId: BigInt(examId),
            studentId: {
              in: classData.students.map(s => s.id)
            },
            schoolId: BigInt(schoolId),
            deletedAt: null
          },
          include: {
            subject: true,
            student: true
          }
        });
      } catch (error) {
        // If Prisma fails due to null subjects, fetch without include and filter manually
        console.log('Grade fetch failed, trying without subject include:', error.message);
        const gradesWithoutSubject = await prisma.grade.findMany({
          where: {
            examId: BigInt(examId),
            studentId: {
              in: classData.students.map(s => s.id)
            },
            schoolId: BigInt(schoolId),
            deletedAt: null
          },
          include: {
            student: true
          }
        });
        
        // Manually fetch subjects for grades that have subjectId
        const gradesWithSubjectIds = gradesWithoutSubject.filter(g => g.subjectId);
        const subjectIds = [...new Set(gradesWithSubjectIds.map(g => g.subjectId))];
        
        const subjects = await prisma.subject.findMany({
          where: {
            id: { in: subjectIds }
          }
        });
        
        const subjectMap = new Map(subjects.map(s => [s.id.toString(), s]));
        
        // Add subjects to grades
        allGrades = gradesWithoutSubject.map(g => ({
          ...g,
          subject: g.subjectId ? subjectMap.get(g.subjectId.toString()) || null : null
        }));
      }
      
      // Filter out grades without valid subjects or with deleted subjects
      const validGrades = allGrades.filter(g => g.subjectId && g.subject && g.subject.deletedAt === null);

      // Get ALL unique subjects that have grades (Excel pattern - subjects come from entered marks)
      const allSubjects = [...new Map(validGrades.map(g => [g.subjectId.toString(), g.subject])).values()];

      // Get attendance data for all students (Excel attendance columns)
      const attendanceData = await attendanceCalculator.getAttendanceForGradeSheet(classId);

      // Build Excel-like structure
      const gradeSheet = {
        classInfo: {
          className: classData.name,
          classCode: classData.code,
          level: classData.level,
          section: classData.section,
          capacity: classData.capacity,
          shift: classData.shift
        },
        examInfo: {
          examId: exam.id.toString(),
          examName: exam.name,
          examType: exam.type,
          examCode: exam.code,
          startDate: exam.startDate,
          endDate: exam.endDate,
          totalMarks: exam.totalMarks,
          passingMarks: exam.passingMarks
        },
        // Use subjects from grades if no class subjects (Excel pattern)
        subjects: allSubjects.length > 0 
          ? allSubjects.map(subject => ({
              id: subject.id.toString(),
              name: subject.name,
              code: subject.code,
              creditHours: subject.creditHours
            }))
          : classData.subjects.map(subject => ({
          id: subject.id.toString(),
          name: subject.name,
          code: subject.code,
          creditHours: subject.creditHours
        })),
        students: classData.students.map((student, index) => {
          const studentGrades = validGrades.filter(g => g.studentId === student.id);
          
          // Calculate subject-wise marks (use allSubjects from grades - Excel pattern)
          // KEY BY SUBJECT CODE (not ID) for easier frontend matching
          const subjectMarks = {};
          const subjectsToUse = allSubjects.length > 0 ? allSubjects : classData.subjects;
          
          subjectsToUse.forEach(subject => {
            const grade = studentGrades.find(g => g.subjectId === subject.id);
            subjectMarks[subject.code] = {  // Use subject.code as key (e.g., "QURAN")
              marks: grade ? parseFloat(grade.marks) : null,
              isAbsent: grade ? grade.isAbsent : false,
              grade: grade ? grade.grade : null,
              remarks: grade ? grade.remarks : null
            };
          });

          // Excel Formula: ROW() - Auto numbering
          const rowNumber = index + 1;

          // Excel Formula: SUM - Calculate total marks
          const totalMarks = this.calculateSUM(Object.values(subjectMarks)
            .filter(m => m.marks !== null && !m.isAbsent)
            .map(m => m.marks));

          // Excel Formula: AVERAGE - Calculate average
          const averageMarks = this.calculateAVERAGE(Object.values(subjectMarks)
            .filter(m => m.marks !== null && !m.isAbsent)
            .map(m => m.marks));

          // Excel Formula: COUNT - Count subjects attempted
          const subjectsAttempted = this.calculateCOUNT(Object.values(subjectMarks)
            .filter(m => m.marks !== null && !m.isAbsent));

          // Excel Formula: COUNTIF - Count failed subjects
          const failedSubjects = this.calculateCOUNTIF(
            Object.values(subjectMarks),
            (m) => m.marks !== null && m.marks < parseFloat(exam.passingMarks)
          );

          // Get attendance for this student (Excel columns)
          const attendance = attendanceData[student.id.toString()] || {
            totalDays: 0,
            present: 0,
            absent: 0,
            sick: 0,
            leave: 0,
            percentage: '0',
            isDeprived: false
          };

          // Get special flag from any grade for this student (Excel row 10 flag)
          const studentGrade = studentGrades.find(g => g.studentId === student.id);
          const specialFlag = studentGrade ? (studentGrade.specialFlag || 0) : 0;

          // Excel Formula: IF - Determine status (considering attendance)
          const status = this.calculateStudentStatus(
            subjectMarks,
            parseFloat(exam.passingMarks),
            subjectsAttempted,
            failedSubjects,
            attendance.isDeprived,
            exam.type || 'FINAL', // Pass exam type (MIDTERM or FINAL)
            exam.attendanceThreshold || 99, // ایام محرومی (from database, default 99)
            specialFlag // Special flag from database (معذرتی, سه پارچه)
          );

          // Excel Formula: Calculate Grade Letter (Excel Row 39)
          // Get marks array for grade letter calculation
          const marksArray = Object.values(subjectMarks)
            .filter(m => m.marks !== null && !m.isAbsent)
            .map(m => m.marks);
          
          const gradeLetter = this.calculateLetterGrade(
            averageMarks, 
            exam.type || 'FINAL',
            status,
            marksArray
          );

          return {
            rowNumber, // Excel ROW() function
            studentId: student.id.toString(),
            admissionNo: student.admissionNo,
            rollNo: student.rollNo,
            cardNo: student.cardNo,
            name: `${student.user.firstName} ${student.user.lastName}`,
            fatherName: 'N/A', // Father name not in User model
            subjectMarks,
            totalMarks, // Excel SUM formula
            averageMarks, // Excel AVERAGE formula
            subjectsAttempted, // Excel COUNT formula
            failedSubjects, // Excel COUNTIF formula
            status, // Excel IF formulas
            gradeLetter, // Excel grade letter (الف، ب، ج، د، هـ)
            // Attendance columns (Excel pattern)
            attendance: {
              totalDays: attendance.totalDays,        // ایام سال تعلیمی
              presentDays: attendance.present,        // حاضر
              absentDays: attendance.absent,          // غیرحاضر
              sickDays: attendance.sick,              // مریض
              leaveDays: attendance.leave,            // رخصت
              attendancePercentage: attendance.percentage,
              isDeprived: attendance.isDeprived       // محروم
            }
          };
        })
      };

      // Calculate class statistics (Excel formulas at class level)
      const classStatistics = this.calculateClassStatistics(gradeSheet.students, exam);

      let headerData = {
        headerId: null,
        classId: classId.toString(),
        examId: exam.id.toString(),
        examType: exam.type,
        attendanceThreshold: exam.attendanceThreshold || 99,
        fields: {}
      };

      try {
        const headerRecord = await prisma.excelGradeHeader.findUnique({
          where: {
            classId_examType_schoolId: {
              classId: BigInt(classId),
              examType: exam.type,
              schoolId: BigInt(schoolId)
            }
          }
        });

        if (headerRecord) {
          headerData = {
            headerId: headerRecord.id.toString(),
            classId: classId.toString(),
            examId: (headerRecord.examId || exam.id).toString(),
            examType: exam.type,
            attendanceThreshold: exam.attendanceThreshold || 99,
            fields: headerRecord.data || {}
          };
        }
      } catch (headerError) {
        logger.warn('Failed to load excel grade header metadata:', headerError);
      }

      res.json(formatResponse(true, {
        ...gradeSheet,
        classStatistics,
        headerData
      }, 'Grade sheet retrieved successfully'));

    } catch (error) {
      logger.error('Get Excel grade sheet error:', error);
      handleError(res, error, 'get grade sheet');
    }
  }

  /**
   * Bulk entry of grades for entire class
   * Matches Excel bulk data entry pattern
   */
  async bulkGradeEntry(req, res) {
    try {
      const { classId, examId } = req.params;
      const { grades: gradeEntries } = req.body; // Array of {studentId, subjectId, marks, isAbsent}
      const { schoolId, id: userId } = req.user;

      // Validate class and exam
      const [classData, exam] = await Promise.all([
        prisma.class.findFirst({
          where: { id: BigInt(classId), schoolId: BigInt(schoolId), deletedAt: null }
        }),
        prisma.exam.findFirst({
          where: { id: BigInt(examId), schoolId: BigInt(schoolId), deletedAt: null }
        })
      ]);

      if (!classData || !exam) {
        return res.status(404).json(formatResponse(false, null, 'Class or Exam not found'));
      }

      // Bulk upsert grades (insert or update)
      const gradeOperations = gradeEntries.map(entry => {
        // Excel-like validation
        const marks = entry.isAbsent ? 0 : parseFloat(entry.marks);
        // Note: Grade letter will be calculated in getExcelGradeSheet with full context
        const grade = 'N/A'; // Placeholder - calculated dynamically with full student data

        return prisma.grade.upsert({
          where: {
            examId_studentId_subjectId: {
              examId: BigInt(examId),
              studentId: BigInt(entry.studentId),
              subjectId: BigInt(entry.subjectId)
            }
          },
          update: {
            marks,
            grade,
            isAbsent: entry.isAbsent || false,
            remarks: entry.remarks || null,
            updatedBy: userId,
            updatedAt: new Date()
          },
          create: {
            examId: BigInt(examId),
            studentId: BigInt(entry.studentId),
            subjectId: BigInt(entry.subjectId),
            marks,
            grade,
            isAbsent: entry.isAbsent || false,
            remarks: entry.remarks || null,
            schoolId: schoolId,
            // SCOPE FIX: Get branchId and courseId from entry data
            branchId: entry.branchId ? BigInt(entry.branchId) : null,
            courseId: entry.courseId ? BigInt(entry.courseId) : null,
            createdBy: userId
          }
        });
      });

      const results = await prisma.$transaction(gradeOperations);

      // ===== AUDIT LOGS, EVENTS & NOTIFICATIONS =====
      
      // Process each grade for audit, events, and notifications
      for (const grade of results) {
        try {
          // 1. Create audit log
          try {
            await createAuditLog({
              action: 'CREATE',
              entityType: 'Grade',
              entityId: grade.id,
              userId: BigInt(userId),
              schoolId: BigInt(schoolId),
              newData: JSON.stringify({
                studentId: grade.studentId.toString(),
                examId: grade.examId.toString(),
                subjectId: grade.subjectId.toString(),
                marks: grade.marks,
                grade: grade.grade,
                isAbsent: grade.isAbsent
              }),
              ipAddress: req.ip || 'unknown',
              userAgent: req.get('User-Agent') || 'unknown'
            });
          } catch (auditError) {
            console.error('❌ Failed to create audit log for grade:', auditError);
          }
          
          // 2. Get subject and student info for event and notification
          const [subject, student] = await Promise.all([
            prisma.subject.findUnique({
              where: { id: grade.subjectId },
              select: { name: true, code: true }
            }),
            prisma.student.findUnique({
              where: { id: grade.studentId },
              include: {
                user: true,
                parent: {
                  include: {
                    user: true
                  }
                }
              }
            })
          ]);
          
          if (!subject || !student) continue;
          
          // 3. Create student event
          try {
            const studentEventService = new StudentEventService();
            await studentEventService.createStudentExamGradeEvent(
              grade.studentId,
              {
                examId: grade.examId,
                subjectId: grade.subjectId,
                subject: subject.name,
                examType: exam.type,
                marks: grade.marks.toString(),
                totalMarks: exam.totalMarks.toString(),
                grade: grade.grade,
                isAbsent: grade.isAbsent,
                remarks: grade.remarks
              },
              BigInt(userId),
              BigInt(schoolId)
            );
          } catch (eventError) {
            console.error('❌ Failed to create student event for grade:', eventError);
          }
          
          // 4. Send notifications
          try {
            // Prepare recipients
            const recipients = [];
            if (student.userId) recipients.push(student.userId);
            if (student.parent?.userId) recipients.push(student.parent.userId);
            
            if (recipients.length === 0) continue;
            
            // Calculate percentage
            const percentage = (parseFloat(grade.marks) / parseFloat(exam.totalMarks)) * 100;
            const passingPercentage = (parseFloat(exam.passingMarks) / parseFloat(exam.totalMarks)) * 100;
            const isPassing = percentage >= passingPercentage;
            
            // Determine priority
            const priority = percentage < 40 ? 'HIGH' : 'NORMAL';
            
            // Send grade posted notification
            const studentName = `${student.user.firstName} ${student.user.lastName}`;
            const className = student.class?.name || '';
            const gradeEmoji = percentage >= 90 ? '🌟' : percentage >= 80 ? '⭐' : percentage >= 70 ? '👍' : percentage >= 40 ? '📝' : '⚠️';
            
            await createNotification({
              type: 'GRADE_POSTED',
              title: `${gradeEmoji} New Grade Posted`,
              message: `${studentName}${className ? ` (Class ${className})` : ''} scored ${grade.marks}/${exam.totalMarks} (${percentage.toFixed(1)}%) in ${subject.name} ${exam.type === 'MIDTERM' ? 'Midterm' : 'Final'} Exam${grade.isAbsent ? ' - Marked Absent' : ''}`,
              recipients,
              priority,
              schoolId: BigInt(schoolId),
              senderId: BigInt(userId),
              channels: ['IN_APP', 'PUSH'],
              entityType: 'grade',
              entityId: grade.id,
              metadata: JSON.stringify({
                studentId: grade.studentId.toString(),
                studentName,
                className,
                examId: grade.examId.toString(),
                examName: exam.name,
                examType: exam.type,
                subjectId: grade.subjectId.toString(),
                subjectName: subject.name,
                marks: grade.marks.toString(),
                totalMarks: exam.totalMarks.toString(),
                percentage: percentage.toFixed(2),
                grade: grade.grade,
                passingMarks: exam.passingMarks.toString(),
                isPassing,
                isAbsent: grade.isAbsent
              })
            });
            
              // Send special alert for failing grades
              if (!isPassing && !grade.isAbsent) {
                const studentName = `${student.user.firstName} ${student.user.lastName}`;
                const className = student.class?.name || '';
                const pointsNeeded = parseFloat(exam.passingMarks) - parseFloat(grade.marks);
                
                await createNotification({
                  type: 'WARNING',
                  title: '⚠️ Low Grade Alert - Action Required',
                  message: `${studentName}${className ? ` (Class ${className})` : ''} scored ${grade.marks}/${exam.totalMarks} (${percentage.toFixed(1)}%) in ${subject.name} ${exam.type} - Below passing grade of ${exam.passingMarks} (${passingPercentage.toFixed(1)}%). Needs ${pointsNeeded.toFixed(1)} more points. Please provide additional support.`,
                  recipients,
                  priority: 'HIGH',
                  schoolId: BigInt(schoolId),
                  senderId: BigInt(userId),
                  channels: ['IN_APP', 'SMS', 'PUSH'],
                  entityType: 'grade',
                  entityId: grade.id,
                  metadata: JSON.stringify({
                    studentId: grade.studentId.toString(),
                    studentName,
                    className,
                    subject: subject.name,
                    marks: grade.marks.toString(),
                    totalMarks: exam.totalMarks.toString(),
                    passingMarks: exam.passingMarks.toString(),
                    percentage: percentage.toFixed(2),
                    pointsNeeded: pointsNeeded.toFixed(1)
                  })
                });
              }
          } catch (notifError) {
            console.error('❌ Failed to send grade notification:', notifError);
          }
        } catch (gradeProcessError) {
          console.error('❌ Error processing grade for audit/notifications:', gradeProcessError);
        }
      }
      
      console.log(`✅ Processed ${results.length} grades for audit logs, events, and notifications`);

      // Serialize BigInt values for JSON response
      const serializedGrades = results.map(grade => ({
        ...grade,
        id: grade.id.toString(),
        studentId: grade.studentId.toString(),
        examId: grade.examId.toString(),
        subjectId: grade.subjectId.toString(),
        schoolId: grade.schoolId.toString(),
        createdBy: grade.createdBy.toString()
      }));

      res.json(formatResponse(true, {
        gradesEntered: results.length,
        grades: serializedGrades
      }, 'Grades entered successfully'));

    } catch (error) {
      logger.error('Bulk grade entry error:', error);
      handleError(res, error, 'bulk grade entry');
    }
  }

  /**
   * Generate Excel-like report card with personalized messages
   * Matches Excel "اطلاع نامه" worksheet
   */
  async generateReportCard(req, res) {
    try {
      const { studentId } = req.params;
      const { schoolId } = req.user;
      const { examType } = req.query; // 'midterm' or 'final'

      const student = await prisma.student.findFirst({
        where: {
          id: BigInt(studentId),
          schoolId: BigInt(schoolId),
          deletedAt: null,
          user: {
            status: 'ACTIVE'
          }
        },
        include: {
          user: true,
          class: {
            include: {
              subjects: true
            }
          }
        }
      });

      if (!student) {
        return res.status(404).json(formatResponse(false, null, 'Student not found'));
      }

      // Get student's grades
      const grades = await prisma.grade.findMany({
        where: {
          studentId: BigInt(studentId),
          schoolId: BigInt(schoolId),
          deletedAt: null,
          exam: examType ? {
            type: examType.toUpperCase()
          } : undefined
        },
        include: {
          exam: true,
          subject: true
        },
        orderBy: {
          exam: {
            startDate: 'desc'
          }
        }
      });

      // Group by exam
      const examResults = {};
      grades.forEach(grade => {
        const examId = grade.examId.toString();
        if (!examResults[examId]) {
          examResults[examId] = {
            exam: grade.exam,
            subjects: []
          };
        }
        examResults[examId].subjects.push({
          subject: grade.subject,
          marks: parseFloat(grade.marks),
          grade: grade.grade,
          isAbsent: grade.isAbsent,
          remarks: grade.remarks
        });
      });

      // Calculate overall status for each exam
      const reportCard = Object.entries(examResults).map(([examId, data]) => {
        const totalMarks = this.calculateSUM(data.subjects.map(s => s.marks));
        const averageMarks = this.calculateAVERAGE(data.subjects.map(s => s.marks));
        const subjectsAttempted = data.subjects.length;
        const failedSubjects = this.calculateCOUNTIF(
          data.subjects,
          (s) => s.marks < parseFloat(data.exam.passingMarks)
        );

        const status = this.calculateStudentStatus(
          data.subjects.reduce((acc, s) => ({
            ...acc,
            [s.subject.id]: { marks: s.marks, isAbsent: s.isAbsent }
          }), {}),
          parseFloat(data.exam.passingMarks),
          subjectsAttempted,
          failedSubjects,
          false, // isDeprived
          data.exam.type || 'FINAL', // examType
          99, // attendanceThreshold
          0 // specialFlag
        );

        // Excel IF formula: Personalized motivational message
        const message = this.generateMotivationalMessage(status);

        return {
          examId,
          examName: data.exam.name,
          examType: data.exam.type,
          examDate: data.exam.startDate,
          subjects: data.subjects,
          totalMarks,
          averageMarks,
          subjectsAttempted,
          failedSubjects,
          status,
          message // Excel formula-generated message
        };
      });

      res.json(formatResponse(true, {
        student: {
          id: student.id.toString(),
          name: `${student.user.firstName} ${student.user.lastName}`,
          fatherName: student.user.fatherName,
          admissionNo: student.admissionNo,
          rollNo: student.rollNo,
          class: student.class.name,
          section: student.class.section
        },
        reportCard
      }, 'Report card generated successfully'));

    } catch (error) {
      logger.error('Generate report card error:', error);
      handleError(res, error, 'generate report card');
    }
  }

  /**
   * Get results summary (Successful, Conditional, Failed lists)
   * Matches Excel "کامیاب", "مشروط", "ناکام و محروم" worksheets
   */
  async getResultsSummary(req, res) {
    try {
      const { classId } = req.params;
      const { examId } = req.query;
      const { schoolId } = req.user;

      // Get all students with their grades
      // Note: Some grades may have null subjectId, handle with try-catch
      let students;
      try {
        students = await prisma.student.findMany({
          where: {
            classId: BigInt(classId),
            schoolId: BigInt(schoolId),
            deletedAt: null,
            user: {
              status: 'ACTIVE'
            }
          },
          include: {
            user: true,
            grades: {
              where: {
                examId: examId ? BigInt(examId) : undefined,
                deletedAt: null
              },
              include: {
                subject: true,
                exam: true
              }
            }
          }
        });
      } catch (error) {
        // If Prisma fails due to null subjects, fetch without subject include
        console.log('Student grades fetch failed, trying without subject include:', error.message);
        const studentsWithoutSubject = await prisma.student.findMany({
          where: {
            classId: BigInt(classId),
            schoolId: BigInt(schoolId),
            deletedAt: null,
            user: {
              status: 'ACTIVE'
            }
          },
          include: {
            user: true,
            grades: {
              where: {
                examId: examId ? BigInt(examId) : undefined,
                deletedAt: null
              },
              include: {
                exam: true
              }
            }
          }
        });
        
        // Manually fetch subjects for grades that have subjectId
        const allGrades = studentsWithoutSubject.flatMap(s => s.grades);
        const gradesWithSubjectIds = allGrades.filter(g => g.subjectId);
        const subjectIds = [...new Set(gradesWithSubjectIds.map(g => g.subjectId))];
        
        const subjects = subjectIds.length > 0 ? await prisma.subject.findMany({
          where: {
            id: { in: subjectIds }
          }
        }) : [];
        
        const subjectMap = new Map(subjects.map(s => [s.id.toString(), s]));
        
        // Add subjects to grades
        students = studentsWithoutSubject.map(student => ({
          ...student,
          grades: student.grades.map(g => ({
            ...g,
            subject: g.subjectId ? subjectMap.get(g.subjectId.toString()) || null : null
          }))
        }));
      }
      
      // Filter out grades without valid subjects from each student
      students = students.map(student => ({
        ...student,
        grades: student.grades.filter(g => g.subjectId && g.subject && g.subject.deletedAt === null)
      }));

      // Categorize students using Excel COUNTIF logic
      const successful = []; // موفق / ارتقا صنف
      const conditional = []; // مشروط / معذرتی
      const failed = []; // ناکام / محروم

      students.forEach(student => {
        if (student.grades.length === 0) {
          failed.push(this.formatStudentSummary(student, 'محروم', 'No grades recorded'));
          return;
        }

        const exam = student.grades[0].exam;
        const totalMarks = this.calculateSUM(student.grades.map(g => parseFloat(g.marks)));
        const averageMarks = this.calculateAVERAGE(student.grades.map(g => parseFloat(g.marks)));
        const failedSubjects = this.calculateCOUNTIF(
          student.grades,
          (g) => parseFloat(g.marks) < parseFloat(exam.passingMarks)
        );

        const status = this.calculateStudentStatus(
          student.grades.reduce((acc, g) => ({
            ...acc,
            [g.subjectId]: { marks: parseFloat(g.marks), isAbsent: g.isAbsent }
          }), {}),
          parseFloat(exam.passingMarks),
          student.grades.length,
          failedSubjects,
          false, // isDeprived
          exam.type || 'FINAL', // examType
          99, // attendanceThreshold
          0 // specialFlag
        );

        const studentData = this.formatStudentSummary(student, status, null, totalMarks, averageMarks);

        // Excel COUNTIF logic: Categorize based on status
        if (status === 'ارتقا صنف' || status === 'موفق') {
          successful.push(studentData);
        } else if (status === 'مشروط' || status === 'معذرتی' || status === 'تلاش بیشتر') {
          conditional.push(studentData);
        } else {
          failed.push(studentData);
        }
      });

      res.json(formatResponse(true, {
        summary: {
          totalStudents: students.length,
          successful: successful.length,
          conditional: conditional.length,
          failed: failed.length
        },
        lists: {
          successful, // Excel "کامیاب" sheet
          conditional, // Excel "مشروط" sheet
          failed // Excel "ناکام و محروم" sheet
        }
      }, 'Results summary retrieved successfully'));

    } catch (error) {
      logger.error('Get results summary error:', error);
      handleError(res, error, 'get results summary');
    }
  }

  /**
   * Calculate class statistics
   * Implements Excel AVERAGE, COUNTIF formulas at class level
   */
  async calculateStatistics(req, res) {
    try {
      const { classId } = req.params;
      const { examId } = req.query;
      const { schoolId } = req.user;

      const grades = await prisma.grade.findMany({
        where: {
          examId: examId ? BigInt(examId) : undefined,
          student: {
            classId: BigInt(classId),
            schoolId: BigInt(schoolId)
          },
          deletedAt: null
        },
        include: {
          subject: true,
          student: true,
          exam: true
        }
      });

      if (grades.length === 0) {
        return res.json(formatResponse(true, {
          message: 'No grades found for this class'
        }, 'No data available'));
      }

      // Group by subject
      const subjectStats = {};
      grades.forEach(grade => {
        const subjectId = grade.subjectId.toString();
        if (!subjectStats[subjectId]) {
          subjectStats[subjectId] = {
            subject: grade.subject,
            marks: [],
            grades: []
          };
        }
        subjectStats[subjectId].marks.push(parseFloat(grade.marks));
        subjectStats[subjectId].grades.push(grade);
      });

      // Calculate Excel formulas for each subject
      const statistics = Object.entries(subjectStats).map(([subjectId, data]) => {
        const passingMarks = parseFloat(data.grades[0].exam.passingMarks);
        
        return {
          subjectId,
          subjectName: data.subject.name,
          subjectCode: data.subject.code,
          // Excel AVERAGE formula
          averageMarks: this.calculateAVERAGE(data.marks),
          // Excel MAX formula
          highestMarks: Math.max(...data.marks),
          // Excel MIN formula
          lowestMarks: Math.min(...data.marks),
          // Excel COUNT formula
          totalStudents: this.calculateCOUNT(data.marks),
          // Excel COUNTIF formula: Count passed
          passedCount: this.calculateCOUNTIF(data.marks, (m) => m >= passingMarks),
          // Excel COUNTIF formula: Count failed
          failedCount: this.calculateCOUNTIF(data.marks, (m) => m < passingMarks),
          // Calculate pass percentage
          passPercentage: (this.calculateCOUNTIF(data.marks, (m) => m >= passingMarks) / data.marks.length * 100).toFixed(2)
        };
      });

      res.json(formatResponse(true, {
        classId: classId.toString(),
        statistics
      }, 'Statistics calculated successfully'));

    } catch (error) {
      logger.error('Calculate statistics error:', error);
      handleError(res, error, 'calculate statistics');
    }
  }

  /**
   * Get teacher's classes with subjects for grade entry
   * Admins get ALL classes, Teachers get only their assigned classes
   */
  async getTeacherClasses(req, res) {
    try {
      const { id: userId, schoolId, role } = req.user;

      // Check if user is admin or teacher
      const isAdmin = role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN';

      if (isAdmin) {
        // ADMIN: Get ALL classes in the school with all subjects
        const allClasses = await prisma.class.findMany({
          where: {
            schoolId: schoolId,
            deletedAt: null
          },
          include: {
            students: {
              where: { deletedAt: null },
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            subjects: {
              where: { deletedAt: null }
            },
            classTeacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          },
          orderBy: {
            level: 'asc'
          }
        });

        const classes = allClasses.map(cls => ({
          id: cls.id.toString(),
          name: cls.name,
          code: cls.code,
          level: cls.level,
          section: cls.section,
          studentCount: cls.students.length,
          classTeacher: cls.classTeacher ? {
            name: `${cls.classTeacher.user.firstName} ${cls.classTeacher.user.lastName}`
          } : null,
          subjects: cls.subjects.map(subject => ({
            id: subject.id.toString(),
            name: subject.name,
            code: subject.code
          }))
        }));

        return res.json(formatResponse(true, {
          isAdmin: true,
          classes
        }, 'All classes retrieved successfully'));
      }

      // TEACHER: Get only assigned classes
      const teacher = await prisma.teacher.findFirst({
        where: {
          userId: userId,
          schoolId: schoolId,
          deletedAt: null
        }
      });

      if (!teacher) {
        return res.status(404).json(formatResponse(false, null, 'Teacher record not found'));
      }

      // Get teacher's classes and subjects
      const teacherClassSubjects = await prisma.teacherClassSubject.findMany({
        where: {
          teacherId: teacher.id,
          deletedAt: null
        },
        include: {
          class: {
            include: {
              students: {
                where: { deletedAt: null },
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              }
            }
          },
          subject: true
        },
        orderBy: {
          class: {
            level: 'asc'
          }
        }
      });

      // Group by class
      const classesMap = {};
      teacherClassSubjects.forEach(tcs => {
        const classId = tcs.classId.toString();
        if (!classesMap[classId]) {
          classesMap[classId] = {
            id: classId,
            name: tcs.class.name,
            code: tcs.class.code,
            level: tcs.class.level,
            section: tcs.class.section,
            studentCount: tcs.class.students.length,
            subjects: []
          };
        }
        classesMap[classId].subjects.push({
          id: tcs.subject.id.toString(),
          name: tcs.subject.name,
          code: tcs.subject.code
        });
      });

      const classes = Object.values(classesMap);

      res.json(formatResponse(true, {
        isAdmin: false,
        teacher: {
          id: teacher.id.toString(),
          employeeId: teacher.employeeId
        },
        classes
      }, 'Teacher classes retrieved successfully'));

    } catch (error) {
      logger.error('Get teacher classes error:', error);
      handleError(res, error, 'get teacher classes');
    }
  }

  /**
   * Calculate final results (mid-term + annual)
   * Implements Excel SUM formulas for combining exam results
   */
  async calculateFinalResults(req, res) {
    try {
      const { classId, midtermExamId, annualExamId } = req.body;
      const { schoolId } = req.user;

      // Get all students in class
      const students = await prisma.student.findMany({
        where: {
          classId: BigInt(classId),
          schoolId: BigInt(schoolId),
          deletedAt: null,
          user: {
            status: 'ACTIVE'
          }
        }
      });

      // Get grades for both exams
      const [midtermGrades, annualGrades] = await Promise.all([
        prisma.grade.findMany({
          where: {
            examId: BigInt(midtermExamId),
            studentId: { in: students.map(s => s.id) },
            deletedAt: null
          },
          include: { subject: true }
        }),
        prisma.grade.findMany({
          where: {
            examId: BigInt(annualExamId),
            studentId: { in: students.map(s => s.id) },
            deletedAt: null
          },
          include: { subject: true }
        })
      ]);

      // Calculate final results for each student
      const finalResults = students.map(student => {
        const studentMidterm = midtermGrades.filter(g => g.studentId === student.id);
        const studentAnnual = annualGrades.filter(g => g.studentId === student.id);

        const subjectResults = {};
        
        // Combine midterm and annual (Excel SUM formula)
        studentMidterm.forEach(midterm => {
          const annual = studentAnnual.find(a => a.subjectId === midterm.subjectId);
          const midtermMarks = parseFloat(midterm.marks);
          const annualMarks = annual ? parseFloat(annual.marks) : 0;
          
          // Excel SUM formula: midterm + annual
          const totalMarks = midtermMarks + annualMarks;
          
          subjectResults[midterm.subject.code] = {
            subjectId: midterm.subjectId.toString(),
            subjectName: midterm.subject.name,
            midtermMarks,
            annualMarks,
            totalMarks // Excel SUM
          };
        });

        // Calculate overall total and average
        const allTotals = Object.values(subjectResults).map(s => s.totalMarks);
        const overallTotal = this.calculateSUM(allTotals);
        const overallAverage = this.calculateAVERAGE(allTotals);

        return {
          studentId: student.id.toString(),
          admissionNo: student.admissionNo,
          rollNo: student.rollNo,
          subjectResults,
          overallTotal, // Excel SUM formula
          overallAverage // Excel AVERAGE formula
        };
      });

      res.json(formatResponse(true, {
        classId: classId.toString(),
        results: finalResults
      }, 'Final results calculated successfully'));

    } catch (error) {
      logger.error('Calculate final results error:', error);
      handleError(res, error, 'calculate final results');
    }
  }

  /**
   * Export to Excel format
   */
  async exportToExcel(req, res) {
    try {
      const { classId, examId } = req.params;
      // Implementation would use a library like ExcelJS to generate actual Excel file
      // For now, return the data structure
      
      const gradeSheet = await this.getExcelGradeSheet(req, res);
      
      res.json(formatResponse(true, {
        message: 'Excel export will be implemented with ExcelJS library',
        data: gradeSheet
      }, 'Export prepared'));

    } catch (error) {
      logger.error('Export to Excel error:', error);
      handleError(res, error, 'export to excel');
    }
  }

  // ==========================================
  // EXCEL FORMULA IMPLEMENTATIONS
  // ==========================================

  /**
   * Excel SUM formula
   */
  calculateSUM(values) {
    if (!Array.isArray(values) || values.length === 0) return 0;
    return values.reduce((sum, val) => sum + (val || 0), 0);
  }

  /**
   * Excel AVERAGE formula
   */
  calculateAVERAGE(values) {
    if (!Array.isArray(values) || values.length === 0) return 0;
    const validValues = values.filter(v => v !== null && v !== undefined);
    if (validValues.length === 0) return 0;
    return this.calculateSUM(validValues) / validValues.length;
  }

  /**
   * Excel COUNT formula
   */
  calculateCOUNT(values) {
    if (!Array.isArray(values)) return 0;
    return values.filter(v => v !== null && v !== undefined).length;
  }

  /**
   * Excel COUNTIF formula
   */
  calculateCOUNTIF(values, condition) {
    if (!Array.isArray(values)) return 0;
    return values.filter(condition).length;
  }

  /**
   * Excel ROW formula (auto-increment)
   */
  calculateROW(index) {
    return index + 1;
  }

  /**
   * Excel MIN formula
   */
  calculateMIN(values) {
    if (!Array.isArray(values) || values.length === 0) return 0;
    const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
    if (validValues.length === 0) return 0;
    return Math.min(...validValues);
  }

  /**
   * Excel MAX formula
   */
  calculateMAX(values) {
    if (!Array.isArray(values) || values.length === 0) return 0;
    const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
    if (validValues.length === 0) return 0;
    return Math.max(...validValues);
  }

  /**
   * Excel COUNTIFS formula (multi-condition count)
   */
  calculateCOUNTIFS(values, conditions) {
    if (!Array.isArray(values)) return 0;
    return values.filter(v => 
      conditions.every(condition => condition(v))
    ).length;
  }

  /**
   * Excel IF formulas: Calculate student status
   * EXACT MATCH to Excel formulas from row 38
   * Supports BOTH midterm and annual exam logic
   * 
   * MIDTERM Formula (Excel Col C38):
   * =IF(C10=1,"معذرتي",IF(AND(COUNT(C21:C35)>=1,C40=""),"",IF(AND(C40>0,(COUNT(C21:C35)=0)),"غایب",
   *   IF(COUNT(C21:C35)<1,"",IF(C37<20,"تلاش بیشتر",IF(MIN(C21:C35)<16,"تلاش بیشتر",
   *   IF(MAX(C21:C35)>=16,"موفق")))))))
   * 
   * ANNUAL Formula (Excel Col D38):
   * =IF(E42>=E9,"محروم",IF(E10=2,"معذرتی",IF(E10=3,"سه پارچه",IF(AND(COUNT(E21:E35)>=1,E40=""),"",
   *   IF(AND(E40>0,(COUNT(E21:E35)=0)),"تکرار صنف",IF(COUNT(E21:E35)<1,"",IF(E37<50,"تکرار صنف",
   *   IF(COUNTIFS(E21:E35,">=40")=COUNT(E21:E35),"ارتقا صنف",
   *   IF(COUNTIFS(E21:E35,"<40",E21:E35,">=0")>=4,"تکرار صنف",
   *   IF(COUNTIFS(E21:E35,"<40",E21:E35,">=0")<4,"مشروط"))))))))))
   */
  calculateStudentStatus(subjectMarks, passingMarks, subjectsAttempted, failedSubjects, isDeprived = false, examType = 'FINAL', attendanceThreshold = 99, specialFlag = 0) {
    // Get marks array from subjectMarks object
    const marks = Object.values(subjectMarks)
      .filter(m => m && m.marks !== null && !m.isAbsent)
      .map(m => m.marks);
    
    const totalMarks = this.calculateSUM(marks);
    const marksCount = marks.length;
    
    // Get absent days for محروم check (Excel: E42 >= E9)
    // isDeprived parameter indicates if absent days >= threshold
    
    if (examType === 'MIDTERM') {
      // MIDTERM LOGIC (Excel formula for چهارونیم ماهه)
      
      // Check معذرتی flag (Excel: C10=1)
      if (specialFlag === 1) {
        return 'معذرتي';
      }
      
      // Check if grades entered but total missing (Excel: COUNT>=1 AND total="")
      if (marksCount >= 1 && !totalMarks) {
        return ''; // Incomplete data
      }
      
      // Check if total exists but no grades (Excel: total>0 AND COUNT=0) - Absent
      if (totalMarks > 0 && marksCount === 0) {
        return 'غایب';
      }
      
      // Check if no data at all
      if (marksCount < 1) {
        return ''; // No data
      }
      
      // Check if total < 20 (Excel: C37<20)
      if (totalMarks < 20) {
        return 'تلاش بیشتر';
      }
      
      // Check if any subject < 16 (Excel: MIN(C21:C35)<16)
      if (this.calculateMIN(marks) < 16) {
        return 'تلاش بیشتر';
      }
      
      // Check if max grade >= 16 (Excel: MAX(C21:C35)>=16) - Pass
      if (this.calculateMAX(marks) >= 16) {
        return 'موفق';
      }
      
      return 'تلاش بیشتر'; // Default fail for midterm
      
    } else {
      // ANNUAL/FINAL LOGIC (Excel formula for سالانه)
      
      // Check attendance threshold FIRST (Excel: E42>=E9) - محروم
    if (isDeprived) {
        return 'محروم';
      }
      
      // Check معذرتی flag for annual (Excel: E10=2)
      if (specialFlag === 2) {
        return 'معذرتی';
      }
      
      // Check سه پارچه flag (Excel: E10=3)
      if (specialFlag === 3) {
        return 'سه پارچه';
      }
      
      // Check if grades entered but total missing
      if (marksCount >= 1 && !totalMarks) {
        return ''; // Incomplete data
      }
      
      // Check if total exists but no grades - Fail (Excel: total>0 AND COUNT=0)
      if (totalMarks > 0 && marksCount === 0) {
        return 'تکرار صنف';
      }
      
      // Check if no data at all
      if (marksCount < 1) {
        return ''; // No data
      }
      
      // Check if total < 50 (Excel: E37<50) - Complete fail
      if (totalMarks < 50) {
        return 'تکرار صنف';
      }
      
      // Check if ALL subjects >= 40 (Excel: COUNTIFS(E21:E35,">=40")=COUNT(E21:E35))
      const allPassed = marks.every(m => m >= 40);
      if (allPassed) {
      return 'ارتقا صنف'; // Promoted to next grade
    }

      // Count failed subjects < 40 (Excel: COUNTIFS(E21:E35,"<40",E21:E35,">=0"))
      const failedCount = marks.filter(m => m < 40 && m >= 0).length;
      
      // Check if 4+ subjects failed (Excel: failedCount >= 4)
      if (failedCount >= 4) {
        return 'تکرار صنف'; // Repeat grade
      }
      
      // Check if < 4 subjects failed (Excel: failedCount < 4)
      if (failedCount < 4 && failedCount > 0) {
      return 'مشروط'; // Conditional pass
    }

      return 'تکرار صنف'; // Default fail
    }
  }

  /**
   * Calculate letter grade - EXACT EXCEL FORMULAS
   * MIDTERM (C39): Based on average with < 16 check
   * ANNUAL (D39): Based on status and average
   */
  calculateLetterGrade(average, examType, status, marks) {
    if (examType === 'MIDTERM') {
      // Excel C39 formula:
      // =IF(COUNT(C21:C35)<1,"",IF(COUNTIFS(C21:C35,"<16")>0,"هـ",IF(C37<20,"هـ",IF(C37<24,"د",IF(C37<30,"ج",IF(C37<36,"ب",IF(C37<=40,"الف","اشتباه")))))))
      
      if (!marks || marks.length < 1) return ''; // No marks
      
      // Check if any subject < 16
      const hasFailingMark = marks.some(m => m < 16);
      if (hasFailingMark) return 'هـ';
      
      // Average-based grading
      if (average < 20) return 'هـ';
      if (average < 24) return 'د';
      if (average < 30) return 'ج';
      if (average < 36) return 'ب';
      if (average <= 40) return 'الف';
      return 'اشتباه'; // Error case
      
    } else {
      // ANNUAL/FINAL (Excel D39 formula):
      // =IF(D38="تکرار صنف","هـ",IF(COUNT(E21:E35)<1,"",IF(COUNTIFS(E21:E35,"<40")>0,"هـ",IF(E37<50,"هـ",IF(E37<60,"د",IF(E37<75,"ج",IF(E37<90,"ب",IF(E37<=100,"الف","اشتباه"))))))))
      
      if (status === 'تکرار صنف') return 'هـ'; // Failed status
      
      if (!marks || marks.length < 1) return ''; // No marks
      
      // Check if any subject < 40
      const hasFailingMark = marks.some(m => m < 40);
      if (hasFailingMark) return 'هـ';
      
      // Average-based grading
      if (average < 50) return 'هـ';
      if (average < 60) return 'د';
      if (average < 75) return 'ج';
      if (average < 90) return 'ب';
      if (average <= 100) return 'الف';
      return 'اشتباه'; // Error case
    }
  }

  /**
   * Save subject component marks (شقه sheet pattern)
   * Saves 4 mark components: تحریری, تقریری/عملی, فعالیت صنفی, کار خانگی
   * Excel pattern: One subject at a time, component breakdown
   */
  async saveSubjectComponentMarks(req, res) {
    try {
      const { classId, examType } = req.params;
      const { subjectId: subjectName, marks: studentMarks } = req.body;
      // studentMarks = [{studentId, written, practical, activity, homework}]
      const { schoolId, id: userId } = req.user;

      if (!subjectName || !studentMarks || !Array.isArray(studentMarks)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid request data'));
      }

      // Find or create subject by name/code (Excel pattern - subjects are predefined)
      let subject = await prisma.subject.findFirst({
        where: {
          OR: [
            { code: subjectName },
            { name: subjectName }
          ],
          schoolId: schoolId,
          deletedAt: null
        }
      });

      // If subject doesn't exist, create it automatically (Excel pattern)
      if (!subject) {
        subject = await prisma.subject.create({
          data: {
            name: subjectName,
            code: subjectName,
            description: `Auto-created for ${subjectName}`,
            creditHours: 3,
            schoolId: schoolId,
            createdBy: userId
          }
        });
      }

      const subjectId = subject.id;

      // Find or create exam
      let exam = await prisma.exam.findFirst({
        where: {
          classId: BigInt(classId),
          type: examType,
          schoolId: schoolId,
          deletedAt: null
        }
      });

      if (!exam) {
        exam = await prisma.exam.create({
          data: {
            name: examType === 'MIDTERM' ? 'Mid-term Exam (چهارونیم ماهه)' : 'Final Exam (امتحان سالانه)',
            code: `${examType}_CLASS_${classId}`,
            type: examType,
            startDate: new Date(),
            endDate: new Date(),
            totalMarks: 100,
            passingMarks: 40,
            attendanceThreshold: 99, // Excel ایام محرومی
            classId: BigInt(classId),
            schoolId: schoolId,
            createdBy: userId
          }
        });
      }

      // Process each student's component marks
      const gradeOperations = studentMarks
        .filter(entry => entry.written || entry.practical || entry.activity || entry.homework)
        .map(entry => {
          // Excel formula: مجموعه = تحریری + تقریری/عملی + فعالیت صنفی + کار خانگی
          const written = parseFloat(entry.written) || 0;
          const practical = parseFloat(entry.practical) || 0;
          const activity = parseFloat(entry.activity) || 0;
          const homework = parseFloat(entry.homework) || 0;
          const totalMarks = written + practical + activity + homework;

          // Note: Grade letter will be calculated in getExcelGradeSheet with full context
          const grade = 'N/A'; // Placeholder - calculated dynamically with full student data

          return prisma.grade.upsert({
            where: {
              examId_studentId_subjectId: {
                examId: BigInt(exam.id),
                studentId: BigInt(entry.studentId),
                subjectId: BigInt(subjectId)
              }
            },
            update: {
              marks: totalMarks,              // مجموعه (Total)
              marksWritten: written,          // تحریری
              marksPractical: practical,      // تقریری/عملی
              marksActivity: activity,        // فعالیت صنفی
              marksHomework: homework,        // کار خانگی
              grade,
              isAbsent: entry.isAbsent || false,
              specialFlag: entry.specialFlag || 0,
              remarks: `Written: ${written}, Practical: ${practical}, Activity: ${activity}, Homework: ${homework}`,
              updatedBy: userId,
              updatedAt: new Date()
            },
            create: {
              examId: BigInt(exam.id),
              studentId: BigInt(entry.studentId),
              subjectId: BigInt(subjectId),
              marks: totalMarks,              // مجموعه (Total)
              marksWritten: written,          // تحریری
              marksPractical: practical,      // تقریری/عملی
              marksActivity: activity,        // فعالیت صنفی
              marksHomework: homework,        // کار خانگی
              grade,
              isAbsent: entry.isAbsent || false,
              specialFlag: entry.specialFlag || 0,
              remarks: `Written: ${written}, Practical: ${practical}, Activity: ${activity}, Homework: ${homework}`,
              schoolId: schoolId,
              createdBy: userId
            }
          });
        });

      const results = await prisma.$transaction(gradeOperations);

      logger.info(`Saved ${results.length} component marks for subject ${subjectId}`);

      res.json(formatResponse(true, {
        gradesEntered: results.length,
        subject: subjectId.toString(),
        examType: examType
      }, `Successfully saved ${results.length} grades with component breakdown`));

    } catch (error) {
      logger.error('Save subject component marks error:', error);
      handleError(res, error, 'save subject component marks');
    }
  }

  /**
   * Get subject component marks (شقه sheet pattern)
   * Retrieves the breakdown: تحریری, تقریری/عملی, فعالیت صنفی, کار خانگی
   */
  async getSubjectComponentMarks(req, res) {
    try {
      const { classId, examType, subjectId: subjectName } = req.params;
      const { schoolId } = req.user;

      // Find or create subject by name/code (Excel pattern)
      let subject = await prisma.subject.findFirst({
        where: {
          OR: [
            { code: subjectName },
            { name: subjectName }
          ],
          schoolId: schoolId,
          deletedAt: null
        }
      });

      // If subject doesn't exist, create it automatically
      if (!subject) {
        subject = await prisma.subject.create({
          data: {
            name: subjectName,
            code: subjectName,
            description: `Auto-created for ${subjectName}`,
            creditHours: 3,
            schoolId: schoolId,
            createdBy: BigInt(1) // System user
          }
        });
      }

      const subjectId = subject.id;

      // Find exam
      const exam = await prisma.exam.findFirst({
        where: {
          classId: BigInt(classId),
          type: examType,
          schoolId: schoolId,
          deletedAt: null
        }
      });

      if (!exam) {
        return res.json(formatResponse(true, { students: [] }, 'No exam found'));
      }

      // Get class with students
      const classData = await prisma.class.findFirst({
        where: {
          id: BigInt(classId),
          schoolId: schoolId,
          deletedAt: null
        },
        include: {
          students: {
            where: { deletedAt: null },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  middleName: true
                }
              },
              parent: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              }
            },
            orderBy: { rollNo: 'asc' }
          }
        }
      });

      if (!classData) {
        return res.status(404).json(formatResponse(false, null, 'Class not found'));
      }

      // Get grades for this subject
      const grades = await prisma.grade.findMany({
        where: {
          examId: BigInt(exam.id),
          subjectId: BigInt(subjectId),
          schoolId: schoolId,
          deletedAt: null
        }
      });

      // Build student list with component marks
      const students = classData.students.map(student => {
        const grade = grades.find(g => g.studentId === student.id);
        
        // Use database columns directly (Excel pattern)
        const written = grade ? parseFloat(grade.marksWritten) || 0 : 0;
        const practical = grade ? parseFloat(grade.marksPractical) || 0 : 0;
        const activity = grade ? parseFloat(grade.marksActivity) || 0 : 0;
        const homework = grade ? parseFloat(grade.marksHomework) || 0 : 0;
        const total = grade ? parseFloat(grade.marks) || 0 : 0;
        const specialFlag = grade ? grade.specialFlag || 0 : 0;

        // Get father name from parent relation (نام پدر)
        const fatherName = student.parent?.user 
          ? `${student.parent.user.firstName} ${student.parent.user.lastName}`
          : '-';

        return {
          studentId: student.id.toString(),
          admissionNo: student.admissionNo,
          rollNo: student.rollNo,
          name: `${student.user.firstName} ${student.user.lastName}`,
          fatherName,       // نام پدر (from parent relation)
          written,          // تحریری
          practical,        // تقریری/عملی
          activity,         // فعالیت صنفی
          homework,         // کار خانگی
          total,            // مجموعه
          specialFlag       // Special status flag
        };
      });

      res.json(formatResponse(true, {
        classId: classId.toString(),
        examType,
        subjectId: subjectId.toString(),
        students
      }, 'Component marks retrieved successfully'));

    } catch (error) {
      logger.error('Get subject component marks error:', error);
      handleError(res, error, 'get subject component marks');
    }
  }

  /**
   * Excel IF formulas: Generate motivational message
   * Matches the personalized messages from Excel file
   */
  generateMotivationalMessage(status) {
    // Persian messages from Excel file
    const messages = {
      'ارتقا صنف': 'به دلیل اینکه از روند آموزشی یک ساله نتیجه مثبت به‌ دست اورده اید، این موفقیت را به شما و خانواده محترم شما تبریک عرض میداریم، ارزومندیم که در عرصه علمی بیشتر بدرخشید...!',
      'موفق': 'به دلیل اینکه از روند آموزشی نتیجه مثبت به‌ دست اورده اید، این موفقیت را به شما و خانواده محترم شما تبریک عرض میداریم، ارزومندیم که در عرصه علمی بیشتر بدرخشید...!',
      'مشروط': 'ناامید نشوید، تلاش کنید، حتماً موفق خواهید شد...!',
      'تلاش بیشتر': 'ناامید نشوید، تلاش کنید، حتماً موفق خواهید شد...!',
      'تکرار صنف': 'ناامید نشوید، تلاش کنید، حتماً موفق خواهید شد...!',
      'محروم': '',
      'معذرتی': ''
    };

    return messages[status] || '';
  }

  /**
   * Format student summary
   */
  formatStudentSummary(student, status, remarks, totalMarks = null, averageMarks = null) {
    return {
      studentId: student.id.toString(),
      admissionNo: student.admissionNo,
      rollNo: student.rollNo,
      name: `${student.user.firstName} ${student.user.lastName}`,
      fatherName: student.user.fatherName,
      status,
      totalMarks,
      averageMarks,
      remarks
    };
  }

  /**
   * Calculate class-level statistics
   */
  calculateClassStatistics(students, exam) {
    const allTotalMarks = students.map(s => s.totalMarks).filter(t => t !== null);
    const allAverageMarks = students.map(s => s.averageMarks).filter(a => a !== null);

    // Excel COUNTIF formulas for class statistics
    const successfulCount = this.calculateCOUNTIF(students, s => s.status === 'ارتقا صنف' || s.status === 'موفق');
    const conditionalCount = this.calculateCOUNTIF(students, s => s.status === 'مشروط' || s.status === 'معذرتی');
    const failedCount = this.calculateCOUNTIF(students, s => s.status === 'تکرار صنف' || s.status === 'محروم');

    return {
      totalStudents: students.length,
      // Excel AVERAGE formulas
      classAverageMarks: this.calculateAVERAGE(allAverageMarks),
      classTotalAverage: this.calculateAVERAGE(allTotalMarks),
      // Excel MAX/MIN formulas
      highestTotal: Math.max(...allTotalMarks),
      lowestTotal: Math.min(...allTotalMarks),
      // Excel COUNTIF formulas
      successfulCount,
      conditionalCount,
      failedCount,
      // Calculate percentages
      successPercentage: (successfulCount / students.length * 100).toFixed(2),
      conditionalPercentage: (conditionalCount / students.length * 100).toFixed(2),
      failPercentage: (failedCount / students.length * 100).toFixed(2)
    };
  }
}

export default new ExcelGradeController();

