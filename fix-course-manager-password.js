#!/usr/bin/env node

/**
 * Script to Fix Course Manager Password
 * This script resets the password for a course manager user
 */

import bcrypt from 'bcryptjs';
import { PrismaClient } from './generated/prisma/index.js';

const prisma = new PrismaClient();

async function fixCourseManagerPassword() {
  try {
    const username = 'test13';
    const newPassword = 'Hr@12345'; // The password that should work
    
    console.log('🔐 Fixing password for course manager user...');
    console.log(`📝 Username: ${username}`);
    console.log(`🔑 New password: ${newPassword}`);
    
    // Find the user
    const user = await prisma.user.findFirst({
      where: { username: username }
    });
    
    if (!user) {
      console.error('❌ User not found!');
      return;
    }
    
    console.log(`� Found user: ${user.firstName} ${user.lastName}`);
    console.log(`🆔 User ID: ${user.id}`);
    console.log(`👔 Role: ${user.role}`);
    
    // Hash the password using the SAME method as createUser
    // This matches the exact method used in services/userService.js createUser()
    const saltRounds = 12;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    console.log('🔒 Password hashed with salt (matching createUser method)');
    
    console.log('🔒 Password hashed successfully');
    
    // Update the user password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        salt: salt, // Store salt even though bcrypt hash includes it
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Password updated successfully!');
    
    // Verify the password works
    console.log('\n🧪 Testing password verification...');
    const updatedUser = await prisma.user.findFirst({
      where: { username: username }
    });
    
    if (updatedUser) {
      // Test with bcrypt.compare (which is what login uses)
      const isPasswordValid = await bcrypt.compare(newPassword, updatedUser.password);
      if (isPasswordValid) {
        console.log('✅ Password verification successful!');
        console.log('✅ User should now be able to login');
      } else {
        console.log('❌ Password verification failed!');
        console.log('⚠️  There may be an issue with the password storage format');
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing password:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
fixCourseManagerPassword();

