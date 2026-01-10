#!/usr/bin/env node

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from './generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkTest19() {
  try {
    console.log('🔍 Checking test19 user in database...\n');
    
    const user = await prisma.user.findFirst({
      where: { username: 'test19' },
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
    console.log(`   Password hash (full): ${user.password}`);
    console.log(`   Password length: ${user.password?.length || 0}`);
    console.log(`   Expected length: 60`);
    console.log(`   Starts with $2a$ or $2b$: ${user.password?.startsWith('$2a$') || user.password?.startsWith('$2b$') ? '✅ YES' : '❌ NO'}`);
    console.log(`   Salt field: ${user.salt || 'NULL ✅'}`);
    console.log('');
    
    // Compare with the hash from logs
    const hashFromLogs = '$2a$12$JQKAYh1o6NyUan0HuReCX.nHWrQEUvTPJRo/lNGOS0IPWU4wWo/Dq';
    console.log('📊 Hash Comparison:');
    console.log(`   Hash in logs:     ${hashFromLogs}`);
    console.log(`   Hash in database: ${user.password}`);
    console.log(`   Are they the same? ${hashFromLogs === user.password ? '✅ YES' : '❌ NO'}`);
    console.log('');
    
    // Test with the password
    const testPassword = 'Hr@12345';
    console.log(`🧪 Testing password verification:`);
    console.log(`   Password: ${testPassword}`);
    console.log('');
    
    try {
      // Test with hash from logs
      console.log('   Test 1: Hash from creation logs');
      const test1 = await bcrypt.compare(testPassword, hashFromLogs);
      console.log(`   Result: ${test1 ? '✅ VALID' : '❌ INVALID'}`);
      
      // Test with hash from database
      console.log('');
      console.log('   Test 2: Hash from database');
      const test2 = await bcrypt.compare(testPassword, user.password);
      console.log(`   Result: ${test2 ? '✅ VALID' : '❌ INVALID'}`);
      
      console.log('');
      if (test1 && !test2) {
        console.log('⚠️  PROBLEM FOUND!');
        console.log('   The hash created during user creation is correct,');
        console.log('   but the hash stored in the database is DIFFERENT!');
        console.log('   This means something is modifying the password during INSERT.');
      } else if (!test1 && !test2) {
        console.log('❌ PROBLEM: Neither hash works!');
        console.log('   The password "Hr@12345" does not match the hash.');
        console.log('   Either:');
        console.log('   1. Wrong password was hashed');
        console.log('   2. Hash is corrupted');
      } else if (test2) {
        console.log('✅ Hash in database is CORRECT!');
        console.log('   The issue must be in the login verification code.');
      }
      
    } catch (err) {
      console.error('❌ Error comparing password:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkTest19();
