import { PrismaClient } from '../generated/prisma/index.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

class AcademicYearService {
  /**
   * Initialize a new academic year
   */
  async initializeNewYear(schoolId, academicSessionData, createdBy) {
    try {
      const { name, startDate, endDate, description } = academicSessionData;

      // Create new academic session
      const newSession = await prisma.academicSession.create({
        data: {
          name,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          description,
          isCurrent: false, // Don't make it current automatically
          schoolId: BigInt(schoolId),
          createdBy: BigInt(createdBy),
        },
      });

      logger.info(`Created new academic session: ${name} (ID: ${newSession.id})`);

      return newSession;
    } catch (error) {
      logger.error('Error initializing new academic year:', error);
      throw error;
    }
  }

  /**
   * Set an academic session as the current one
   */
  async setCurrentSession(schoolId, academicSessionId) {
    try {
      // Unset any existing current session
      await prisma.academicSession.updateMany({
        where: {
          schoolId: BigInt(schoolId),
          isCurrent: true,
        },
        data: {
          isCurrent: false,
        },
      });

      // Set new current session
      const session = await prisma.academicSession.update({
        where: { id: BigInt(academicSessionId) },
        data: { isCurrent: true },
      });

      // Update school's current session reference
      await prisma.school.update({
        where: { id: BigInt(schoolId) },
        data: { academicSessionId: BigInt(academicSessionId) },
      });

      logger.info(`Set academic session ${academicSessionId} as current for school ${schoolId}`);

      return session;
    } catch (error) {
      logger.error('Error setting current session:', error);
      throw error;
    }
  }

  /**
   * Close/complete an academic year
   */
  async closeAcademicYear(schoolId, academicSessionId) {
    try {
      // Update all ENROLLED enrollments to COMPLETED
      const result = await prisma.studentEnrollment.updateMany({
        where: {
          schoolId: BigInt(schoolId),
          academicSessionId: BigInt(academicSessionId),
          status: 'ENROLLED',
        },
        data: {
          status: 'COMPLETED',
          remarks: 'Academic year completed',
        },
      });

      // Mark session as not current
      await prisma.academicSession.update({
        where: { id: BigInt(academicSessionId) },
        data: { isCurrent: false },
      });

      logger.info(`Closed academic year ${academicSessionId}: ${result.count} enrollments completed`);

      return {
        enrollmentsCompleted: result.count,
      };
    } catch (error) {
      logger.error('Error closing academic year:', error);
      throw error;
    }
  }

  /**
   * Get students needing promotion
   */
  async getStudentsNeedingPromotion(schoolId, currentSessionId) {
    try {
      // Get all students with active status but not enrolled in current session
      const students = await prisma.student.findMany({
        where: {
          schoolId: BigInt(schoolId),
          deletedAt: null,
          classId: { not: null },
          user: {
            status: 'ACTIVE'
          }
        },
        include: {
          user: true,
          class: true,
          section: true,
          enrollments: {
            where: {
              academicSessionId: BigInt(currentSessionId),
            },
          },
        },
      });

      // Filter students without enrollment in current session
      const needingPromotion = students.filter(
        (student) => student.enrollments.length === 0
      );

      // Group by current class for easier bulk promotion
      const groupedByClass = needingPromotion.reduce((acc, student) => {
        const classId = student.classId.toString();
        if (!acc[classId]) {
          acc[classId] = {
            class: student.class,
            students: [],
          };
        }
        acc[classId].students.push(student);
        return acc;
      }, {});

      return {
        total: needingPromotion.length,
        students: needingPromotion,
        groupedByClass: Object.values(groupedByClass),
      };
    } catch (error) {
      logger.error('Error getting students needing promotion:', error);
      throw error;
    }
  }

  /**
   * Get academic year statistics
   */
  async getAcademicYearStats(schoolId, academicSessionId) {
    try {
      const [
        totalEnrollments,
        enrolledCount,
        promotedCount,
        completedCount,
        withdrawnCount,
        repeatedCount,
        classCounts,
      ] = await Promise.all([
        // Total enrollments
        prisma.studentEnrollment.count({
          where: {
            schoolId: BigInt(schoolId),
            academicSessionId: BigInt(academicSessionId),
          },
        }),
        // Enrolled status
        prisma.studentEnrollment.count({
          where: {
            schoolId: BigInt(schoolId),
            academicSessionId: BigInt(academicSessionId),
            status: 'ENROLLED',
          },
        }),
        // Promoted status
        prisma.studentEnrollment.count({
          where: {
            schoolId: BigInt(schoolId),
            academicSessionId: BigInt(academicSessionId),
            status: 'PROMOTED',
          },
        }),
        // Completed status
        prisma.studentEnrollment.count({
          where: {
            schoolId: BigInt(schoolId),
            academicSessionId: BigInt(academicSessionId),
            status: 'COMPLETED',
          },
        }),
        // Withdrawn status
        prisma.studentEnrollment.count({
          where: {
            schoolId: BigInt(schoolId),
            academicSessionId: BigInt(academicSessionId),
            status: 'WITHDRAWN',
          },
        }),
        // Repeated status
        prisma.studentEnrollment.count({
          where: {
            schoolId: BigInt(schoolId),
            academicSessionId: BigInt(academicSessionId),
            status: 'REPEATED',
          },
        }),
        // Enrollments by class
        prisma.studentEnrollment.groupBy({
          by: ['classId'],
          where: {
            schoolId: BigInt(schoolId),
            academicSessionId: BigInt(academicSessionId),
          },
          _count: true,
        }),
      ]);

      // Get class details for grouping
      const classDetails = await Promise.all(
        classCounts.map(async (item) => {
          const classData = await prisma.class.findUnique({
            where: { id: item.classId },
            select: { id: true, name: true, level: true },
          });
          return {
            class: classData,
            count: item._count,
          };
        })
      );

      return {
        total: totalEnrollments,
        byStatus: {
          enrolled: enrolledCount,
          promoted: promotedCount,
          completed: completedCount,
          withdrawn: withdrawnCount,
          repeated: repeatedCount,
        },
        byClass: classDetails,
      };
    } catch (error) {
      logger.error('Error getting academic year stats:', error);
      throw error;
    }
  }

  /**
   * Get all academic sessions for a school
   */
  async getAcademicSessions(schoolId, options = {}) {
    try {
      const { includeStats = false, orderBy = 'desc' } = options;

      const sessions = await prisma.academicSession.findMany({
        where: {
          schoolId: BigInt(schoolId),
          deletedAt: null,
        },
        orderBy: { startDate: orderBy },
      });

      if (includeStats) {
        // Add enrollment stats for each session
        const sessionsWithStats = await Promise.all(
          sessions.map(async (session) => {
            const stats = await this.getAcademicYearStats(schoolId, session.id);
            return {
              ...session,
              stats,
            };
          })
        );
        return sessionsWithStats;
      }

      return sessions;
    } catch (error) {
      logger.error('Error getting academic sessions:', error);
      throw error;
    }
  }

  /**
   * Get all academic sessions from all schools (for superadmins)
   */
  async getAllAcademicSessions(options = {}) {
    try {
      const { includeStats = false, orderBy = 'desc' } = options;

      const sessions = await prisma.academicSession.findMany({
        where: {
          deletedAt: null,
        },
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { startDate: orderBy },
      });

      if (includeStats) {
        // Add enrollment stats for each session
        const sessionsWithStats = await Promise.all(
          sessions.map(async (session) => {
            const stats = await this.getAcademicYearStats(Number(session.schoolId), session.id);
            return {
              ...session,
              stats,
            };
          })
        );
        return sessionsWithStats;
      }

      return sessions;
    } catch (error) {
      logger.error('Error getting all academic sessions:', error);
      throw error;
    }
  }

  /**
   * Get current academic session for a school
   */
  async getCurrentSession(schoolId) {
    try {
      const school = await prisma.school.findUnique({
        where: { id: BigInt(schoolId) },
        include: {
          academicSessions: {
            where: { isCurrent: true },
            take: 1,
          },
        },
      });

      return school?.academicSessions?.[0] || null;
    } catch (error) {
      logger.error('Error getting current session:', error);
      throw error;
    }
  }

  /**
   * Suggest next class for promotion based on class level
   */
  async suggestNextClass(currentClassId, schoolId) {
    try {
      const currentClass = await prisma.class.findUnique({
        where: { id: BigInt(currentClassId) },
      });

      if (!currentClass) {
        return null;
      }

      // Find class with next level
      const nextClass = await prisma.class.findFirst({
        where: {
          schoolId: BigInt(schoolId),
          level: currentClass.level + 1,
          deletedAt: null,
        },
        orderBy: { level: 'asc' },
      });

      return nextClass;
    } catch (error) {
      logger.error('Error suggesting next class:', error);
      throw error;
    }
  }

  /**
   * Clone fee structures from one academic year to another
   */
  async cloneFeeStructures(sourceSessionId, targetSessionId, schoolId, createdBy) {
    try {
      const sourceFeeStructures = await prisma.feeStructure.findMany({
        where: {
          schoolId: BigInt(schoolId),
          academicSessionId: BigInt(sourceSessionId),
          deletedAt: null,
        },
        include: {
          items: true,
        },
      });

      const cloned = [];

      for (const feeStructure of sourceFeeStructures) {
        const newFeeStructure = await prisma.feeStructure.create({
          data: {
            name: feeStructure.name,
            description: feeStructure.description,
            classId: feeStructure.classId,
            academicSessionId: BigInt(targetSessionId),
            isDefault: feeStructure.isDefault,
            schoolId: BigInt(schoolId),
            createdBy: BigInt(createdBy),
            items: {
              create: feeStructure.items.map((item) => ({
                name: item.name,
                amount: item.amount,
                isOptional: item.isOptional,
                dueDate: item.dueDate,
                schoolId: BigInt(schoolId),
                createdBy: BigInt(createdBy),
              })),
            },
          },
          include: {
            items: true,
          },
        });

        cloned.push(newFeeStructure);
      }

      logger.info(`Cloned ${cloned.length} fee structures from session ${sourceSessionId} to ${targetSessionId}`);

      return cloned;
    } catch (error) {
      logger.error('Error cloning fee structures:', error);
      throw error;
    }
  }
}

export default AcademicYearService;








