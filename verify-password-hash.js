#!/usr/bin/env node

import bcrypt from 'bcryptjs';

const storedHash = '$2a$12$X3KLUoZHhb1px0dysn7zoOmmhkF1xTkXUrMyQckgZ.nwboZcsvZQq';
const password = 'Hr@12345';

console.log('Testing if stored hash matches password...');
console.log('Hash:', storedHash);
console.log('Password:', password);
console.log('');

bcrypt.compare(password, storedHash).then(result => {
  console.log('Result:', result ? '✅ MATCH' : '❌ NO MATCH');
  
  if (result) {
    console.log('\n✅ The hash is correct for Hr@12345');
    console.log('⚠️  But the SAME hash is being used for ALL users!');
    console.log('   This means the password is being hashed ONCE and reused.');
  }
});
