import bcrypt from 'bcryptjs';

async function generateAdminPassword() {
  const password = 'admin123';
  const saltRounds = 10;
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(saltRounds);
    
    // Hash password with salt
    const hashedPassword = await bcrypt.hash(password, salt);
    
    console.log('=== ADMIN PASSWORD GENERATED ===');
    console.log('Password:', password);
    console.log('Salt:', salt);
    console.log('Hashed Password:', hashedPassword);
    console.log('');
    console.log('=== SQL INSERT STATEMENT ===');
    console.log(`INSERT INTO users (uuid, username, email, password, salt, firstName, lastName, displayName, role, status, schoolId, createdByOwnerId, timezone, locale, createdAt, updatedAt)`);
    console.log(`VALUES (`);
    console.log(`    UUID(),`);
    console.log(`    'teacher',`);
    console.log(`    'teacher@school.com',`);
    console.log(`    '${hashedPassword}',`);
    console.log(`    '${salt}',`);
    console.log(`    'Admin',`);
    console.log(`    'Teacher',`);
    console.log(`    'Admin Teacher',`);
    console.log(`    'SCHOOL_ADMIN',`);
    console.log(`    'ACTIVE',`);
    console.log(`    1,`);
    console.log(`    1,`);
    console.log(`    'UTC',`);
    console.log(`    'en-US',`);
    console.log(`    NOW(),`);
    console.log(`    NOW()`);
    console.log(`);`);
    
  } catch (error) {
    console.error('Error generating password:', error);
  }
}

generateAdminPassword(); 