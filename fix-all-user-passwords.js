#!/usr/bin/env node

/**
 * Script to Fix All User Passwords
 * This script updates all users who have passwords stored with the old salt method
 * to use bcrypt's built-in salt mechanism for proper password verification
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from './generated/prisma/index.js';

const prisma = new PrismaClient();

async function fixAllUserPasswords() {
  try {
    console.log('🔐 Starting password migration for all users...\n');
    
    // Find all users that have a salt stored (indicating old password method)
    const usersWithSalt = await prisma.user.findMany({
      where: {
        salt: { not: null },
        deletedAt: null
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        password: true,
        salt: true
      }
    });

    console.log(`📊 Found ${usersWithSalt.length} users with old password format\n`);

    if (usersWithSalt.length === 0) {
      console.log('✅ No users need password migration. All passwords are already using the correct format.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const user of usersWithSalt) {
      try {
        console.log(`🔄 Processing user: ${user.username} (${user.firstName} ${user.lastName})`);
        
        // The current password in the database was created using:
        // const salt = await bcrypt.genSalt(12);
        // const hashedPassword = await bcrypt.hash(password, salt);
        // 
        // This creates a valid bcrypt hash, but storing the salt separately is unnecessary
        // and causes verification issues. The hash already contains the salt internally.
        // 
        // Since we don't know the original plaintext password, we cannot rehash it.
        // However, the existing hash is still valid and can be verified with bcrypt.compare().
        // We just need to clear the separate salt field.
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            salt: null, // Clear the salt field - bcrypt hash already contains it
            updatedAt: new Date()
          }
        });
        
        console.log(`   ✅ Updated user: ${user.username}`);
        successCount++;
        
      } catch (error) {
        console.error(`   ❌ Error updating user ${user.username}:`, error.message);
        errorCount++;
        errors.push({
          username: user.username,
          error: error.message
        });
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully updated: ${successCount} users`);
    console.log(`   ❌ Failed: ${errorCount} users`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(err => {
        console.log(`   - ${err.username}: ${err.error}`);
      });
    }
    
    console.log('\n✅ Password migration completed!');
    console.log('ℹ️  All users can now login with their existing passwords using the correct bcrypt verification.');
    
  } catch (error) {
    console.error('❌ Fatal error during migration:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
fixAllUserPasswords();
