import { PrismaClient } from './generated/prisma/index.js';

const prisma = new PrismaClient();

async function createTeachersFromUsers() {
  try {
    console.log('🔍 Finding users with SCHOOL_ADMIN role...');
    
    // Find users with SCHOOL_ADMIN role who don't have teacher records
    const schoolAdminUsers = await prisma.user.findMany({
      where: {
        role: 'SCHOOL_ADMIN',
        deletedAt: null,
        teacher: null // Users who don't have teacher records
      },
      include: {
        school: true
      }
    });

    console.log(`📋 Found ${schoolAdminUsers.length} users with SCHOOL_ADMIN role`);

    if (schoolAdminUsers.length === 0) {
      console.log('✅ No users need teacher records to be created');
      return;
    }

    // Create teacher records for each user
    for (const user of schoolAdminUsers) {
      try {
        // Generate employee ID
        const employeeId = `EMP${user.id.toString().padStart(6, '0')}`;
        
        const teacher = await prisma.teacher.create({
          data: {
            userId: user.id,
            employeeId: employeeId,
            schoolId: user.schoolId || BigInt(1), // Use user's school or default to 1
            qualification: 'Bachelor Degree', // Default qualification
            specialization: 'General Education', // Default specialization
            joiningDate: new Date(),
            experience: 0,
            isClassTeacher: false,
            createdBy: user.id
          }
        });

        console.log(`✅ Created teacher record for ${user.firstName} ${user.lastName} (ID: ${teacher.id})`);
      } catch (error) {
        console.error(`❌ Failed to create teacher for ${user.firstName} ${user.lastName}:`, error.message);
      }
    }

    console.log('🎉 Teacher creation process completed!');
  } catch (error) {
    console.error('❌ Error creating teachers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTeachersFromUsers();
