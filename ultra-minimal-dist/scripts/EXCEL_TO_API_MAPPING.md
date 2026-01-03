# Excel Column to API Request Mapping

This document shows the exact mapping between Excel columns and the API request format for bulk student import.

## Excel Columns (Required Fields marked with *)

| Excel Column | API Field | Description |
|--------------|-----------|-------------|
| **Role number** | - | Not used in API |
| **Student_First_Name*** | `user.firstName` | Student's first name |
| **Parent_First_Name*** | `parent.user.firstName` | Parent's first name |
| **parent_father_name** | `parent.user.middleName` | Parent's father name (middle name) |
| **Class_ID*** | `classId` | Class ID for student enrollment |
| **Student_Last_Name*** | `user.lastName` | Student's last name |
| **Parent_Last_Name*** | `parent.user.lastName` | Parent's last name |
| **Origin_Province** | `originProvince` | Student's origin province |
| **Origin_Address** | `originAddress` | Student's origin address |
| **Origin_City** | `originCity` | Student's origin city |
| **Current_State** | `currentState` | Student's current state |
| **Current_Province** | `currentProvince` | Student's current province |
| **Current_Address** | `currentAddress` | Student's current address |
| **Current_City** | `currentCity` | Student's current city |
| **Student_Date_of_Birth*** | `user.dateOfBirth` | Student's date of birth |
| **Student_Tazkira_No** | `user.tazkiraNo` | Student's Tazkira number |
| **Student_Gender*** | `user.gender` | Student's gender (MALE/FEMALE) |
| **Caste** | - | Not used in API |
| **Previous_School** | `previousSchool` | Student's previous school |
| **Parent_Phone*** | `parent.user.phone` | Parent's phone number |
| **Student_Phone*** | `user.phone` | Student's phone number |
| **Admission_Date*** | `admissionDate` | Student's admission date |
| **Nationality** | `nationality` | Student's nationality |
| **Religion** | `religion` | Student's religion |
| **Parent_Gender*** | `parent.user.gender` | Parent's gender (MALE/FEMALE) |
| **Parent_Birth_Date*** | `parent.user.birthDate` | Parent's birth date |
| **Parent_Tazkira_No** | `parent.user.tazkiraNo` | Parent's Tazkira number |
| **Occupation** | `parent.occupation` | Parent's occupation |
| **Origin_Address.1** | `originAddress` (fallback) | Alternative origin address |
| **Origin_City.1** | `originCity` (fallback) | Alternative origin city |
| **Origin_Country** | `originCountry` | Student's origin country |
| **Current_Country** | `currentCountry` | Student's current country |
| **Current_Postal_Code** | `currentPostalCode` | Student's current postal code |
| **Student_Username*** | `user.username` | Student's username |
| **Parent_Username*** | `parent.user.username` | Parent's username |

## API Request Structure

```json
{
  "schoolId": 1,
  "classId": 123,
  "admissionDate": "2024-01-15",
  "nationality": "Afghan",
  "religion": "Islam",
  "tazkiraNo": "ST123456789",
  "previousSchool": "Previous School Name",
  
  "originAddress": "456 Original Street, Hometown",
  "originCity": "Lahore",
  "originProvince": "Punjab",
  "originCountry": "Afghanistan",
  
  "currentAddress": "789 Current Street, School Area",
  "currentCity": "Karachi",
  "currentState": "Sindh",
  "currentProvince": "Sindh",
  "currentCountry": "Afghanistan",
  "currentPostalCode": "75000",
  
  "user": {
    "firstName": "Student First Name",
    "lastName": "Student Last Name",
    "phone": "+93XXXXXXXXX",
    "gender": "MALE",
    "dateOfBirth": "2010-01-01",
    "address": "Current Address",
    "city": "Current City",
    "state": "Current State",
    "country": "Afghanistan",
    "postalCode": "75000",
    "tazkiraNo": "ST123456789",
    "username": "student_username"
  },
  
  "parent": {
    "user": {
      "firstName": "Parent First Name",
      "lastName": "Parent Last Name",
      "phone": "+93XXXXXXXXX",
      "gender": "MALE",
      "birthDate": "1980-01-01",
      "address": "Current Address",
      "city": "Current City",
      "state": "Current State",
      "country": "Afghanistan",
      "postalCode": "75000",
      "tazkiraNo": "PT123456789",
      "username": "parent_username"
    },
    "occupation": "Software Engineer",
    "relationship": "Father",
    "isGuardian": true,
    "isEmergencyContact": true
  }
}
```

## Validation Rules

### Required Fields
- Student_First_Name*
- Student_Last_Name*
- Student_Gender*
- Student_Date_of_Birth*
- Parent_First_Name*
- Parent_Last_Name*
- Parent_Gender*
- Parent_Birth_Date*
- Admission_Date*
- Class_ID*
- Parent_Phone*
- Student_Phone*
- Student_Username*
- Parent_Username*

### Data Transformations
1. **Gender**: Converted to uppercase (MALE/FEMALE)
2. **Class_ID**: Converted to integer
3. **Postal Codes**: Converted to strings
4. **Phone Numbers**: Used as-is from Excel
5. **Usernames**: Used as-is from Excel (no auto-generation)
6. **Addresses**: Current address used for both student and parent user addresses
7. **Fallback Logic**: Origin_Address.1 and Origin_City.1 used as fallbacks

### Default Values
- `nationality`: "Afghan"
- `religion`: "Islam"
- `originCountry`: "Afghanistan"
- `currentCountry`: "Afghanistan"
- `timezone`: "Asia/Kabul"
- `locale`: "en-AF"
- `relationship`: "Father"
- `isGuardian`: true
- `isEmergencyContact`: true

## Error Handling

The script will:
1. Validate all required fields are present
2. Skip records with missing required data
3. Log detailed error information
4. Continue processing remaining records
5. Generate comprehensive import reports

## Usage

```bash
# Set environment variables
export AUTH_TOKEN="your_jwt_token_here"
export SCHOOL_ID="1"

# Run the import
node scripts/bulk-import-students-exact.js
```

The script will process the `Student_Data_Cleaned.xlsx` file and create students using the exact API format specified in `request.json`.