import { PrismaClient } from './generated/prisma/index.js';

const prisma = new PrismaClient();

async function updateSuperAdmin() {
  try {
    console.log('Updating superadmin user...');
    
    // Find the superadmin user by email
    const user = await prisma.user.findUnique({
      where: { email: 'superadmin@example.com' }
    });

    if (!user) {
      console.log('Superadmin user not found. Creating one...');
      
      // Create the superadmin user if it doesn't exist
      const newUser = await prisma.user.create({
        data: {
          uuid: crypto.randomUUID(),
          username: 'superadmin',
          email: 'superadmin@example.com',
          password: '$2b$12$xfu02JxLKvzOB3SReEUEWOHhR.jaN68IjAk54gFtpszla9ibpa.aa', // SuperAdmin123!
          firstName: 'Super',
          lastName: 'Admin',
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          timezone: 'UTC',
          locale: 'en-US',
          schoolId: BigInt(1),
          createdByOwnerId: BigInt(1)
        }
      });
      
      console.log('Superadmin user created successfully:', {
        id: newUser.id.toString(),
        email: newUser.email,
        schoolId: newUser.schoolId?.toString(),
        createdByOwnerId: newUser.createdByOwnerId.toString()
      });
    } else {
      console.log('Superadmin user found. Updating...');
      
      // Update the existing superadmin user
      const updatedUser = await prisma.user.update({
        where: { email: 'superadmin@example.com' },
        data: {
          schoolId: BigInt(1),
          createdByOwnerId: BigInt(1)
        }
      });
      
      console.log('Superadmin user updated successfully:', {
        id: updatedUser.id.toString(),
        email: updatedUser.email,
        schoolId: updatedUser.schoolId?.toString(),
        createdByOwnerId: updatedUser.createdByOwnerId.toString()
      });
    }

    console.log('Operation completed successfully!');
    
  } catch (error) {
    console.error('Error updating superadmin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateSuperAdmin(); 