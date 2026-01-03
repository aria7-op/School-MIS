# Complete Workflow: Excel Cleaning + Bulk Import

This guide covers the complete process from raw Excel data to bulk import into your SMS system.

## 📋 Overview

The workflow consists of two main steps:
1. **Excel Data Cleaning** (Python script)
2. **Bulk Import** (Node.js script)

## 🚀 Step-by-Step Process

### Step 1: Clean Excel Data

First, clean and prepare your Excel file:

```bash
# Run the Python cleaning script
python3 scripts/clean-excel-data.py

# Or with custom input/output files
python3 scripts/clean-excel-data.py --input "your_file.xlsx" --output "cleaned_file.xlsx"
```

**What the cleaning script does:**
- ✅ Removes empty columns
- ✅ Removes duplicate rows based on:
  - `Student_First_Name*`
  - `Parent_First_Name*`
  - `Student_Phone*`
  - `Parent_Phone*`
- ✅ Cleans and standardizes data:
  - Names (proper capitalization)
  - Phone numbers (adds country code)
  - Dates (YYYY-MM-DD format)
  - Gender (MALE/FEMALE)
- ✅ Validates required fields
- ✅ Generates detailed reports

**Output files:**
- `Student_Data_Cleaned.xlsx` - Cleaned data ready for import
- `excel-cleanup-report.txt` - Detailed cleaning report
- `excel-cleanup.log` - Process logs

### Step 2: Bulk Import

After cleaning, import the data:

```bash
# Set environment variables
export AUTH_TOKEN="your_jwt_token_here"
export SCHOOL_ID="1"

# Run the bulk import script
node scripts/bulk-import-students.js
```

**What the import script does:**
- ✅ Reads the cleaned Excel file
- ✅ Transforms data to API format
- ✅ Creates students and parents via API
- ✅ Handles errors and retries
- ✅ Provides real-time progress
- ✅ Generates detailed logs

**Output files:**
- `bulk-import-log.json` - Detailed import results

## 📊 Example Workflow

```bash
# 1. Clean the Excel data
python3 scripts/clean-excel-data.py

# 2. Check the cleaning report
cat excel-cleanup-report.txt

# 3. Set up environment
export AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export SCHOOL_ID="1"

# 4. Run bulk import
node scripts/bulk-import-students.js

# 5. Check results
cat bulk-import-log.json
```

## 🔧 Configuration

### Excel Cleaning Configuration

Edit `scripts/clean-excel-data.py` to modify:
- Duplicate check fields
- Data cleaning rules
- Validation requirements

### Bulk Import Configuration

Edit `scripts/bulk-import-students.js` to modify:
- `API_BASE_URL` - Your API endpoint
- `BATCH_SIZE` - Students per batch (default: 5)
- `DELAY_BETWEEN_BATCHES` - Delay between batches (default: 1000ms)

## 📈 Monitoring Progress

### During Cleaning
```bash
# Watch the cleaning process
tail -f excel-cleanup.log
```

### During Import
```bash
# Watch the import process
tail -f bulk-import-log.json
```

## 🔍 Troubleshooting

### Common Issues

1. **"Input file not found"**
   - Make sure your Excel file exists in the project root
   - Check the file path in the script

2. **"Missing required fields"**
   - Ensure your Excel file has all required columns
   - Check the template format

3. **"API connection failed"**
   - Verify your API is running
   - Check the `API_BASE_URL` configuration

4. **"Authentication failed"**
   - Ensure your `AUTH_TOKEN` is valid
   - Check token expiration

### Debug Mode

To see more details during import:
```bash
# Add debug logging
DEBUG=true node scripts/bulk-import-students.js
```

## 📋 Data Requirements

### Required Excel Columns
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

### Data Format Requirements
- **Dates**: YYYY-MM-DD
- **Phone**: +923001234567 (with country code)
- **Gender**: MALE, FEMALE, or OTHER
- **Class ID**: Numeric value
- **Usernames**: Unique alphanumeric values

## 🎯 Best Practices

1. **Test with small data first**
   - Use a few rows to test the process
   - Verify the results before full import

2. **Backup your data**
   - Keep original Excel files
   - Save cleaning reports

3. **Monitor system resources**
   - Large imports may take time
   - Check server performance

4. **Validate results**
   - Check created records in your system
   - Verify parent-student relationships

## 📞 Support

If you encounter issues:
1. Check the log files for detailed error information
2. Verify your Excel file format
3. Ensure your API is accessible
4. Validate your authentication token

---

**Created**: January 2024
**Version**: 1.0
**Compatible with**: SMS API v1.0+ 