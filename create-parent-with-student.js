import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createParentWithStudent() {
  try {
    console.log('🚀 Starting to create parent with student...');
    
    // First, let's check if we have an owner (required for creating users)
    let owner = await prisma.owner.findFirst({
      where: {
        schools: {
          some: {
            id: 1 // Your school ID
          }
        }
      }
    });

    if (!owner) {
      console.log('❌ No owner found for school ID 1');
      console.log('Creating a default owner first...');
      
      // Create a default owner
      const newOwner = await prisma.owner.create({
        data: {
          name: 'Default Owner',
          email: 'owner@kawish.edu.pk',
          password: await bcrypt.hash('owner123', 10),
          status: 'ACTIVE'
        }
      });
      console.log('✅ Created owner:', newOwner.id);
      owner = newOwner;
    } else {
      console.log('✅ Found existing owner:', owner.id);
    }

    // Create parent user
    const parentPassword = 'parent123';
    const hashedPassword = await bcrypt.hash(parentPassword, 10);
    
    const parentUser = await prisma.user.create({
      data: {
        username: 'ahmad_parent',
        email: 'ahmad.parent@kawish.edu.pk',
        password: hashedPassword,
        firstName: 'Ahmad',
        lastName: 'Parent',
        displayName: 'Ahmad Parent',
        role: 'PARENT',
        status: 'ACTIVE',
        schoolId: 1, // Your school ID
        createdByOwnerId: owner.id
      }
    });
    
    console.log('✅ Created parent user:', parentUser.id);
    console.log('👤 Parent credentials:');
    console.log('   Username: ahmad_parent');
    console.log('   Password: parent123');
    console.log('   Email: ahmad.parent@kawish.edu.pk');

    // Create parent record
    const parent = await prisma.parent.create({
      data: {
        userId: parentUser.id,
        occupation: 'Engineer',
        annualIncome: 500000,
        education: 'Bachelor\'s Degree',
        schoolId: 1,
        createdBy: owner.id
      }
    });
    
    console.log('✅ Created parent record:', parent.id);

    // Create student user
    const studentPassword = 'student123';
    const studentHashedPassword = await bcrypt.hash(studentPassword, 10);
    
    const studentUser = await prisma.user.create({
      data: {
        username: 'ahmad_student',
        email: 'ahmad.student@kawish.edu.pk',
        password: studentHashedPassword,
        firstName: 'Ahmad',
        lastName: 'Student',
        displayName: 'Ahmad Student',
        role: 'STUDENT',
        status: 'ACTIVE',
        schoolId: 1,
        createdByOwnerId: owner.id
      }
    });
    
    console.log('✅ Created student user:', studentUser.id);
    console.log('👨‍🎓 Student credentials:');
    console.log('   Username: ahmad_student');
    console.log('   Password: student123');
    console.log('   Email: ahmad.student@kawish.edu.pk');

    // Create student record
    const student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        admissionNo: 'STU001',
        rollNo: '1001',
        parentId: parent.id,
        admissionDate: new Date(),
        bloodGroup: 'O+',
        nationality: 'Pakistani',
        religion: 'Islam',
        schoolId: 1,
        createdBy: owner.id
      }
    });
    
    console.log('✅ Created student record:', student.id);
    console.log('📚 Student details:');
    console.log('   Admission No: STU001');
    console.log('   Roll No: 1001');
    console.log('   Parent ID: ' + parent.id);

    // Test the relationship
    const testParent = await prisma.parent.findUnique({
      where: { id: parent.id },
      include: {
        user: true,
        students: {
          include: {
            user: true
          }
        }
      }
    });

    console.log('\n🔗 Relationship verification:');
    console.log('   Parent:', testParent.user.username);
    console.log('   Students count:', testParent.students.length);
    console.log('   Student:', testParent.students[0]?.user.username);

    console.log('\n🎉 Success! Parent and student created successfully!');
    console.log('\n📋 Summary:');
    console.log('   Parent Login: ahmad_parent / parent123');
    console.log('   Student Login: ahmad_student / student123');
    console.log('   Both are linked and ready to use!');

  } catch (error) {
    console.error('❌ Error creating parent with student:', error);
    
    if (error.code === 'P2002') {
      console.log('💡 Duplicate entry error - user might already exist');
      console.log('   Try different usernames or check existing users');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createParentWithStudent(); 