import { PrismaClient } from '../generated/prisma/index.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Verification Script for Enrollment Data Integrity
 * Checks for common issues in the enrollment system
 */
async function verifyEnrollmentIntegrity() {
  logger.info('Starting enrollment integrity verification...\n');

  const report = {
    timestamp: new Date().toISOString(),
    schools: [],
    summary: {
      totalIssues: 0,
      criticalIssues: 0,
      warnings: 0,
    },
  };

  try {
    // Get all schools
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        academicSessionId: true,
      },
    });

    logger.info(`Verifying ${schools.length} schools...\n`);

    for (const school of schools) {
      logger.info(`\n📋 Checking School: ${school.name} (ID: ${school.id})`);
      logger.info('='.repeat(60));

      const schoolReport = {
        schoolId: school.id.toString(),
        schoolName: school.name,
        issues: [],
        warnings: [],
        stats: {},
      };

      // Check 1: Verify school has a current academic session
      if (!school.academicSessionId) {
        schoolReport.warnings.push({
          type: 'NO_CURRENT_SESSION',
          message: 'School has no current academic session set',
          severity: 'warning',
        });
        logger.warn('⚠️  No current academic session set');
      }

      // Check 2: Active students without enrollment in current session
      if (school.academicSessionId) {
        const studentsWithoutEnrollment = await prisma.student.findMany({
          where: {
            schoolId: school.id,
            deletedAt: null,
            classId: { not: null },
            enrollments: {
              none: {
                academicSessionId: school.academicSessionId,
              },
            },
          },
          select: {
            id: true,
            admissionNo: true,
            user: { select: { firstName: true, lastName: true } },
            classId: true,
          },
        });

        if (studentsWithoutEnrollment.length > 0) {
          schoolReport.issues.push({
            type: 'MISSING_CURRENT_ENROLLMENT',
            message: `${studentsWithoutEnrollment.length} active students without enrollment in current session`,
            severity: 'critical',
            students: studentsWithoutEnrollment.map((s) => ({
              id: s.id.toString(),
              admissionNo: s.admissionNo,
              name: `${s.user.firstName} ${s.user.lastName}`,
            })),
          });
          logger.error(`❌ ${studentsWithoutEnrollment.length} students without current enrollment`);
          report.summary.criticalIssues++;
        } else {
          logger.info('✓ All active students have current enrollment');
        }
      }

      // Check 3: Student.classId mismatch with active enrollment
      const studentsWithClassMismatch = await prisma.student.findMany({
        where: {
          schoolId: school.id,
          deletedAt: null,
          classId: { not: null },
        },
        include: {
          enrollments: {
            where: {
              status: 'ENROLLED',
              academicSessionId: school.academicSessionId || undefined,
            },
            take: 1,
          },
        },
      });

      const mismatchedStudents = studentsWithClassMismatch.filter(
        (student) =>
          student.enrollments.length > 0 &&
          student.classId?.toString() !== student.enrollments[0].classId?.toString()
      );

      if (mismatchedStudents.length > 0) {
        schoolReport.issues.push({
          type: 'CLASS_MISMATCH',
          message: `${mismatchedStudents.length} students with classId mismatch`,
          severity: 'critical',
          count: mismatchedStudents.length,
        });
        logger.error(`❌ ${mismatchedStudents.length} students with class mismatch`);
        report.summary.criticalIssues++;
      } else {
        logger.info('✓ Student classId matches enrollment classId');
      }

      // Check 4: Duplicate enrollments per student per session
      const duplicateEnrollments = await prisma.$queryRaw`
        SELECT studentId, academicSessionId, COUNT(*) as count
        FROM student_enrollments
        WHERE schoolId = ${school.id}
        GROUP BY studentId, academicSessionId
        HAVING COUNT(*) > 1
      `;

      if (duplicateEnrollments.length > 0) {
        schoolReport.issues.push({
          type: 'DUPLICATE_ENROLLMENTS',
          message: `Found ${duplicateEnrollments.length} students with duplicate enrollments`,
          severity: 'critical',
          count: duplicateEnrollments.length,
        });
        logger.error(`❌ ${duplicateEnrollments.length} duplicate enrollments found`);
        report.summary.criticalIssues++;
      } else {
        logger.info('✓ No duplicate enrollments found');
      }

      // Check 5: Orphaned enrollments (invalid studentId, classId, or sessionId)
      const orphanedEnrollments = await prisma.studentEnrollment.findMany({
        where: {
          schoolId: school.id,
          OR: [
            { student: null },
            { class: null },
            { academicSession: null },
          ],
        },
      });

      if (orphanedEnrollments.length > 0) {
        schoolReport.issues.push({
          type: 'ORPHANED_ENROLLMENTS',
          message: `Found ${orphanedEnrollments.length} orphaned enrollment records`,
          severity: 'critical',
          count: orphanedEnrollments.length,
        });
        logger.error(`❌ ${orphanedEnrollments.length} orphaned enrollments`);
        report.summary.criticalIssues++;
      } else {
        logger.info('✓ No orphaned enrollments found');
      }

      // Check 6: Classes over capacity
      const classesOverCapacity = await prisma.class.findMany({
        where: {
          schoolId: school.id,
          deletedAt: null,
        },
        include: {
          _count: {
            select: {
              enrollments: {
                where: {
                  academicSessionId: school.academicSessionId || undefined,
                  status: { in: ['ENROLLED', 'PROMOTED'] },
                },
              },
            },
          },
        },
      });

      const overcapacityClasses = classesOverCapacity.filter(
        (c) => c._count.enrollments > c.capacity
      );

      if (overcapacityClasses.length > 0) {
        schoolReport.warnings.push({
          type: 'CAPACITY_EXCEEDED',
          message: `${overcapacityClasses.length} classes over capacity`,
          severity: 'warning',
          classes: overcapacityClasses.map((c) => ({
            name: c.name,
            capacity: c.capacity,
            enrolled: c._count.enrollments,
            excess: c._count.enrollments - c.capacity,
          })),
        });
        logger.warn(`⚠️  ${overcapacityClasses.length} classes over capacity`);
        report.summary.warnings++;
      } else {
        logger.info('✓ All classes within capacity');
      }

      // Check 7: Fee structures without academic session
      const feeStructuresWithoutSession = await prisma.feeStructure.count({
        where: {
          schoolId: school.id,
          academicSessionId: null,
          deletedAt: null,
        },
      });

      if (feeStructuresWithoutSession > 0) {
        schoolReport.warnings.push({
          type: 'FEE_STRUCTURE_NO_SESSION',
          message: `${feeStructuresWithoutSession} fee structures without academic session`,
          severity: 'warning',
          count: feeStructuresWithoutSession,
        });
        logger.warn(`⚠️  ${feeStructuresWithoutSession} fee structures without session`);
        report.summary.warnings++;
      } else {
        logger.info('✓ All fee structures have academic session');
      }

      // Check 8: Teacher assignments without academic session
      const teacherAssignmentsWithoutSession = await prisma.teacherClassSubject.count({
        where: {
          schoolId: school.id,
          academicSessionId: null,
          deletedAt: null,
        },
      });

      if (teacherAssignmentsWithoutSession > 0) {
        schoolReport.warnings.push({
          type: 'TEACHER_ASSIGNMENT_NO_SESSION',
          message: `${teacherAssignmentsWithoutSession} teacher assignments without academic session`,
          severity: 'warning',
          count: teacherAssignmentsWithoutSession,
        });
        logger.warn(`⚠️  ${teacherAssignmentsWithoutSession} teacher assignments without session`);
        report.summary.warnings++;
      } else {
        logger.info('✓ All teacher assignments have academic session');
      }

      // Collect stats
      const enrollmentCount = await prisma.studentEnrollment.count({
        where: { schoolId: school.id },
      });

      const activeEnrollmentCount = await prisma.studentEnrollment.count({
        where: {
          schoolId: school.id,
          status: 'ENROLLED',
        },
      });

      schoolReport.stats = {
        totalEnrollments: enrollmentCount,
        activeEnrollments: activeEnrollmentCount,
        issues: schoolReport.issues.length,
        warnings: schoolReport.warnings.length,
      };

      report.summary.totalIssues += schoolReport.issues.length + schoolReport.warnings.length;
      report.schools.push(schoolReport);

      logger.info(`\n📊 Stats: ${enrollmentCount} total enrollments, ${activeEnrollmentCount} active`);
    }

    // Generate summary
    logger.info('\n' + '='.repeat(60));
    logger.info('🎯 VERIFICATION SUMMARY');
    logger.info('='.repeat(60));
    logger.info(`Total Schools Checked: ${schools.length}`);
    logger.info(`Total Issues Found: ${report.summary.totalIssues}`);
    logger.info(`  - Critical: ${report.summary.criticalIssues}`);
    logger.info(`  - Warnings: ${report.summary.warnings}`);

    if (report.summary.totalIssues === 0) {
      logger.info('\n✅ All checks passed! Enrollment data integrity verified.');
    } else {
      logger.warn('\n⚠️  Issues found. Please review the report above.');
    }

    // Write report to file
    const fs = await import('fs/promises');
    await fs.writeFile(
      'enrollment-integrity-report.json',
      JSON.stringify(report, null, 2)
    );
    logger.info('\n📄 Full report saved to: enrollment-integrity-report.json');

    return report;
  } catch (error) {
    logger.error('Verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyEnrollmentIntegrity()
  .then(() => {
    logger.info('\nVerification completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Verification failed:', error);
    process.exit(1);
  });

export default verifyEnrollmentIntegrity;










