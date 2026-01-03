# Bulk Import Script - Exact API Format

This script imports students using the **exact API format** you specified, creating both students and parents with their user accounts in a single API call.

## 🎯 **Key Features**

- ✅ **Exact API Format** - Matches your specified JSON structure exactly
- ✅ **Single API Call** - Creates student + parent + user accounts in one request
- ✅ **Batch Processing** - Processes students in small batches to avoid server overload
- ✅ **Comprehensive Logging** - Detailed progress and error tracking
- ✅ **Error Recovery** - Continues processing even if some records fail

## 📋 **API Format Used**

The script sends data in this exact format to `/api/students`:

```json
{
  "schoolId": 1,
  "admissionDate": "2024-01-15",
  "bloodGroup": "O+",
  "nationality": "Pakistani",
  "religion": "Islam",
  "tazkiraNo": "ST123456789",
  "bankAccountNo": "1234567890",
  "bankName": "HBL Bank",
  "previousSchool": "Previous School Name",
  
  "originAddress": "456 Original Street, Hometown",
  "originCity": "Lahore",
  "originState": "Punjab",
  "originProvince": "Punjab",
  "originCountry": "Pakistan",
  "originPostalCode": "54000",
  
  "currentAddress": "789 Current Street, School Area",
  "currentCity": "Karachi",
  "currentState": "Sindh",
  "currentProvince": "Sindh",
  "currentCountry": "Pakistan",
  "currentPostalCode": "75000",
  
  "user": {
    "firstName": "Student",
    "middleName": "Middle",
    "lastName": "Name",
    "displayName": "Student Name",
    "phone": "+923001234567",
    "gender": "MALE",
    "dateOfBirth": "2010-01-01",
    "address": "123 Test Street",
    "city": "Test City",
    "state": "Test State",
    "country": "Pakistan",
    "postalCode": "12345",
    "avatar": null,
    "bio": "Student bio",
    "timezone": "Asia/Kabul",
    "locale": "en-AF",
    "tazkiraNo": "ST123456789",
    "username": "student_username"
  },
  
  "parent": {
    "user": {
      "firstName": "Parent",
      "middleName": "Middle",
      "lastName": "Name",
      "displayName": "Parent Name",
      "phone": "+923001234568",
      "gender": "MALE",
      "birthDate": "1980-01-01",
      "address": "123 Test Street",
      "city": "Test City",
      "state": "Test State",
      "country": "Pakistan",
      "postalCode": "12345",
      "avatar": null,
      "bio": "Parent bio",
      "timezone": "Asia/Kabul",
      "locale": "en-AF",
      "tazkiraNo": "PT123456789",
      "username": "parent_username"
    },
    "occupation": "Software Engineer",
    "annualIncome": "150000",
    "education": "Master's Degree",
    "employer": "Tech Company",
    "designation": "Senior Developer",
    "workPhone": "+923001234569",
    "emergencyContact": "+923001234570",
    "relationship": "Father",
    "isGuardian": true,
    "isEmergencyContact": true
  }
}
```

## 🚀 **Usage**

### 1. Set Environment Variables
```bash
export AUTH_TOKEN="your_jwt_token_here"
export SCHOOL_ID="1"
```

### 2. Run the Script
```bash
node scripts/bulk-import-students-exact.js
```

### 3. Monitor Progress
```bash
# Watch real-time progress
tail -f bulk-import-exact-log.json
```

## ⚙️ **Configuration**

Edit the `CONFIG` object in the script:

```javascript
const CONFIG = {
  EXCEL_FILE_PATH: './Student_Data_Cleaned.xlsx',
  API_BASE_URL: 'http://localhost:3000/api', // Your API URL
  AUTH_TOKEN: process.env.AUTH_TOKEN || '',
  SCHOOL_ID: process.env.SCHOOL_ID || '1',
  BATCH_SIZE: 3, // Students per batch
  DELAY_BETWEEN_BATCHES: 2000, // 2 seconds between batches
  LOG_FILE: './bulk-import-exact-log.json'
};
```

## 📊 **Data Mapping**

The script maps Excel columns to API fields:

| Excel Column | API Field | Notes |
|--------------|-----------|-------|
| `Student_First_Name*` | `user.firstName` | Required |
| `Student_Last_Name*` | `user.lastName` | Required |
| `Student_Phone*` | `user.phone` | Required |
| `Student_Gender*` | `user.gender` | Required (MALE/FEMALE) |
| `Student_Date_of_Birth*` | `user.dateOfBirth` | Required (YYYY-MM-DD) |
| `Parent_First_Name*` | `parent.user.firstName` | Required |
| `Parent_Last_Name*` | `parent.user.lastName` | Required |
| `Parent_Phone*` | `parent.user.phone` | Required |
| `Parent_Gender*` | `parent.user.gender` | Required (MALE/FEMALE) |
| `Parent_Birth_Date*` | `parent.user.birthDate` | Required (YYYY-MM-DD) |
| `Admission_Date*` | `admissionDate` | Required (YYYY-MM-DD) |
| `Student_Tazkira_No` | `user.tazkiraNo` | Optional |
| `Parent_Tazkira_No` | `parent.user.tazkiraNo` | Optional |
| `Nationality` | `nationality` | Optional |
| `Religion` | `religion` | Optional |
| `Previous_School` | `previousSchool` | Optional |
| `Occupation` | `parent.occupation` | Optional |
| `Current_Address` | `currentAddress` + `user.address` | Optional |
| `Current_City` | `currentCity` + `user.city` | Optional |

## 📈 **Output**

### Console Output
```
[2024-01-15T10:30:00.000Z] INFO: 🚀 Starting bulk student import with exact API format...
[2024-01-15T10:30:00.100Z] INFO: 📁 Reading Excel file: ./Student_Data_Cleaned.xlsx
[2024-01-15T10:30:00.200Z] INFO: 📊 Found 314 student records in Excel file
[2024-01-15T10:30:00.300Z] INFO: ✅ Student created successfully: Anas Aimaq
[2024-01-15T10:30:00.500Z] INFO: ❌ Failed to create student: Invalid phone format
```

### Log File (`bulk-import-exact-log.json`)
```json
{
  "startTime": "2024-01-15T10:30:00.000Z",
  "endTime": "2024-01-15T10:35:00.000Z",
  "totalRecords": 314,
  "successful": 312,
  "failed": 2,
  "errors": [
    {
      "timestamp": "2024-01-15T10:30:00.500Z",
      "message": "Invalid phone format"
    }
  ],
  "details": [...]
}
```

## 🔍 **Troubleshooting**

### Common Issues

1. **"Excel file not found"**
   - Make sure `Student_Data_Cleaned.xlsx` exists
   - Run the cleaning script first: `python3 scripts/clean-excel-data.py`

2. **"AUTH_TOKEN environment variable is required"**
   - Set your authentication token: `export AUTH_TOKEN="your_token"`

3. **"API connection failed"**
   - Check if your API is running
   - Verify the `API_BASE_URL` in the script

4. **"Username already exists"**
   - The script generates unique usernames automatically
   - Check for duplicate data in your Excel file

### Debug Mode
To see the exact API requests being sent:
```javascript
// Add this line in the createStudentWithExactFormat function
console.log('API Request:', JSON.stringify(apiData, null, 2));
```

## ⚠️ **Important Notes**

1. **Single API Call** - Each student creation creates both student and parent in one request
2. **Batch Processing** - Processes 3 students at a time with 2-second delays
3. **Timeout** - 60-second timeout per request for complex creation
4. **Error Handling** - Continues processing even if some records fail
5. **Logging** - Detailed logs saved to `bulk-import-exact-log.json`

## 🎯 **Example Usage**

```bash
# 1. Clean the Excel data first
python3 scripts/clean-excel-data.py

# 2. Set environment variables
export AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export SCHOOL_ID="1"

# 3. Run the exact format import
node scripts/bulk-import-students-exact.js

# 4. Check results
cat bulk-import-exact-log.json
```

## 📞 **Support**

If you encounter issues:
1. Check the log file for detailed error information
2. Verify your Excel file format matches the cleaned template
3. Ensure your API is running and accessible
4. Validate your authentication token

---

**Created**: January 2024
**Version**: 1.0
**Compatible with**: SMS API v1.0+
**Format**: Exact API structure as specified 