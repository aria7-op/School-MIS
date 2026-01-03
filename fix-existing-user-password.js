import { PrismaClient } from './generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixExistingUserPassword() {
  try {
    console.log('🔧 Starting to fix existing user password...');
    
    // Find the user with the problematic username
    const user = await prisma.user.findUnique({
      where: { username: 'test_1756645019210_ov3f6' }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 Found user:', user.username);
    console.log('🔍 Current salt:', user.salt);
    console.log('🔍 Current password hash:', user.password);
    
    // Generate new salt and hash the password
    const newSalt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash('temp_password_123', newSalt);
    
    console.log('🔧 New salt:', newSalt);
    console.log('🔧 New password hash:', newPasswordHash);
    
    // Update the user with new salt and password
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        salt: newSalt,
        password: newPasswordHash
      }
    });
    
    console.log('✅ User password updated successfully!');
    console.log('🔑 New credentials:');
    console.log('   Username:', updatedUser.username);
    console.log('   Password: temp_password_123');
    console.log('   Salt:', updatedUser.salt);
    
  } catch (error) {
    console.error('❌ Error fixing user password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExistingUserPassword(); 