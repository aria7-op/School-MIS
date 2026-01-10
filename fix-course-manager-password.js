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
    const username = 'test20';
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
    console.log(`🔒 Current password hash: ${user.password?.substring(0, 20)}...`);
    console.log(`🧂 Current salt: ${user.salt || 'null'}`);
    
    // Hash the password using the CORRECT method (matching the fixed createUser)
    // Use bcrypt.hash(password, saltRounds) - salt is embedded in the hash
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('🔒 Password hashed using bcrypt.hash(password, saltRounds)');
    console.log(`🔒 New password hash: ${hashedPassword.substring(0, 20)}...`);
    
    // Update the user password
    // Set salt to null since bcrypt hashes already contain the salt
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        salt: null, // bcrypt hashes already contain the salt
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
      // Test with bcrypt.compare (which is what login uses now)
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

