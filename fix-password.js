import bcrypt from 'bcryptjs';

// The password we want to set
const password = 'parent123';

// Generate a proper hash with bcryptjs
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);
const hashedPassword = bcrypt.hashSync(password, salt);

console.log('🔐 Password Fix Script');
console.log('======================');
console.log('Password:', password);
console.log('Salt:', salt);
console.log('Hashed Password:', hashedPassword);
console.log('');

// Test the hash
const isValid = bcrypt.compareSync(password, hashedPassword);
console.log('✅ Hash verification:', isValid ? 'PASSED' : 'FAILED');

// Generate SQL to update the password
console.log('');
console.log('📝 SQL to update password:');
console.log('UPDATE users SET password = \'' + hashedPassword + '\', salt = \'' + salt + '\' WHERE username = \'ahmad_parent\';');

// Also generate for student
const studentPassword = 'student123';
const studentSalt = bcrypt.genSaltSync(saltRounds);
const studentHashedPassword = bcrypt.hashSync(studentPassword, studentSalt);

console.log('');
console.log('📝 SQL to update student password:');
console.log('UPDATE users SET password = \'' + studentHashedPassword + '\', salt = \'' + studentSalt + '\' WHERE username = \'ahmad_student\';'); 