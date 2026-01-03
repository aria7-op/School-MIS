import 'dotenv/config';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prismaClient.js';

const DEFAULT_EMAIL = process.env.SUPER_DUPER_ADMIN_EMAIL || 'platform.admin@ariadelta.af';
const DEFAULT_USERNAME = process.env.SUPER_DUPER_ADMIN_USERNAME || 'super.duper.admin';
const DEFAULT_PASSWORD = process.env.SUPER_DUPER_ADMIN_PASSWORD || 'SuperDuper@123';
const PLATFORM_OWNER_NAME = process.env.PLATFORM_OWNER_NAME || 'Platform Owner';

async function ensurePlatformOwner() {
  let owner = await prisma.owner.findFirst({
    where: { name: PLATFORM_OWNER_NAME },
  });

  if (!owner) {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);

    owner = await prisma.owner.create({
      data: {
        uuid: crypto.randomUUID(),
        name: PLATFORM_OWNER_NAME,
        email: DEFAULT_EMAIL,
        password: hashedPassword,
        salt,
        status: 'ACTIVE',
        timezone: 'UTC',
        locale: 'en-US',
      },
    });
    console.log(`✅ Created platform owner with ID ${owner.id}`);
  } else {
    console.log(`ℹ️ Using existing platform owner with ID ${owner.id}`);
  }

  return owner;
}

async function seedSuperDuperAdmin() {
  const existing = await prisma.user.findFirst({
    where: { role: 'SUPER_DUPER_ADMIN' },
  });

  if (existing) {
    console.log('ℹ️ Super Duper Admin already exists:', existing.username);
    return;
  }

  const owner = await ensurePlatformOwner();

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);

  const user = await prisma.user.create({
    data: {
      uuid: crypto.randomUUID(),
      username: DEFAULT_USERNAME,
      email: DEFAULT_EMAIL,
      password: hashedPassword,
      salt,
      firstName: 'Platform',
      lastName: 'Owner',
      displayName: 'Platform Owner',
      role: 'SUPER_DUPER_ADMIN',
      status: 'ACTIVE',
      timezone: 'UTC',
      locale: 'en-US',
      createdByOwnerId: owner.id,
    },
    select: {
      id: true,
      username: true,
      email: true,
    },
  });

  console.log('✅ Super Duper Admin created successfully');
  console.log(`   Username: ${user.username}`);
  console.log(`   Email:    ${user.email}`);
  console.log(`   Password: ${DEFAULT_PASSWORD}`);
}

async function main() {
  try {
    await seedSuperDuperAdmin();
  } catch (error) {
    console.error('❌ Failed to seed Super Duper Admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

