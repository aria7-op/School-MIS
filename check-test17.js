#!/usr/bin/env node

/**
 * Check test17 user password
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from './generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkTest17() {
  try {
    console.log('🔍 Checking test17 user...\n');
    
    const user = await prisma.user.findFirst({
      where: { username: 'test17' },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        password: true,
        salt: true,
        status: true,
        role: true
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log('');
    
    console.log('🔐 Password Info:');
    console.log(`   Password hash: ${user.password}`);
    console.log(`   Password length: ${user.password?.length || 0}`);
    console.log(`   Salt: ${user.salt || 'NULL'}`);
    console.log('');
    
    // Test with the password
    const testPassword = 'Hr@12345';
    console.log(`🧪 Testing with password: ${testPassword}`);
    
    try {
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log(`   bcrypt.compare result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      
      if (!isValid) {
        console.log('\n⚠️  Password does not match!');
        console.log('   Possible reasons:');
        console.log('   1. Password hash was not created correctly during user creation');
        console.log('   2. Password field contains wrong data');
        console.log('   3. SQL insert used wrong password value');
      }
    } catch (err) {
      console.error('❌ Error comparing password:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTest17();
