import prisma from '../utils/prismaClient.js';

/**
 * Attendance Calculator for Excel Grade System
 * Calculates the 5 attendance metrics from existing Attendance records
 */
class AttendanceCalculator {
  
  /**
   * Calculate attendance statistics for a student
   * Returns Excel-like metrics: Total Days, Present, Absent, Sick, Leave
   */
  async calculateStudentAttendance(studentId, startDate = null, endDate = null) {
    try {
      const where = {
        studentId: studentId,
        deletedAt: null
      };

      // Add date range if provided
      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      // Get all attendance records
      const attendanceRecords = await prisma.attendance.findMany({
        where,
        orderBy: { date: 'asc' }
      });

      // Excel formula: COUNT - Total days
      const totalDays = attendanceRecords.length;

      // Excel formula: COUNTIF - Count by status
      const presentDays = attendanceRecords.filter(a => a.status === 'PRESENT').length;
      const absentDays = attendanceRecords.filter(a => a.status === 'ABSENT').length;
      const sickDays = attendanceRecords.filter(a => a.status === 'EXCUSED' && a.remarks?.includes('sick')).length;
      const leaveDays = attendanceRecords.filter(a => a.status === 'EXCUSED' && !a.remarks?.includes('sick')).length;

      // Excel formula: Calculate percentages
      const presentPercentage = totalDays > 0 ? (presentDays / totalDays * 100).toFixed(2) : '0';
      const absentPercentage = totalDays > 0 ? (absentDays / totalDays * 100).toFixed(2) : '0';

      // Excel IF formula: Determine if student is محروم (Deprived) - default is 99 days
      const deprivationThreshold = 99; // From Excel: ایام محرومی صنف مربوطه
      const isDeprived = absentDays >= deprivationThreshold;

      return {
        totalDays,          // ایام سال تعلیمی
        presentDays,        // حاضر
        absentDays,         // غیرحاضر
        sickDays,           // مریض
        leaveDays,          // رخصت
        presentPercentage,
        absentPercentage,
        isDeprived,         // محروم status
        deprivationDays: deprivationThreshold
      };

    } catch (error) {
      console.error('Error calculating attendance:', error);
      throw error;
    }
  }

  /**
   * Calculate attendance for entire class
   */
  async calculateClassAttendance(classId, startDate = null, endDate = null) {
    try {
      // Get all students in class
      const students = await prisma.student.findMany({
        where: {
          classId: classId,
          deletedAt: null,
          user: {
            status: 'ACTIVE'
          }
        },
        select: {
          id: true,
          admissionNo: true,
          rollNo: true,
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Calculate attendance for each student
      const attendanceData = await Promise.all(
        students.map(async (student) => {
          const stats = await this.calculateStudentAttendance(student.id, startDate, endDate);
          return {
            studentId: student.id.toString(),
            studentName: `${student.user.firstName} ${student.user.lastName}`,
            rollNo: student.rollNo,
            admissionNo: student.admissionNo,
            ...stats
          };
        })
      );

      // Excel AVERAGE formula: Calculate class averages
      const totalStudents = attendanceData.length;
      const avgPresent = attendanceData.reduce((sum, s) => sum + s.presentDays, 0) / totalStudents;
      const avgAbsent = attendanceData.reduce((sum, s) => sum + s.absentDays, 0) / totalStudents;
      const deprivedCount = attendanceData.filter(s => s.isDeprived).length;

      return {
        students: attendanceData,
        classStats: {
          totalStudents,
          averagePresentDays: avgPresent.toFixed(2),
          averageAbsentDays: avgAbsent.toFixed(2),
          deprivedStudents: deprivedCount,
          classAttendanceRate: totalStudents > 0 
            ? ((avgPresent / (avgPresent + avgAbsent)) * 100).toFixed(2) 
            : '0'
        }
      };

    } catch (error) {
      console.error('Error calculating class attendance:', error);
      throw error;
    }
  }

  /**
   * Get attendance for Excel grade sheet display
   */
  async getAttendanceForGradeSheet(classId) {
    try {
      const data = await this.calculateClassAttendance(classId);
      
      // Format for Excel-like display
      const attendanceMap = {};
      data.students.forEach(student => {
        attendanceMap[student.studentId] = {
          totalDays: student.totalDays,
          present: student.presentDays,
          absent: student.absentDays,
          sick: student.sickDays,
          leave: student.leaveDays,
          percentage: student.presentPercentage,
          isDeprived: student.isDeprived
        };
      });

      return attendanceMap;
    } catch (error) {
      console.error('Error getting attendance for grade sheet:', error);
      return {};
    }
  }
}

export default new AttendanceCalculator();




