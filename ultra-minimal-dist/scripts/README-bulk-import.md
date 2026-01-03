# Bulk Student Import Script

This script reads student data from the Excel template and imports it into your SMS system using the API.

## 📋 Prerequisites

1. **Excel File**: Make sure `Student_Data_Template.xlsx` is in the project root
2. **API Running**: Your SMS API should be running and accessible
3. **Auth Token**: You need a valid authentication token
4. **Dependencies**: Install required packages

## 🔧 Setup

### 1. Install Dependencies
```bash
npm install xlsx axios
```

### 2. Set Environment Variables
```bash
# Set your authentication token
export AUTH_TOKEN="your_jwt_token_here"

# Set your school ID
export SCHOOL_ID="1"

# Set your API URL (if different from localhost:3000)
export API_URL="http://your-api-url:3000/api"
```

### 3. Update Configuration (if needed)
Edit the `CONFIG` object in `bulk-import-students.js`:
- `API_BASE_URL`: Your API base URL
- `SCHOOL_ID`: Your school ID
- `BATCH_SIZE`: Number of students to process at once (default: 5)
- `DELAY_BETWEEN_BATCHES`: Delay between batches in milliseconds (default: 1000)

## 🚀 Usage

### Run the Script
```bash
node scripts/bulk-import-students.js
```

### With Environment Variables
```bash
AUTH_TOKEN="your_token" SCHOOL_ID="1" node scripts/bulk-import-students.js
```

## 📊 Excel File Format

The script expects the Excel file to have these columns:

### Required Fields (marked with *)
- `Student_First_Name*`
- `Student_Last_Name*`
- `Student_Username*`
- `Student_Phone*`
- `Student_Gender*`
- `Student_Date_of_Birth*`
- `Parent_First_Name*`
- `Parent_Last_Name*`
- `Parent_Username*`
- `Parent_Phone*`
- `Parent_Gender*`
- `Parent_Birth_Date*`
- `Admission_Date*`
- `Class_ID*`

### Optional Fields
- `Student_Middle_Name`
- `Student_Display_Name`
- `Student_Tazkira_No`
- `Student_Bio`
- `Blood_Group`
- `Nationality`
- `Religion`
- `Caste`
- `Aadhar_No`
- `Bank_Account_No`
- `Bank_Name`
- `IFSC_Code`
- `Previous_School`
- Address fields (Origin and Current)

## 📈 Output

### Console Output
The script provides real-time feedback:
```
[2024-01-15T10:30:00.000Z] INFO: 🚀 Starting bulk student import process...
[2024-01-15T10:30:00.100Z] INFO: 📁 Reading Excel file: ./Student_Data_Template.xlsx
[2024-01-15T10:30:00.200Z] INFO: 📊 Found 50 student records in Excel file
[2024-01-15T10:30:00.300Z] INFO: ✅ Student created successfully: Ahmed Khan
[2024-01-15T10:30:00.500Z] INFO: ❌ Failed to create student: Invalid phone format
```

### Log File
A detailed log is saved to `bulk-import-log.json`:
```json
{
  "startTime": "2024-01-15T10:30:00.000Z",
  "endTime": "2024-01-15T10:35:00.000Z",
  "totalRecords": 50,
  "successful": 48,
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

## ⚠️ Important Notes

1. **Unique Usernames**: Each student and parent must have unique usernames
2. **Phone Format**: Include country code (e.g., +923001234567)
3. **Date Format**: Use YYYY-MM-DD format
4. **Gender Values**: MALE, FEMALE, or OTHER
5. **Class ID**: Must exist in your system
6. **Rate Limiting**: The script processes students in batches to avoid overwhelming the server

## 🔍 Troubleshooting

### Common Issues

1. **"Excel file not found"**
   - Make sure `Student_Data_Template.xlsx` is in the project root

2. **"AUTH_TOKEN environment variable is required"**
   - Set your authentication token: `export AUTH_TOKEN="your_token"`

3. **"API connection failed"**
   - Check if your API is running
   - Verify the `API_BASE_URL` in the script

4. **"Missing required fields"**
   - Ensure all required fields (marked with *) are filled in the Excel file

5. **"Username already exists"**
   - Make sure usernames are unique across all students and parents

### Debug Mode
To see more detailed information, you can modify the script to log API requests:
```javascript
// Add this to the createStudent function
console.log('API Request:', JSON.stringify(apiData, null, 2));
```

## 🎯 Example Usage

```bash
# 1. Set environment variables
export AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export SCHOOL_ID="1"

# 2. Run the script
node scripts/bulk-import-students.js

# 3. Check the results
cat bulk-import-log.json
```

## 📞 Support

If you encounter issues:
1. Check the log file for detailed error information
2. Verify your Excel file format matches the template
3. Ensure your API is running and accessible
4. Validate your authentication token

---

**Created**: January 2024
**Version**: 1.0
**Compatible with**: SMS API v1.0+ 