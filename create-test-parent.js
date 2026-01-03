import { PrismaClient } from './generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestParents() {
  try {
    console.log('Creating test parent users...');
    
    const testParents = [
      {
        username: 'testparent',
        email: 'parent@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'Parent',
        phone: '+1234567890',
        address: '123 Test Street',
        emergencyContact: 'Emergency Contact',
        emergencyPhone: '+0987654321'
      },
      {
        username: 'john_doe',
        email: 'john.doe@example.com',
        password: 'Parent123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567891',
        address: '456 Main Street',
        emergencyContact: 'Jane Doe',
        emergencyPhone: '+1234567892'
      },
      {
        username: 'jane_smith',
        email: 'jane.smith@example.com',
        password: 'Parent123!',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1234567893',
        address: '789 Oak Avenue',
        emergencyContact: 'Mike Smith',
        emergencyPhone: '+1234567894'
      }
    ];
    
    for (const parentData of testParents) {
      // Check if parent user already exists
      const existingParent = await prisma.user.findFirst({
        where: {
          OR: [
            { email: parentData.email },
            { username: parentData.username }
          ],
          role: 'PARENT'
        }
      });

      if (existingParent) {
        console.log(`Parent user already exists: ${parentData.username} (${parentData.email})`);
        continue;
      }

      // Create a test parent user
      const hashedPassword = await bcrypt.hash(parentData.password, 10);
      
      const parentUser = await prisma.user.create({
        data: {
          username: parentData.username,
          email: parentData.email,
          password: hashedPassword,
          firstName: parentData.firstName,
          lastName: parentData.lastName,
          role: 'PARENT',
          status: 'ACTIVE',
          schoolId: 1n, // Assuming school ID 1 exists
          created_by_owner_id: 1n, // Assuming owner ID 1 exists
          relational_id: 1n // Assuming relational ID 1 exists
        }
      });

      console.log(`✅ Parent user created successfully: ${parentData.username}`);
      
      // Also create a parent record
      const parentRecord = await prisma.parent.create({
        data: {
          userId: parentUser.id,
          phone: parentData.phone,
          address: parentData.address,
          emergencyContact: parentData.emergencyContact,
          emergencyPhone: parentData.emergencyPhone
        }
      });

      console.log(`✅ Parent record created successfully for: ${parentData.username}`);
    }
    
    console.log('\n🎉 Test parent users creation completed!');
    console.log('\n📋 Login Credentials:');
    console.log('1. Username: testparent, Password: password123');
    console.log('2. Username: john_doe, Password: Parent123!');
    console.log('3. Username: jane_smith, Password: Parent123!');
    console.log('\n🔗 Login URL: POST /api/users/login');
    
  } catch (error) {
    console.error('❌ Error creating test parents:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestParents(); 