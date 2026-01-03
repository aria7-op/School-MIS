import { PrismaClient } from '../generated/prisma/index.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Migration script to add academic year tracking support
 * This adds StudentEnrollment records and backfills academicSessionId 
 * for existing fee structures and teacher assignments
 */
async function migrateAcademicYearTracking() {
  logger.info('Starting academic year tracking migration...');
  
  try {
    // Step 1: Get all schools with their current academic sessions
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        academicSessionId: true,
      },
    });

    logger.info(`Found ${schools.length} schools to migrate`);

    for (const school of schools) {
      logger.info(`\nMigrating school: ${school.name} (ID: ${school.id})`);
      
      // Get or create current academic session for this school
      let currentSession = null;
      
      if (school.academicSessionId) {
        currentSession = await prisma.academicSession.findUnique({
          where: { id: school.academicSessionId },
        });
      }
      
      // If no current session, try to find or create one
      if (!currentSession) {
        const now = new Date();
        const currentYear = now.getFullYear();
        
        // Try to find a session for current year
        currentSession = await prisma.academicSession.findFirst({
          where: {
            schoolId: school.id,
            OR: [
              { isCurrent: true },
              {
                AND: [
                  { startDate: { lte: now } },
                  { endDate: { gte: now } },
                ],
              },
            ],
          },
        });
        
        // Create a default session if none exists
        if (!currentSession) {
          logger.warn(`No current academic session found for ${school.name}, creating default session`);
          
          currentSession = await prisma.academicSession.create({
            data: {
              name: `Academic Year ${currentYear}-${currentYear + 1}`,
              startDate: new Date(currentYear, 0, 1), // Jan 1
              endDate: new Date(currentYear, 11, 31), // Dec 31
              isCurrent: true,
              schoolId: school.id,
              createdBy: BigInt(1), // System user
            },
          });
          
          // Update school's current session
          await prisma.school.update({
            where: { id: school.id },
            data: { academicSessionId: currentSession.id },
          });
        }
      }
      
      logger.info(`Using academic session: ${currentSession.name} (ID: ${currentSession.id})`);
      
      // Step 2: Migrate students to StudentEnrollment
      const students = await prisma.student.findMany({
        where: {
          schoolId: school.id,
          deletedAt: null,
          classId: { not: null },
        },
        select: {
          id: true,
          classId: true,
          sectionId: true,
          rollNo: true,
          createdBy: true,
          admissionDate: true,
        },
      });
      
      logger.info(`Found ${students.length} active students with classes to enroll`);
      
      let enrolledCount = 0;
      let skippedCount = 0;
      
      for (const student of students) {
        try {
          // Check if enrollment already exists
          const existingEnrollment = await prisma.studentEnrollment.findUnique({
            where: {
              studentId_academicSessionId: {
                studentId: student.id,
                academicSessionId: currentSession.id,
              },
            },
          });
          
          if (existingEnrollment) {
            skippedCount++;
            continue;
          }
          
          // Create enrollment record
          await prisma.studentEnrollment.create({
            data: {
              studentId: student.id,
              classId: student.classId,
              sectionId: student.sectionId,
              academicSessionId: currentSession.id,
              rollNo: student.rollNo,
              enrollmentDate: student.admissionDate || new Date(),
              status: 'ENROLLED',
              schoolId: school.id,
              createdBy: student.createdBy,
            },
          });
          
          enrolledCount++;
        } catch (error) {
          logger.error(`Failed to create enrollment for student ${student.id}: ${error.message}`);
        }
      }
      
      logger.info(`Created ${enrolledCount} enrollments, skipped ${skippedCount} existing`);
      
      // Step 3: Backfill FeeStructure.academicSessionId
      const feeStructuresUpdated = await prisma.feeStructure.updateMany({
        where: {
          schoolId: school.id,
          academicSessionId: null,
        },
        data: {
          academicSessionId: currentSession.id,
        },
      });
      
      logger.info(`Updated ${feeStructuresUpdated.count} fee structures with academic session`);
      
      // Step 4: Backfill TeacherClassSubject.academicSessionId
      const teacherAssignmentsUpdated = await prisma.teacherClassSubject.updateMany({
        where: {
          schoolId: school.id,
          academicSessionId: null,
        },
        data: {
          academicSessionId: currentSession.id,
        },
      });
      
      logger.info(`Updated ${teacherAssignmentsUpdated.count} teacher assignments with academic session`);
    }
    
    logger.info('\n✓ Migration completed successfully!');
    
    // Generate summary report
    const totalEnrollments = await prisma.studentEnrollment.count();
    const totalFeeStructuresWithSession = await prisma.feeStructure.count({
      where: { academicSessionId: { not: null } },
    });
    const totalTeacherAssignmentsWithSession = await prisma.teacherClassSubject.count({
      where: { academicSessionId: { not: null } },
    });
    
    logger.info('\nMigration Summary:');
    logger.info(`- Total student enrollments: ${totalEnrollments}`);
    logger.info(`- Fee structures with academic session: ${totalFeeStructuresWithSession}`);
    logger.info(`- Teacher assignments with academic session: ${totalTeacherAssignmentsWithSession}`);
    
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateAcademicYearTracking()
  .then(() => {
    logger.info('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Migration script failed:', error);
    process.exit(1);
  });










