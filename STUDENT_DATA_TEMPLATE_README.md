# Student Data Insertion Templates

This directory contains Excel and CSV templates for bulk student data insertion based on the AddStudentModal component.

## 📁 Files Included

1. **`Student_Data_Template.xlsx`** - Complete Excel template with multiple sheets
2. **`Student_Data_Template.csv`** - Simple CSV template for easy data entry
3. **`create_student_excel_template.py`** - Python script to regenerate the Excel template

## 📊 Excel Template Structure

The Excel file contains 5 sheets:

### 1. Student_Data Sheet
Contains all student-related fields:
- **Required Fields** (marked with *): First Name, Last Name, Username, Phone, Gender, Date of Birth, Admission Date, Class ID
- **Optional Fields**: Middle Name, Display Name, Bio, Blood Group, Nationality, Religion, Caste, Tazkira No, Bank details, Previous School

### 2. Parent_Data Sheet
Contains all parent-related fields:
- **Required Fields** (marked with *): First Name, Last Name, Username, Phone, Gender, Birth Date
- **Optional Fields**: Middle Name, Display Name, Bio, Tazkira No, Occupation, Annual Income, Education, Employer, Designation, Work Phone, Emergency Contact, Relationship

### 3. Address_Data Sheet
Contains address information:
- **Origin Address**: Complete address details for student's origin
- **Current Address**: Complete address details for student's current residence

### 4. Instructions Sheet
Comprehensive guidelines for using the template:
- Required vs optional fields
- Data format specifications
- Validation rules
- Sample data examples

### 5. Sample_Data Sheet
Pre-filled example data showing proper formatting and structure.

## 📋 CSV Template Structure

The CSV file combines all fields in a single row per student, making it easier for bulk data entry. Each row represents one complete student record with their parent and address information.

## 🎨 Visual Features

### Color Coding
- **🔴 Red Headers**: Required fields (must be filled)
- **🟢 Green Headers**: Optional fields
- **🔵 Blue Headers**: Address fields

### Formatting
- Bold headers for easy identification
- Proper column widths for readability
- Centered alignment for better presentation

## 📝 Data Format Requirements

### Required Formats
- **Dates**: YYYY-MM-DD (e.g., 2024-01-15)
- **Phone Numbers**: Include country code (e.g., +923001234567)
- **Gender**: MALE, FEMALE, or OTHER
- **Class ID**: Numeric value (e.g., 1, 2, 3)
- **Relationship**: Father, Mother, Guardian, or Other
- **Boolean Fields**: true or false

### Validation Rules
- **Usernames**: Alphanumeric, no spaces, must be unique
- **Phone Numbers**: Must include country code
- **Dates**: Valid date format
- **Gender**: Must be one of the specified values
- **Class ID**: Must be a valid class ID from your system

## 🚀 How to Use

### Option 1: Excel Template
1. Open `Student_Data_Template.xlsx`
2. Navigate to the appropriate sheet (Student_Data, Parent_Data, Address_Data)
3. Fill in the data row by row
4. Follow the color coding (red = required, green = optional)
5. Refer to the Instructions sheet for guidance
6. Use the Sample_Data sheet as reference

### Option 2: CSV Template
1. Open `Student_Data_Template.csv` in Excel or any spreadsheet software
2. Each row represents one complete student record
3. Fill in all required fields (marked with *)
4. Follow the data format requirements
5. Save the file when complete

### Option 3: Regenerate Template
If you need to modify the template structure:
```bash
python3 create_student_excel_template.py
```

## 📊 Sample Data Structure

Here's an example of how data should be structured:

```csv
Student_First_Name*,Student_Last_Name*,Student_Username*,Student_Phone*,Student_Gender*,Student_Date_of_Birth*,Admission_Date*,Class_ID*,Parent_First_Name*,Parent_Last_Name*,Parent_Username*,Parent_Phone*,Parent_Gender*,Parent_Birth_Date*
Ahmed,Khan,ahmed_khan_2024,+923001234567,MALE,2010-05-15,2024-01-15,1,Muhammad,Khan,muhammad_khan_parent,+923001234568,MALE,1980-03-20
```

## ⚠️ Important Notes

1. **Required Fields**: All fields marked with * must be filled
2. **Unique Usernames**: Each student and parent must have a unique username
3. **Phone Format**: Always include country code (+92 for Pakistan)
4. **Date Format**: Use YYYY-MM-DD format consistently
5. **Class ID**: Must correspond to existing classes in your system
6. **Data Consistency**: Keep related data consistent across all fields

## 🔧 Customization

To modify the template structure:
1. Edit the Python script `create_student_excel_template.py`
2. Modify the header arrays and sample data
3. Run the script to regenerate the Excel file
4. The script will automatically apply styling and formatting

## 📞 Support

If you need help with:
- Template structure modifications
- Data format issues
- Bulk import procedures
- Field mapping

Please refer to the Instructions sheet in the Excel file or check the AddStudentModal component for field specifications.

## 🎯 Next Steps

1. **Fill the template** with your student data
2. **Validate the data** against the format requirements
3. **Import the data** into your system using the appropriate API endpoints
4. **Verify the import** by checking the created records

---

**Created based on**: `frontend/src/features/students/components/AddStudentModal.tsx`
**Last Updated**: January 2024
**Version**: 1.0 