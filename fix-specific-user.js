#!/usr/bin/env node

/**
 * Script to Fix Specific User Password
 * This script resets a specific user's password to use the correct bcrypt method
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from './generated/prisma/index.js';

const prisma = new PrismaClient();

async function fixSpecificUser() {
  try {
    const username = process.argv[2];
    const newPassword = process.argv[3];
    
    if (!username) {
      console.error('❌ Usage: node fix-specific-user.js <username> [newPassword]');
      console.error('   Example: node fix-specific-user.js test16 Hr@12345');
      return;
    }
    
    console.log('🔐 Fixing password for user:', username);
    if (newPassword) {
      console.log('🔑 New password:', newPassword);
    } else {
      console.log('ℹ️  No new password provided - will just clear salt field');
    }
    console.log('');
    
    // Find the user
    const user = await prisma.user.findFirst({
      where: { username: username }
    });
    
    if (!user) {
      console.error('❌ User not found!');
      return;
    }
    
    console.log(`✅ Found user: ${user.firstName} ${user.lastName}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Current salt: ${user.salt ? 'YES (will be cleared)' : 'NO'}`);
    console.log('');
    
    const updateData = {
      salt: null, // Always clear the salt
      updatedAt: new Date()
    };
    
    // If new password is provided, hash it correctly
    if (newPassword) {
      console.log('🔒 Hashing new password with bcrypt (12 rounds)...');
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      updateData.password = hashedPassword;
      console.log('✅ Password hashed successfully');
    } else {
      console.log('ℹ️  Keeping existing password hash (only clearing salt field)');
    }
    
    console.log('');
    console.log('💾 Updating user in database...');
    
    // Update the user
    await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });
    
    console.log('✅ User updated successfully!');
    console.log('');
    
    // Verify the password works
    if (newPassword) {
      console.log('🧪 Testing password verification...');
      const updatedUser = await prisma.user.findFirst({
        where: { username: username }
      });
      
      if (updatedUser) {
        const isPasswordValid = await bcrypt.compare(newPassword, updatedUser.password);
        if (isPasswordValid) {
          console.log('✅ Password verification successful!');
          console.log('✅ User can now login with the new password');
        } else {
          console.log('❌ Password verification failed!');
          console.log('⚠️  There may be an issue with the password');
        }
      }
    } else {
      console.log('ℹ️  To test login, use the original password that was set for this user.');
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('✅ DONE! User should now be able to login.');
    console.log('═══════════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error fixing user:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
fixSpecificUser();
