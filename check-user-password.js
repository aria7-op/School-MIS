#!/usr/bin/env node

/**
 * Script to Check User Password Status
 * This script checks if a user's password is stored correctly
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from './generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkUserPassword() {
  try {
    const username = process.argv[2] || 'test16';
    const testPassword = process.argv[3] || 'Hr@12345';
    
    console.log('🔍 Checking password for user:', username);
    console.log('🔑 Test password:', testPassword);
    console.log('');
    
    // Find the user
    const user = await prisma.user.findFirst({
      where: { username: username },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        password: true,
        salt: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      console.error('❌ User not found!');
      return;
    }
    
    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log('');
    
    console.log('🔐 Password Information:');
    console.log(`   Password hash: ${user.password?.substring(0, 50)}...`);
    console.log(`   Salt stored: ${user.salt ? 'YES ⚠️ (OLD METHOD)' : 'NO ✅ (NEW METHOD)'}`);
    if (user.salt) {
      console.log(`   Salt value: ${user.salt.substring(0, 30)}...`);
    }
    console.log('');
    
    // Test password verification with bcrypt.compare
    console.log('🧪 Testing password verification with bcrypt.compare()...');
    try {
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log(`   Result: ${isValid ? '✅ PASSWORD VALID' : '❌ PASSWORD INVALID'}`);
      
      if (!isValid && user.salt) {
        console.log('');
        console.log('⚠️  Password is stored with OLD METHOD (separate salt)');
        console.log('   This user needs migration!');
        console.log('');
        console.log('📝 To fix this user, run:');
        console.log('   node fix-specific-user.js ' + username);
      } else if (!isValid && !user.salt) {
        console.log('');
        console.log('❌ Password does not match!');
        console.log('   Either the password is wrong, or the hash is corrupted.');
      } else if (isValid && user.salt) {
        console.log('');
        console.log('✅ Password works but salt should be cleared.');
        console.log('📝 Run migration to clean up: node fix-all-user-passwords.js');
      }
    } catch (error) {
      console.error('❌ Error during password verification:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

console.log('');
console.log('═══════════════════════════════════════════════');
console.log('  PASSWORD CHECK UTILITY');
console.log('═══════════════════════════════════════════════');
console.log('');

checkUserPassword();
