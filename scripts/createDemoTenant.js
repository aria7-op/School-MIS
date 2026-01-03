import 'dotenv/config';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prismaClient.js';

/**
 * Script to create a demo tenant (School) with Premium or Enterprise package
 * 
 * Usage: node scripts/createDemoTenant.js
 */

async function listPackages() {
  console.log('\n📦 Checking existing packages in database...\n');
  
  const packages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: { priceMonthly: 'asc' }
  });

  if (packages.length === 0) {
    console.log('⚠️  No packages found in database.');
    console.log('   You may need to create packages first.\n');
    return null;
  }

  console.log('Found packages:');
  console.log('─'.repeat(80));
  packages.forEach((pkg, index) => {
    console.log(`${index + 1}. ${pkg.name}`);
    console.log(`   UUID: ${pkg.uuid}`);
    console.log(`   Description: ${pkg.description || 'N/A'}`);
    console.log(`   Monthly: $${pkg.priceMonthly}`);
    console.log(`   Yearly: $${pkg.priceYearly}`);
    console.log(`   Support: ${pkg.supportLevel || 'N/A'}`);
    console.log(`   Features: ${JSON.stringify(pkg.features, null, 2).substring(0, 100)}...`);
    console.log('');
  });
  console.log('─'.repeat(80));
  
  return packages;
}

async function findOrCreateOwner() {
  const ownerName = 'Demo Owner';
  let owner = await prisma.owner.findFirst({
    where: { name: ownerName }
  });

  if (!owner) {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('DemoOwner@123', salt);
    
    owner = await prisma.owner.create({
      data: {
        uuid: crypto.randomUUID(),
        name: ownerName,
        email: 'demo.owner@example.com',
        password: hashedPassword,
        salt,
        status: 'ACTIVE',
        timezone: 'UTC',
        locale: 'en-US',
      },
    });
    console.log(`✅ Created demo owner with ID ${owner.id}`);
  } else {
    console.log(`ℹ️  Using existing demo owner with ID ${owner.id}`);
  }

  return owner;
}

async function findPackageByName(packages, preferredNames = ['Enterprise', 'Premium', 'enterprise', 'premium']) {
  // Try to find by exact name match first
  for (const name of preferredNames) {
    const pkg = packages.find(p => 
      p.name.toLowerCase() === name.toLowerCase() || 
      p.name.toLowerCase().includes(name.toLowerCase())
    );
    if (pkg) return pkg;
  }
  
  // If not found, return the most expensive one (likely enterprise/premium)
  return packages.sort((a, b) => Number(b.priceMonthly) - Number(a.priceMonthly))[0];
}

async function createDemoTenant(packageId) {
  const tenantId = 'demo-tenant';
  const schoolCode = 'DEMO001';
  
  // Check if demo tenant already exists
  const existing = await prisma.school.findFirst({
    where: {
      OR: [
        { tenantId },
        { code: schoolCode }
      ]
    }
  });

  if (existing) {
    console.log(`\n⚠️  Demo tenant already exists:`);
    console.log(`   School ID: ${existing.id}`);
    console.log(`   Name: ${existing.name}`);
    console.log(`   Tenant ID: ${existing.tenantId || 'N/A'}`);
    console.log(`   Code: ${existing.code}`);
    
    // Check if it has an active subscription
    const subscription = await prisma.schoolSubscription.findFirst({
      where: {
        schoolId: existing.id,
        status: 'ACTIVE'
      },
      include: { package: true }
    });

    if (subscription) {
      console.log(`\n✅ Active subscription found:`);
      console.log(`   Package: ${subscription.package.name}`);
      console.log(`   Status: ${subscription.status}`);
      console.log(`   Subscription ID: ${subscription.id}`);
    } else {
      console.log(`\n⚠️  No active subscription found. Creating one...`);
      return await createSubscriptionForSchool(existing.id, packageId);
    }
    
    return { school: existing, subscription };
  }

  // Get or create owner
  const owner = await findOrCreateOwner();

  // Create the demo school
  console.log(`\n🏫 Creating demo tenant (School)...`);
  const school = await prisma.school.create({
    data: {
      uuid: crypto.randomUUID(),
      name: 'Demo School',
      shortName: 'Demo',
      code: schoolCode,
      motto: 'Excellence in Education',
      about: 'This is a demo tenant for testing purposes',
      phone: '+1234567890',
      website: 'https://demo.example.com',
      country: 'United States',
      state: 'California',
      city: 'San Francisco',
      address: '123 Demo Street',
      postalCode: '94102',
      timezone: 'America/Los_Angeles',
      locale: 'en-US',
      currency: 'USD',
      status: 'ACTIVE',
      ownerId: owner.id,
      tenantId: tenantId,
    },
  });

  console.log(`✅ Created demo school:`);
  console.log(`   ID: ${school.id}`);
  console.log(`   Name: ${school.name}`);
  console.log(`   Tenant ID: ${school.tenantId}`);
  console.log(`   Code: ${school.code}`);

  // Create subscription
  const subscription = await createSubscriptionForSchool(school.id, packageId);

  // Link subscription to school
  await prisma.school.update({
    where: { id: school.id },
    data: { subscriptionId: subscription.id }
  });

  console.log(`✅ Linked subscription to school`);

  return { school, subscription };
}

async function createSubscriptionForSchool(schoolId, packageId) {
  console.log(`\n📋 Creating subscription...`);
  
  const pkg = await prisma.package.findUnique({
    where: { id: packageId }
  });

  if (!pkg) {
    throw new Error(`Package with ID ${packageId} not found`);
  }

  // Set expiration to 1 year from now
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const subscription = await prisma.schoolSubscription.create({
    data: {
      uuid: crypto.randomUUID(),
      schoolId: schoolId,
      packageId: packageId,
      status: 'ACTIVE',
      startedAt: new Date(),
      expiresAt: expiresAt,
      autoRenew: false,
      paymentStatus: 'PAID',
      lastPaymentDate: new Date(),
    },
    include: {
      package: true
    }
  });

  console.log(`✅ Created subscription:`);
  console.log(`   ID: ${subscription.id}`);
  console.log(`   Package: ${subscription.package.name}`);
  console.log(`   Status: ${subscription.status}`);
  console.log(`   Expires: ${subscription.expiresAt.toISOString().split('T')[0]}`);

  return subscription;
}

async function main() {
  try {
    console.log('🚀 Demo Tenant Creation Script');
    console.log('='.repeat(80));

    // Step 1: List packages
    const packages = await listPackages();
    
    if (!packages || packages.length === 0) {
      console.log('\n❌ Cannot proceed without packages. Please create packages first.');
      process.exit(1);
    }

    // Step 2: Find premium or enterprise package
    const selectedPackage = await findPackageByName(packages);
    
    if (!selectedPackage) {
      console.log('\n❌ Could not find a suitable package.');
      process.exit(1);
    }

    console.log(`\n✅ Selected package: ${selectedPackage.name} (ID: ${selectedPackage.id})`);

    // Step 3: Create demo tenant with subscription
    const result = await createDemoTenant(selectedPackage.id);

    console.log('\n' + '='.repeat(80));
    console.log('✅ Demo tenant created successfully!');
    console.log('='.repeat(80));
    console.log(`\n📊 Summary:`);
    console.log(`   School ID: ${result.school.id}`);
    console.log(`   School Name: ${result.school.name}`);
    console.log(`   Tenant ID: ${result.school.tenantId}`);
    console.log(`   Package: ${result.subscription.package.name}`);
    console.log(`   Subscription ID: ${result.subscription.id}`);
    console.log(`   Status: ${result.subscription.status}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

