import xlsx from 'xlsx';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  EXCEL_FILE_PATH: './Student_Data_Cleaned.xlsx',
  API_BASE_URL: 'https://khwanzay.school/api', // Update this to your API URL
  AUTH_TOKEN: process.env.AUTH_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0OTYiLCJyb2xlIjoiU0NIT09MX0FETUlOIiwic2Nob29sSWQiOiIxIiwiaWF0IjoxNzU2NzExMDQ0LCJleHAiOjE3NTY3OTc0NDR9.GfU8dmjQNVyxLgRe3xpKFwJgffd_HUayvb-6gPpbUog', // Set your auth token
  SCHOOL_ID: process.env.SCHOOL_ID || '1', // Set your school ID
  BATCH_SIZE: 1, // Process students in batches to avoid overwhelming the server
  DELAY_BETWEEN_BATCHES: 6000, // 60 second delay between batches to avoid rate limiting
  LOG_FILE: './bulk-import-exact-log.json',
  SKIP_EXISTING: false // Process all students, even if they already exist
};

// Initialize logging
const logData = {
  startTime: new Date().toISOString(),
  totalRecords: 0,
  successful: 0,
  failed: 0,
  errors: [],
  details: []
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
  
  if (type === 'error') {
    logData.errors.push({ timestamp, message });
  }
  
  logData.details.push({ timestamp, type, message });
}

function saveLog() {
  logData.endTime = new Date().toISOString();
  logData.duration = new Date(logData.endTime) - new Date(logData.startTime);
  
  fs.writeFileSync(CONFIG.LOG_FILE, JSON.stringify(logData, null, 2));
  log(`Log saved to ${CONFIG.LOG_FILE}`);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to load successfully created students from log file
// Removed loadSuccessfullyCreatedStudents function - processing all students

// Function to save successfully created student
// Removed duplicate checking functions - processing all students

// Check if student already exists by name and phone
// Removed checkStudentExists function - processing all students

function validateRequiredFields(studentData) {
  const required = [
    'Student_First_Name*', 'Student_Last_Name*', 
    'Student_Gender*', 'Student_Date_of_Birth*', 'Parent_First_Name*', 
    'Parent_Last_Name*', 'Parent_Gender*', 
    'Parent_Birth_Date*', 'Admission_Date*'
  ];
  
  const missing = required.filter(field => !studentData[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

function transformExcelDataToExactAPIFormat(row) {
  // Clean and validate the data
  const cleanData = {};
  Object.keys(row).forEach(key => {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') {
      cleanData[key] = value;
    }
  });
  
  validateRequiredFields(cleanData);
  
  // Transform to exact API format as specified
  const apiData = {
    schoolId: parseInt(CONFIG.SCHOOL_ID),
    classId: cleanData['Class_ID*'] ? parseInt(cleanData['Class_ID*']) : 1, // Default to class 1 if not specified
    admissionDate: cleanData['Admission_Date*'],
    bloodGroup: cleanData['Blood_Group'] || null,
    nationality: cleanData['Nationality'] || 'Afghan',
    religion: cleanData['Religion'] || 'Islam',
    tazkiraNo: cleanData['Student_Tazkira_No'] || null,
    bankAccountNo: cleanData['Bank_Account_No'] || null,
    bankName: cleanData['Bank_Name'] || null,
    previousSchool: cleanData['Previous_School'] || null,
    
    // Origin Address - Map from Excel columns
    originAddress: cleanData['Origin_Address'] || cleanData['Origin_Address.1'] || null,
    originCity: cleanData['Origin_City'] || cleanData['Origin_City.1'] || null,
    originState: cleanData['Origin_State'] || null,
    originProvince: cleanData['Origin_Province'] || null,
    originCountry: cleanData['Origin_Country'] || 'Afghanistan',
    originPostalCode: cleanData['Origin_Postal_Code'] ? String(cleanData['Origin_Postal_Code']) : null,
    
    // Current Address - Map from Excel columns
    currentAddress: cleanData['Current_Address'] || null,
    currentCity: cleanData['Current_City'] || null,
    currentState: cleanData['Current_State'] || null,
    currentProvince: cleanData['Current_Province'] || null,
    currentCountry: cleanData['Current_Country'] || 'Afghanistan',
    currentPostalCode: cleanData['Current_Postal_Code'] ? String(cleanData['Current_Postal_Code']) : null,
    
    // Student User Data - Exact format as specified
    user: {
      firstName: cleanData['Student_First_Name*'],
      middleName: cleanData['Student_Middle_Name'] || null,
      lastName: cleanData['Student_Last_Name*'],
      displayName: cleanData['Student_Display_Name'] || `${cleanData['Student_First_Name*']} ${cleanData['Student_Last_Name*']}`,
      phone: cleanData['Student_Phone*'] || `+93${Math.floor(Math.random() * 90000000) + 10000000}`,
      gender: cleanData['Student_Gender*'].toUpperCase(),
      dateOfBirth: cleanData['Student_Date_of_Birth*'],
      address: cleanData['Current_Address'] || null,
      city: cleanData['Current_City'] || null,
      state: cleanData['Current_State'] || null,
      country: cleanData['Current_Country'] || 'Afghanistan',
      postalCode: cleanData['Current_Postal_Code'] ? String(cleanData['Current_Postal_Code']) : null,
      avatar: null,
      bio: cleanData['Student_Bio'] || null,
      timezone: 'Asia/Kabul',
      locale: 'en-AF',
      tazkiraNo: cleanData['Student_Tazkira_No'] || null,
      username: cleanData['Student_Username*'] || `${cleanData['Student_First_Name*'].toLowerCase()}_${cleanData['Student_Last_Name*'].toLowerCase()}_${Math.floor(Math.random() * 9999)}`
    },
    
    // Parent Data - Exact format as specified
    parent: {
      user: {
        firstName: cleanData['Parent_First_Name*'],
        middleName: cleanData['Parent_Middle_Name'] || null,
        lastName: cleanData['Parent_Last_Name*'],
        displayName: cleanData['Parent_Display_Name'] || `${cleanData['Parent_First_Name*']} ${cleanData['Parent_Last_Name*']}`,
        phone: cleanData['Parent_Phone*'] || `+93${Math.floor(Math.random() * 90000000) + 10000000}`,
        gender: cleanData['Parent_Gender*'].toUpperCase(),
        birthDate: cleanData['Parent_Birth_Date*'],
        address: cleanData['Current_Address'] || null,
        city: cleanData['Current_City'] || null,
        state: cleanData['Current_State'] || null,
        country: cleanData['Current_Country'] || 'Afghanistan',
        postalCode: cleanData['Current_Postal_Code'] ? String(cleanData['Current_Postal_Code']) : null,
        avatar: null,
        bio: cleanData['Parent_Bio'] || null,
        timezone: 'Asia/Kabul',
        locale: 'en-AF',
        tazkiraNo: cleanData['Parent_Tazkira_No'] || null,
        username: cleanData['Parent_Username*'] || `${cleanData['Parent_First_Name*'].toLowerCase()}_${cleanData['Parent_Last_Name*'].toLowerCase()}_parent_${Math.floor(Math.random() * 9999)}`
      },
      occupation: cleanData['Occupation'] || null,
      annualIncome: cleanData['Annual_Income'] || null,
      education: cleanData['Education'] || null,
      employer: cleanData['Employer'] || null,
      designation: cleanData['Designation'] || null,
      workPhone: cleanData['Work_Phone'] || null,
      emergencyContact: cleanData['Emergency_Contact'] || null,
      relationship: cleanData['Relationship'] || 'Father',
      isGuardian: cleanData['Is_Guardian'] === 'true' || true,
      isEmergencyContact: cleanData['Is_Emergency_Contact'] === 'true' || true
    }
  };
  
  return apiData;
}

async function createStudentWithExactFormat(apiData, globalIndex) {
  const studentName = `${apiData.user.firstName} ${apiData.user.lastName}`;
  
  try {
    // Process all students (no duplicate checking)

    log(`Creating student ${globalIndex + 1}: ${apiData.user.firstName} ${apiData.user.lastName}`);
    
    // Debug: Log the API request (commented out for cleaner output)
    // console.log(`🔍 API Request for ${apiData.user.firstName}:`, JSON.stringify(apiData, null, 2));
    
    const response = await axios.post(`${CONFIG.API_BASE_URL}/students`, apiData, {
      headers: {
        'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 6000 // 60 second timeout for complex creation
    });
    
    // console.log(`🔍 API Response for ${apiData.user.firstName}:`, JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      log(`✅ Student created successfully: ${apiData.user.firstName} ${apiData.user.lastName}`, 'success');
      // Student created successfully
      return { success: true, data: response.data };
    } else {
      throw new Error(response.data.message || 'API returned success: false');
    }
    
  } catch (error) {
    // console.log(`🔍 API Error for ${apiData.user.firstName}:`, {
    //   status: error.response?.status,
    //   statusText: error.response?.statusText,
    //   data: error.response?.data,
    //   message: error.message
    // });
    
    const errorMessage = error.response?.data?.message || error.message;
    
    // Handle rate limiting specifically
    if (error.response?.status === 429 || errorMessage.includes('Too many student creation requests')) {
      log(`⏳ Rate limited for ${apiData.user.firstName} ${apiData.user.lastName}, will retry later`, 'warning');
      return { success: false, error: errorMessage, retry: true };
    }
    
    log(`❌ Failed to create student ${apiData.user.firstName} ${apiData.user.lastName}: ${errorMessage}`, 'error');
    return { success: false, error: errorMessage };
  }
}

async function processBatch(students, startIndex) {
  const batch = students.slice(startIndex, startIndex + CONFIG.BATCH_SIZE);
  const results = [];
  
  log(`Processing batch ${Math.floor(startIndex / CONFIG.BATCH_SIZE) + 1} (${batch.length} students)`);
  
  for (let i = 0; i < batch.length; i++) {
    const student = batch[i];
    const globalIndex = startIndex + i;
    
    try {
      const apiData = transformExcelDataToExactAPIFormat(student);
      const studentName = `${apiData.user.firstName} ${apiData.user.lastName}`;
      
      // Process all students (no duplicate checking)
      
      const result = await createStudentWithExactFormat(apiData, globalIndex);
      
      // Handle retry logic for rate limiting
      if (result.retry) {
        log(`🔄 Retrying student ${studentName} after rate limit...`, 'info');
        await delay(120000); // Wait 2 minutes
        const retryResult = await createStudentWithExactFormat(apiData, globalIndex);
        results.push(retryResult);
        
        if (retryResult.success) {
          logData.successful++;
        } else {
          logData.failed++;
        }
      } else {
        results.push(result);
        
        if (result.success) {
          logData.successful++;
        } else {
          logData.failed++;
        }
      }
      
      // Small delay between individual requests
      await delay(2000); // Increased delay to avoid rate limiting
      
    } catch (error) {
      log(`❌ Error processing student ${globalIndex + 1}: ${error.message}`, 'error');
      logData.failed++;
      results.push({ success: false, error: error.message });
    }
  }
  
  return results;
}

async function main() {
  try {
    log('🚀 Starting bulk student import with exact API format...');
    log(`📁 Reading Excel file: ${CONFIG.EXCEL_FILE_PATH}`);
    
    // Check if file exists
    if (!fs.existsSync(CONFIG.EXCEL_FILE_PATH)) {
      throw new Error(`Excel file not found: ${CONFIG.EXCEL_FILE_PATH}`);
    }
    
    // Read Excel file
    const workbook = xlsx.readFile(CONFIG.EXCEL_FILE_PATH);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const students = xlsx.utils.sheet_to_json(worksheet);
    
    logData.totalRecords = students.length;
    log(`📊 Found ${students.length} student records in Excel file`);
    
    if (students.length === 0) {
      log('⚠️ No student records found in Excel file', 'warning');
      return;
    }
    
    // Validate auth token
    if (!CONFIG.AUTH_TOKEN) {
      throw new Error('AUTH_TOKEN environment variable is required');
    }
    
    log(`🔐 Using auth token: ${CONFIG.AUTH_TOKEN.substring(0, 10)}...`);
    log(`🏫 School ID: ${CONFIG.SCHOOL_ID}`);
    log(`📦 Batch size: ${CONFIG.BATCH_SIZE}`);
    log(`⏱️ Delay between batches: ${CONFIG.DELAY_BETWEEN_BATCHES}ms`);
    
    // Process students in batches
    for (let i = 0; i < students.length; i += CONFIG.BATCH_SIZE) {
      await processBatch(students, i);
      
      // Delay between batches
      if (i + CONFIG.BATCH_SIZE < students.length) {
        log(`⏳ Waiting ${CONFIG.DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await delay(CONFIG.DELAY_BETWEEN_BATCHES);
      }
    }
    
    // Final summary
    log('🎉 Bulk import process completed!');
    log(`📈 Summary: ${logData.successful} successful, ${logData.failed} failed out of ${logData.totalRecords} total`);
    
    if (logData.failed > 0) {
      log(`❌ Failed imports: ${logData.errors.length} errors logged`, 'warning');
    }
    
    saveLog();
    
  } catch (error) {
    log(`💥 Fatal error: ${error.message}`, 'error');
    saveLog();
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('🛑 Process interrupted by user', 'warning');
  saveLog();
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('🛑 Process terminated', 'warning');
  saveLog();
  process.exit(0);
});

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main; 