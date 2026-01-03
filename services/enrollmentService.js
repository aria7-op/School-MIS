import { PrismaClient } from '../generated/prisma/index.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

class EnrollmentService {
  /**
   * Enroll a student in a class for an academic session
   */
  async enrollStudent(studentId, classId, academicSessionId, options = {}) {
    const {
      sectionId = null,
      rollNo = null,
      status = 'ENROLLED',
      remarks = null,
      createdBy,
      schoolId,
    } = options;

    try {
      // Validate student exists
      const student = await prisma.student.findUnique({
        where: { id: BigInt(studentId) },
        include: { class: true },
      });

      if (!student) {
        throw new Error('Student not found');
      }

      // Validate class exists and has capacity
      const targetClass = await prisma.class.findUnique({
        where: { id: BigInt(classId) },
        include: {
          _count: {
            select: {
              enrollments: {
                where: {
                  academicSessionId: BigInt(academicSessionId),
                  status: { in: ['ENROLLED', 'PROMOTED'] },
                },
              },
            },
          },
        },
      });

      if (!targetClass) {
        throw new Error('Class not found');
      }

      // Check capacity
      if (targetClass._count.enrollments >= targetClass.capacity) {
        throw new Error(`Class ${targetClass.name} is at full capacity`);
      }

      // Check for existing enrollment in this session
      const existingEnrollment = await prisma.studentEnrollment.findUnique({
        where: {
          studentId_academicSessionId: {
            studentId: BigInt(studentId),
            academicSessionId: BigInt(academicSessionId),
          },
        },
      });

      if (existingEnrollment) {
        throw new Error('Student already enrolled in this academic session');
      }

      // Create enrollment
      const enrollment = await prisma.studentEnrollment.create({
        data: {
          studentId: BigInt(studentId),
          classId: BigInt(classId),
          sectionId: sectionId ? BigInt(sectionId) : null,
          academicSessionId: BigInt(academicSessionId),
          rollNo,
          enrollmentDate: new Date(),
          status,
          remarks,
          schoolId: BigInt(schoolId),
          createdBy: BigInt(createdBy),
        },
        include: {
          student: { include: { user: true } },
          class: true,
          section: true,
          academicSession: true,
        },
      });

      // Update student's current class and section if this is current session
      const school = await prisma.school.findUnique({
        where: { id: BigInt(schoolId) },
        select: { academicSessionId: true },
      });

      if (school?.academicSessionId?.toString() === academicSessionId.toString()) {
        await prisma.student.update({
          where: { id: BigInt(studentId) },
          data: {
            classId: BigInt(classId),
            sectionId: sectionId ? BigInt(sectionId) : null,
            rollNo,
          },
        });
      }

      logger.info(`Enrolled student ${studentId} in class ${classId} for session ${academicSessionId}`);

      return enrollment;
    } catch (error) {
      logger.error('Error enrolling student:', error);
      throw error;
    }
  }

  /**
   * Bulk promote students to next academic year
   */
  async bulkPromote(promotionData, createdBy, schoolId) {
    const {
      studentIds,
      targetClassId,
      targetSectionId = null,
      academicSessionId,
      remarks = 'Bulk promotion',
    } = promotionData;

    try {
      const results = {
        successful: [],
        failed: [],
      };

      // Validate target class
      const targetClass = await prisma.class.findUnique({
        where: { id: BigInt(targetClassId) },
      });

      if (!targetClass) {
        throw new Error('Target class not found');
      }

      // Process each student
      for (const studentId of studentIds) {
        try {
          // Get student's previous enrollment
          const student = await prisma.student.findUnique({
            where: { id: BigInt(studentId) },
            include: {
              enrollments: {
                where: { status: 'ENROLLED' },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          });

          if (!student) {
            results.failed.push({ studentId, reason: 'Student not found' });
            continue;
          }

          // Update previous enrollment to PROMOTED
          if (student.enrollments.length > 0) {
            await prisma.studentEnrollment.update({
              where: { id: student.enrollments[0].id },
              data: { status: 'PROMOTED', remarks },
            });
          }

          // Create new enrollment for new academic year
          const enrollment = await this.enrollStudent(
            studentId,
            targetClassId,
            academicSessionId,
            {
              sectionId: targetSectionId,
              rollNo: student.rollNo,
              status: 'ENROLLED',
              remarks,
              createdBy,
              schoolId,
            }
          );

          results.successful.push({
            studentId,
            enrollmentId: enrollment.id,
            className: targetClass.name,
          });
        } catch (error) {
          results.failed.push({
            studentId,
            reason: error.message,
          });
          logger.error(`Failed to promote student ${studentId}:`, error);
        }
      }

      logger.info(`Bulk promotion completed: ${results.successful.length} successful, ${results.failed.length} failed`);

      return results;
    } catch (error) {
      logger.error('Error in bulk promotion:', error);
      throw error;
    }
  }

  /**
   * Get active enrollment for a student
   */
  async getActiveEnrollment(studentId) {
    try {
      const enrollment = await prisma.studentEnrollment.findFirst({
        where: {
          studentId: BigInt(studentId),
          status: 'ENROLLED',
        },
        include: {
          class: true,
          section: true,
          academicSession: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return enrollment;
    } catch (error) {
      logger.error('Error getting active enrollment:', error);
      throw error;
    }
  }

  /**
   * Get enrollment history for a student
   */
  async getEnrollmentHistory(studentId) {
    try {
      const enrollments = await prisma.studentEnrollment.findMany({
        where: { studentId: BigInt(studentId) },
        include: {
          class: true,
          section: true,
          academicSession: true,
        },
        orderBy: { enrollmentDate: 'desc' },
      });

      return enrollments;
    } catch (error) {
      logger.error('Error getting enrollment history:', error);
      throw error;
    }
  }

  /**
   * Get all enrollments for an academic session
   */
  async getEnrollmentsBySession(academicSessionId, filters = {}) {
    try {
      const where = {
        academicSessionId: BigInt(academicSessionId),
        ...filters,
      };

      const enrollments = await prisma.studentEnrollment.findMany({
        where,
        include: {
          student: {
            include: { user: true },
          },
          class: true,
          section: true,
          academicSession: true,
        },
        orderBy: [
          { class: { level: 'asc' } },
          { rollNo: 'asc' },
        ],
      });

      return enrollments;
    } catch (error) {
      logger.error('Error getting enrollments by session:', error);
      throw error;
    }
  }

  /**
   * Update enrollment status
   */
  async updateEnrollment(enrollmentId, updateData, updatedBy) {
    try {
      const enrollment = await prisma.studentEnrollment.update({
        where: { id: BigInt(enrollmentId) },
        data: {
          ...updateData,
          updatedBy: BigInt(updatedBy),
        },
        include: {
          student: { include: { user: true } },
          class: true,
          section: true,
          academicSession: true,
        },
      });

      // If status changed to WITHDRAWN, update student's current class to null if this was current enrollment
      if (updateData.status === 'WITHDRAWN') {
        const school = await prisma.school.findFirst({
          where: { id: enrollment.schoolId },
          select: { academicSessionId: true },
        });

        if (school?.academicSessionId?.toString() === enrollment.academicSessionId.toString()) {
          await prisma.student.update({
            where: { id: enrollment.studentId },
            data: {
              classId: null,
              sectionId: null,
            },
          });
        }
      }

      logger.info(`Updated enrollment ${enrollmentId}`);

      return enrollment;
    } catch (error) {
      logger.error('Error updating enrollment:', error);
      throw error;
    }
  }

  /**
   * Get students needing promotion (not enrolled in current session)
   */
  async getStudentsNeedingPromotion(schoolId, currentSessionId) {
    try {
      // Get all active students
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

      return needingPromotion;
    } catch (error) {
      logger.error('Error getting students needing promotion:', error);
      throw error;
    }
  }

  /**
   * Validate enrollment data
   */
  async validateEnrollment(studentId, classId, academicSessionId) {
    const errors = [];

    // Check student exists
    const student = await prisma.student.findUnique({
      where: { id: BigInt(studentId) },
    });
    if (!student) {
      errors.push('Student not found');
    }

    // Check class exists
    const classRecord = await prisma.class.findUnique({
      where: { id: BigInt(classId) },
      include: {
        _count: {
          select: {
            enrollments: {
              where: {
                academicSessionId: BigInt(academicSessionId),
                status: { in: ['ENROLLED', 'PROMOTED'] },
              },
            },
          },
        },
      },
    });
    
    if (!classRecord) {
      errors.push('Class not found');
    } else if (classRecord._count.enrollments >= classRecord.capacity) {
      errors.push('Class is at full capacity');
    }

    // Check academic session exists
    const session = await prisma.academicSession.findUnique({
      where: { id: BigInt(academicSessionId) },
    });
    if (!session) {
      errors.push('Academic session not found');
    }

    // Check for duplicate enrollment
    const existingEnrollment = await prisma.studentEnrollment.findUnique({
      where: {
        studentId_academicSessionId: {
          studentId: BigInt(studentId),
          academicSessionId: BigInt(academicSessionId),
        },
      },
    });
    if (existingEnrollment) {
      errors.push('Student already enrolled in this academic session');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default EnrollmentService;










