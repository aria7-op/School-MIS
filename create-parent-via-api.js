import axios from 'axios';

const BASE_URL = 'https://khwanzay.school/api';

// Test credentials - you'll need to replace these with actual admin credentials
const ADMIN_CREDENTIALS = {
  username: 'admin', // Replace with actual admin username
  password: 'Crm123456!' // Replace with actual admin password
};

async function createParentUser() {
  try {
    console.log('🚀 Starting parent user creation via API...');
    
    // Step 1: Login as admin to get token
    console.log('📝 Step 1: Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/users/login`, ADMIN_CREDENTIALS);
    
    if (!loginResponse.data.success) {
      throw new Error(`Login failed: ${loginResponse.data.error}`);
    }
    
    const token = loginResponse.data.token || loginResponse.data.data?.token;
    if (!token) {
      throw new Error('No token received from login');
    }
    
    console.log('✅ Login successful, token received');
    
    // Step 2: Create parent user
    console.log('👤 Step 2: Creating parent user...');
    
    const parentUserData = {
      username: 'ahmad_parent',
      email: 'ahmad.parent@kawish.edu.pk',
      password: 'parent123',
      firstName: 'Ahmad',
      lastName: 'Parent',
      displayName: 'Ahmad Parent',
      role: 'PARENT',
      status: 'ACTIVE',
      schoolId: 1,
      createdByOwnerId: 1, // Assuming owner ID is 1
      timezone: 'UTC',
      locale: 'en-US'
    };
    
    const createResponse = await axios.post(`${BASE_URL}/users`, parentUserData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!createResponse.data.success) {
      throw new Error(`User creation failed: ${createResponse.data.error}`);
    }
    
    const parentUser = createResponse.data.data;
    console.log('✅ Parent user created successfully!');
    console.log('   ID:', parentUser.id);
    console.log('   Username:', parentUser.username);
    console.log('   Email:', parentUser.email);
    
    // Step 3: Create parent record
    console.log('👨‍👩‍👧‍👦 Step 3: Creating parent record...');
    
    const parentRecordData = {
      userId: parentUser.id,
      occupation: 'Engineer',
      annualIncome: 500000.00,
      education: 'Bachelor\'s Degree',
      schoolId: 1,
      createdBy: 1 // Assuming owner ID is 1
    };
    
    const parentRecordResponse = await axios.post(`${BASE_URL}/parents`, parentRecordData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!parentRecordResponse.data.success) {
      throw new Error(`Parent record creation failed: ${parentRecordResponse.data.error}`);
    }
    
    const parentRecord = parentRecordResponse.data.data;
    console.log('✅ Parent record created successfully!');
    console.log('   Parent Record ID:', parentRecord.id);
    
    // Step 4: Create student user
    console.log('👨‍🎓 Step 4: Creating student user...');
    
    const studentUserData = {
      username: 'ahmad_student',
      email: 'ahmad.student@kawish.edu.pk',
      password: 'student123',
      firstName: 'Ahmad',
      lastName: 'Student',
      displayName: 'Ahmad Student',
      role: 'STUDENT',
      status: 'ACTIVE',
      schoolId: 1,
      createdByOwnerId: 1,
      timezone: 'UTC',
      locale: 'en-US'
    };
    
    const studentCreateResponse = await axios.post(`${BASE_URL}/users`, studentUserData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!studentCreateResponse.data.success) {
      throw new Error(`Student user creation failed: ${studentCreateResponse.data.error}`);
    }
    
    const studentUser = studentCreateResponse.data.data;
    console.log('✅ Student user created successfully!');
    console.log('   ID:', studentUser.id);
    console.log('   Username:', studentUser.username);
    
    // Step 5: Create student record
    console.log('📚 Step 5: Creating student record...');
    
    const studentRecordData = {
      userId: studentUser.id,
      admissionNo: 'STU001',
      rollNo: '1001',
      parentId: parentRecord.id,
      admissionDate: new Date().toISOString(),
      bloodGroup: 'O+',
      nationality: 'Pakistani',
      religion: 'Islam',
      schoolId: 1,
      createdBy: 1
    };
    
    const studentRecordResponse = await axios.post(`${BASE_URL}/students`, studentRecordData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!studentRecordResponse.data.success) {
      throw new Error(`Student record creation failed: ${studentRecordResponse.data.error}`);
    }
    
    const studentRecord = studentRecordResponse.data.data;
    console.log('✅ Student record created successfully!');
    console.log('   Student Record ID:', studentRecord.id);
    
    // Final summary
    console.log('\n🎉 Success! Parent and student created successfully!');
    console.log('\n📋 Summary:');
    console.log('   Parent Login: ahmad_parent / parent123');
    console.log('   Student Login: ahmad_student / student123');
    console.log('   Both are linked and ready to use!');
    
    // Test the parent login
    console.log('\n🧪 Testing parent login...');
    const testLoginResponse = await axios.post(`${BASE_URL}/users/login`, {
      username: 'ahmad_parent',
      password: 'parent123'
    });
    
    if (testLoginResponse.data.success) {
      console.log('✅ Parent login test successful!');
      console.log('   Token received for parent user');
    } else {
      console.log('❌ Parent login test failed:', testLoginResponse.data.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the function
createParentUser(); 