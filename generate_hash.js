import bcrypt from 'bcrypt';

async function generateHash() {
  const password = 'SuperAdmin123!';
  const saltRounds = 12;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Password:', password);
    console.log('Hash:', hash);
    
    // Test verification
    const isValid = await bcrypt.compare(password, hash);
    console.log('Verification test:', isValid);
  } catch (error) {
    console.error('Error:', error);
  }
}

generateHash(); 