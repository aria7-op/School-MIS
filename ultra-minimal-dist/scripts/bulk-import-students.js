import xlsx from 'xlsx';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  EXCEL_FILE_PATH: './Student_Data_Cleaned.xlsx', // Use cleaned file by default
  API_BASE_URL: 'http://localhost:3000/api', // Update this to your API URL
  AUTH_TOKEN: process.env.AUTH_TOKEN || '', // Set your auth token
  SCHOOL_ID: process.env.SCHOOL_ID || '1', // Set your school ID
  BATCH_SIZE: 5, // Process students in batches to avoid overwhelming the server
  DELAY_BETWEEN_BATCHES: 1000, // 1 second delay between batches
  LOG_FILE: './bulk-import-log.json'
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

function validateRequiredFields(studentData) {
  const required = [
    'Student_First_Name', 'Student_Last_Name', 'Student_Username', 
    'Student_Phone', 'Student_Gender', 'Student_Date_of_Birth',
    'Parent_First_Name', 'Parent_Last_Name', 'Parent_Username',
    'Parent_Phone', 'Parent_Gender', 'Parent_Birth_Date',
    'Admission_Date', 'Class_ID'
  ];
  
  const missing = required.filter(field => !studentData[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

function transformExcelDataToAPIFormat(row) {
  // Clean and validate the data
  const cleanData = {};
  Object.keys(row).forEach(key => {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') {
      cleanData[key] = value;
    }
  });
  
  validateRequiredFields(cleanData);
  
  // Transform to API format
  const apiData = {
    classId: parseInt(cleanData.Class_ID),
    admissionDate: cleanData.Admission_Date,
    bloodGroup: cleanData.Blood_Group,
    nationality: cleanData.Nationality,
    religion: cleanData.Religion,
    caste: cleanData.Caste,
    aadharNo: cleanData.Aadhar_No,
    bankAccountNo: cleanData.Bank_Account_No,
    bankName: cleanData.Bank_Name,
    ifscCode: cleanData.IFSC_Code,
    previousSchool: cleanData.Previous_School,
    
    // Origin Address
    originAddress: cleanData.Origin_Address,
    originCity: cleanData.Origin_City,
    originState: cleanData.Origin_State,
    originProvince: cleanData.Origin_Province,
    originCountry: cleanData.Origin_Country,
    originPostalCode: cleanData.Origin_Postal_Code,
    
    // Current Address
    currentAddress: cleanData.Current_Address,
    currentCity: cleanData.Current_City,
    currentState: cleanData.Current_State,
    currentProvince: cleanData.Current_Province,
    currentCountry: cleanData.Current_Country,
    currentPostalCode: cleanData.Current_Postal_Code,
    
    // Student User Data
    user: {
      firstName: cleanData.Student_First_Name,
      middleName: cleanData.Student_Middle_Name,
      lastName: cleanData.Student_Last_Name,
      displayName: cleanData.Student_Display_Name,
      username: cleanData.Student_Username,
      phone: cleanData.Student_Phone,
      gender: cleanData.Student_Gender.toUpperCase(),
      dateOfBirth: cleanData.Student_Date_of_Birth,
      tazkiraNo: cleanData.Student_Tazkira_No,
      bio: cleanData.Student_Bio,
      role: 'STUDENT'
    },
    
    // Parent Data
    parent: {
      firstName: cleanData.Parent_First_Name,
      middleName: cleanData.Parent_Middle_Name,
      lastName: cleanData.Parent_Last_Name,
      displayName: cleanData.Parent_Display_Name,
      username: cleanData.Parent_Username,
      phone: cleanData.Parent_Phone,
      gender: cleanData.Parent_Gender.toUpperCase(),
      dateOfBirth: cleanData.Parent_Birth_Date,
      tazkiraNo: cleanData.Parent_Tazkira_No,
      bio: cleanData.Parent_Bio,
      occupation: cleanData.Occupation,
      annualIncome: cleanData.Annual_Income,
      education: cleanData.Education,
      employer: cleanData.Employer,
      designation: cleanData.Designation,
      workPhone: cleanData.Work_Phone,
      emergencyContact: cleanData.Emergency_Contact,
      relationship: cleanData.Relationship,
      isGuardian: cleanData.Is_Guardian === 'true',
      isEmergencyContact: cleanData.Is_Emergency_Contact === 'true',
      role: 'PARENT'
    }
  };
  
  return apiData;
}

async function createStudent(apiData, index) {
  try {
    log(`Creating student ${index + 1}: ${apiData.user.firstName} ${apiData.user.lastName}`);
    
    const response = await axios.post(`${CONFIG.API_BASE_URL}/students`, apiData, {
      headers: {
        'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
    
    if (response.data.success) {
      log(`✅ Student created successfully: ${apiData.user.firstName} ${apiData.user.lastName}`, 'success');
      return { success: true, data: response.data };
    } else {
      throw new Error(response.data.message || 'API returned success: false');
    }
    
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
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
      const apiData = transformExcelDataToAPIFormat(student);
      const result = await createStudent(apiData, globalIndex);
      results.push(result);
      
      if (result.success) {
        logData.successful++;
      } else {
        logData.failed++;
      }
      
      // Small delay between individual requests
      await delay(200);
      
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
    log('🚀 Starting bulk student import process...');
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