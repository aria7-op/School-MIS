#!/usr/bin/env node

/**
 * Script to Update User Password in Database
 * This script updates the password for the existing user ali.rahmani@example.com
 */

import bcrypt from 'bcryptjs';
import { PrismaClient } from './generated/prisma/index.js';

const prisma = new PrismaClient();

async function updateUserPassword() {
  try {
    console.log('🔐 Updating user password...');
    
    // Generate a new password
    const newPassword = 'NewPassword123!';
    console.log(`📝 New password: ${newPassword}`);
    
    // Hash the new password
    const saltRounds = 12;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    console.log('🔒 Password hashed successfully');
    
    // Update the user in the database
    const updatedUser = await prisma.user.update({
      where: {
        email: 'ali.rahmani@example.com'
      },
      data: {
        password: hashedPassword,
        salt: salt,
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Password updated successfully!');
    console.log(`👤 User: ${updatedUser.firstName} ${updatedUser.lastName}`);
    console.log(`📧 Email: ${updatedUser.email}`);
    console.log(`🔑 New Password: ${newPassword}`);
    console.log(`🆔 User ID: ${updatedUser.id}`);
    
    // Test login with new password
    console.log('\n🧪 Testing login with new password...');
    
    const testUser = await prisma.user.findUnique({
      where: { email: 'ali.rahmani@example.com' }
    });
    
    if (testUser) {
      const isPasswordValid = await bcrypt.compare(newPassword, testUser.password);
      if (isPasswordValid) {
        console.log('✅ Password verification successful!');
      } else {
        console.log('❌ Password verification failed!');
      }
    }
    
  } catch (error) {
    console.error('❌ Error updating password:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
updateUserPassword(); 