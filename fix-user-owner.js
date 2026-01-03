#!/usr/bin/env node

import { PrismaClient } from './generated/prisma/index.js';

const prisma = new PrismaClient();

async function fixUserOwner() {
  try {
    console.log('Fixing user createdByOwnerId...');
    
    // Update user 1584 to have createdByOwnerId = 1
    const result = await prisma.user.update({
      where: { id: BigInt(1584) },
      data: { createdByOwnerId: BigInt(1) }
    });
    
    console.log('Successfully updated user:', {
      id: result.id.toString(),
      username: result.username,
      createdByOwnerId: result.createdByOwnerId.toString()
    });
    
  } catch (error) {
    console.error('Error fixing user owner:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserOwner();
