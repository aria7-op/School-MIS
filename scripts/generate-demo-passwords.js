import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prismaClient.js';

const ADMIN_PASSWORD = 'DemoAdmin@123';
const TEACHER_PASSWORD = 'DemoTeacher@123';

async function generateAndUpdatePasswords() {
  try {
    console.log('🔐 Generating password hashes for demo users...\n');

    // Generate admin password hash
    const adminSalt = await bcrypt.genSalt(12);
    const adminHash = await bcrypt.hash(ADMIN_PASSWORD, adminSalt);
    
    console.log('Admin Password Details:');
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log(`  Salt: ${adminSalt}`);
    console.log(`  Hash: ${adminHash}\n`);

    // Generate teacher password hash
    const teacherSalt = await bcrypt.genSalt(12);
    const teacherHash = await bcrypt.hash(TEACHER_PASSWORD, teacherSalt);
    
    console.log('Teacher Password Details:');
    console.log(`  Password: ${TEACHER_PASSWORD}`);
    console.log(`  Salt: ${teacherSalt}`);
    console.log(`  Hash: ${teacherHash}\n`);

    // Update admin user
    const adminUser = await prisma.user.updateMany({
      where: {
        username: 'demo.admin',
        schoolId: {
          not: null
        }
      },
      data: {
        password: adminHash,
        salt: adminSalt
      }
    });

    console.log(`✅ Updated ${adminUser.count} admin user(s)`);

    // Update teacher user
    const teacherUser = await prisma.user.updateMany({
      where: {
        username: 'demo.teacher',
        schoolId: {
          not: null
        }
      },
      data: {
        password: teacherHash,
        salt: teacherSalt
      }
    });

    console.log(`✅ Updated ${teacherUser.count} teacher user(s)\n`);

    // Verify
    const users = await prisma.user.findMany({
      where: {
        username: {
          in: ['demo.admin', 'demo.teacher']
        },
        schoolId: {
          not: null
        }
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        password: true,
        salt: true
      }
    });

    console.log('📋 Updated Users:');
    users.forEach(user => {
      console.log(`  ${user.username} (${user.role}):`);
      console.log(`    Password set: ${user.password ? 'Yes' : 'No'}`);
      console.log(`    Salt set: ${user.salt ? 'Yes' : 'No'}`);
    });

    console.log('\n✅ Password generation complete!');
    console.log('\nLogin credentials:');
    console.log(`  Admin:  demo.admin / ${ADMIN_PASSWORD}`);
    console.log(`  Teacher: demo.teacher / ${TEACHER_PASSWORD}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

generateAndUpdatePasswords();

