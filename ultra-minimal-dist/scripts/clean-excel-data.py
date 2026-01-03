#!/usr/bin/env python3
"""
Excel Data Cleaner for SMS Bulk Import
This script cleans and prepares Excel data for bulk student import.
"""

import pandas as pd
import numpy as np
import os
import sys
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('excel-cleanup.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class ExcelDataCleaner:
    def __init__(self, input_file='Student_Data_Template.xlsx', output_file='Student_Data_Cleaned.xlsx'):
        self.input_file = input_file
        self.output_file = output_file
        self.original_data = None
        self.cleaned_data = None
        
    def load_data(self):
        """Load data from Excel file"""
        try:
            logger.info(f"Loading data from {self.input_file}")
            
            # Read the first sheet (Student_Data)
            self.original_data = pd.read_excel(self.input_file, sheet_name=0)
            
            logger.info(f"Loaded {len(self.original_data)} rows and {len(self.original_data.columns)} columns")
            logger.info(f"Columns: {list(self.original_data.columns)}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error loading Excel file: {e}")
            return False
    
    def remove_empty_columns(self):
        """Remove columns that have no data or only empty values"""
        if self.original_data is None:
            logger.error("No data loaded")
            return False
            
        logger.info("Removing empty columns...")
        
        # Count non-empty values in each column
        non_empty_counts = self.original_data.count()
        
        # Find columns with no data (all empty)
        empty_columns = non_empty_counts[non_empty_counts == 0].index.tolist()
        
        if empty_columns:
            logger.info(f"Removing {len(empty_columns)} empty columns: {empty_columns}")
            self.original_data = self.original_data.drop(columns=empty_columns)
        else:
            logger.info("No empty columns found")
        
        logger.info(f"After removing empty columns: {len(self.original_data.columns)} columns remaining")
        return True
    
    def remove_duplicates(self):
        """Remove duplicate rows based on specified fields"""
        if self.original_data is None:
            logger.error("No data loaded")
            return False
            
        logger.info("Removing duplicate rows...")
        
        # Fields to check for duplicates
        duplicate_fields = [
            'Student_First_Name*',
            'Parent_First_Name*', 
            'Student_Phone*',
            'Parent_Phone*'
        ]
        
        # Check which fields exist in the data
        existing_fields = [field for field in duplicate_fields if field in self.original_data.columns]
        
        if not existing_fields:
            logger.warning("None of the specified duplicate check fields found in the data")
            return True
        
        logger.info(f"Checking duplicates based on: {existing_fields}")
        
        # Count rows before deduplication
        rows_before = len(self.original_data)
        
        # Remove duplicates based on the specified fields
        self.original_data = self.original_data.drop_duplicates(subset=existing_fields, keep='first')
        
        # Count rows after deduplication
        rows_after = len(self.original_data)
        removed_duplicates = rows_before - rows_after
        
        logger.info(f"Removed {removed_duplicates} duplicate rows")
        logger.info(f"Rows: {rows_before} -> {rows_after}")
        
        return True
    
    def clean_data(self):
        """Clean and standardize the data"""
        if self.original_data is None:
            logger.error("No data loaded")
            return False
            
        logger.info("Cleaning data...")
        
        # Create a copy for cleaning
        self.cleaned_data = self.original_data.copy()
        
        # Clean string columns
        string_columns = self.cleaned_data.select_dtypes(include=['object']).columns
        
        for col in string_columns:
            # Remove leading/trailing whitespace
            self.cleaned_data[col] = self.cleaned_data[col].astype(str).str.strip()
            
            # Replace empty strings with NaN
            self.cleaned_data[col] = self.cleaned_data[col].replace('', np.nan)
            self.cleaned_data[col] = self.cleaned_data[col].replace('nan', np.nan)
            self.cleaned_data[col] = self.cleaned_data[col].replace('None', np.nan)
        
        # Clean specific fields
        self._clean_names()
        self._clean_phones()
        self._clean_dates()
        self._clean_gender()
        
        logger.info("Data cleaning completed")
        return True
    
    def _clean_names(self):
        """Clean name fields"""
        name_fields = [
            'Student_First_Name*', 'Student_Middle_Name', 'Student_Last_Name*',
            'Parent_First_Name*', 'Parent_Middle_Name', 'Parent_Last_Name*'
        ]
        
        for field in name_fields:
            if field in self.cleaned_data.columns:
                # Capitalize first letter of each word
                self.cleaned_data[field] = self.cleaned_data[field].str.title()
    
    def _clean_phones(self):
        """Clean phone number fields"""
        phone_fields = ['Student_Phone*', 'Parent_Phone*', 'Work_Phone', 'Emergency_Contact']
        
        for field in phone_fields:
            if field in self.cleaned_data.columns:
                # Remove spaces and special characters except + and digits
                self.cleaned_data[field] = self.cleaned_data[field].astype(str).str.replace(r'[^\d+]', '', regex=True)
                
                # Ensure it starts with + if it's a phone number
                def format_phone(phone):
                    if pd.isna(phone) or phone == 'nan':
                        return phone
                    phone = str(phone).strip()
                    if phone and not phone.startswith('+'):
                        # Assume Pakistan number if no country code
                        if len(phone) == 11 and phone.startswith('03'):
                            phone = '+92' + phone[1:]
                        elif len(phone) == 10 and phone.startswith('3'):
                            phone = '+92' + phone
                        else:
                            phone = '+92' + phone
                    return phone
                
                self.cleaned_data[field] = self.cleaned_data[field].apply(format_phone)
    
    def _clean_dates(self):
        """Clean date fields"""
        date_fields = ['Student_Date_of_Birth*', 'Parent_Birth_Date*', 'Admission_Date*']
        
        for field in date_fields:
            if field in self.cleaned_data.columns:
                # Convert to datetime and format as YYYY-MM-DD
                try:
                    self.cleaned_data[field] = pd.to_datetime(self.cleaned_data[field], errors='coerce')
                    self.cleaned_data[field] = self.cleaned_data[field].dt.strftime('%Y-%m-%d')
                except Exception as e:
                    logger.warning(f"Could not clean date field {field}: {e}")
    
    def _clean_gender(self):
        """Clean gender fields"""
        gender_fields = ['Student_Gender*', 'Parent_Gender*']
        
        for field in gender_fields:
            if field in self.cleaned_data.columns:
                # Standardize gender values
                gender_mapping = {
                    'M': 'MALE',
                    'F': 'FEMALE',
                    'Male': 'MALE',
                    'Female': 'FEMALE',
                    'male': 'MALE',
                    'female': 'FEMALE',
                    'MALE': 'MALE',
                    'FEMALE': 'FEMALE'
                }
                
                self.cleaned_data[field] = self.cleaned_data[field].map(gender_mapping).fillna(self.cleaned_data[field])
    
    def validate_data(self):
        """Validate the cleaned data"""
        if self.cleaned_data is None:
            logger.error("No cleaned data available")
            return False
            
        logger.info("Validating data...")
        
        # Map your actual column names to expected format
        self._map_column_names()
        
        # Generate missing required fields
        self._generate_missing_fields()
        
        # Required fields - updated based on actual Excel format
        required_fields = [
            'Student_First_Name*', 'Student_Last_Name*', 
            'Student_Phone*', 'Student_Gender*', 'Student_Date_of_Birth*',
            'Parent_First_Name*', 'Parent_Last_Name*', 
            'Parent_Phone*', 'Parent_Gender*', 'Parent_Birth_Date*',
            'Admission_Date*'
        ]
        
        # Check for missing required fields
        missing_fields = [field for field in required_fields if field not in self.cleaned_data.columns]
        
        if missing_fields:
            logger.error(f"Missing required fields: {missing_fields}")
            return False
        
        # Check for rows with missing required data - be more lenient
        # Only remove rows that are completely empty or missing critical fields
        critical_fields = ['Student_First_Name*', 'Student_Last_Name*', 'Student_Phone*', 'Parent_Phone*']
        critical_missing = self.cleaned_data[critical_fields].isnull().all(axis=1)
        critical_missing_count = critical_missing.sum()
        
        if critical_missing_count > 0:
            logger.warning(f"Found {critical_missing_count} rows with missing critical data")
            # Remove only completely empty rows
            self.cleaned_data = self.cleaned_data[~critical_missing]
            logger.info(f"Removed {critical_missing_count} completely empty rows")
        
        # Check for rows with some missing required data but keep them
        missing_data = self.cleaned_data[required_fields].isnull().any(axis=1)
        missing_count = missing_data.sum()
        
        if missing_count > 0:
            logger.info(f"Found {missing_count} rows with some missing optional data - keeping them")
            # Fill missing required fields with defaults
            self._fill_missing_required_fields()
        
        logger.info(f"Validation completed. Final dataset: {len(self.cleaned_data)} rows")
        return True
    
    def _map_column_names(self):
        """Map actual column names to expected format"""
        logger.info("Mapping column names...")
        
        # Column mapping based on your actual Excel format
        column_mapping = {
            'Class': 'Class_ID*',  # Map 'Class' to 'Class_ID*'
            'parent_father_name': 'Parent_First_Name*',  # If this is the parent name
        }
        
        # Rename columns that exist
        for old_name, new_name in column_mapping.items():
            if old_name in self.cleaned_data.columns and new_name not in self.cleaned_data.columns:
                self.cleaned_data = self.cleaned_data.rename(columns={old_name: new_name})
                logger.info(f"Mapped column: {old_name} -> {new_name}")
    
    def _generate_missing_fields(self):
        """Generate missing required fields"""
        logger.info("Generating missing fields...")
        
        # Generate Student_Username* if missing
        if 'Student_Username*' not in self.cleaned_data.columns:
            logger.info("Generating Student_Username* field...")
            def generate_student_username(row):
                first_name = str(row['Student_First_Name*']) if pd.notna(row['Student_First_Name*']) else 'student'
                last_name = str(row['Student_Last_Name*']) if pd.notna(row['Student_Last_Name*']) else 'user'
                return f"{first_name.lower()}_{last_name.lower()}_{row.name + 1}"
            
            self.cleaned_data['Student_Username*'] = self.cleaned_data.apply(generate_student_username, axis=1)
        
        # Generate Parent_Username* if missing
        if 'Parent_Username*' not in self.cleaned_data.columns:
            logger.info("Generating Parent_Username* field...")
            def generate_parent_username(row):
                first_name = str(row['Parent_First_Name*']) if pd.notna(row['Parent_First_Name*']) else 'parent'
                last_name = str(row['Parent_Last_Name*']) if pd.notna(row['Parent_Last_Name*']) else 'user'
                return f"{first_name.lower()}_{last_name.lower()}_parent_{row.name + 1}"
            
            self.cleaned_data['Parent_Username*'] = self.cleaned_data.apply(generate_parent_username, axis=1)
        
        # Generate Class_ID* if missing (default to 1)
        if 'Class_ID*' not in self.cleaned_data.columns:
            logger.info("Generating Class_ID* field (default: 1)...")
            self.cleaned_data['Class_ID*'] = 1
    
    def _fill_missing_required_fields(self):
        """Fill missing required fields with sensible defaults"""
        logger.info("Filling missing required fields with defaults...")
        
        # Fill missing gender fields
        if 'Student_Gender*' in self.cleaned_data.columns:
            self.cleaned_data['Student_Gender*'] = self.cleaned_data['Student_Gender*'].fillna('MALE')
        
        if 'Parent_Gender*' in self.cleaned_data.columns:
            self.cleaned_data['Parent_Gender*'] = self.cleaned_data['Parent_Gender*'].fillna('MALE')
        
        # Fill missing dates with defaults
        if 'Student_Date_of_Birth*' in self.cleaned_data.columns:
            self.cleaned_data['Student_Date_of_Birth*'] = self.cleaned_data['Student_Date_of_Birth*'].fillna('2010-01-01')
        
        if 'Parent_Birth_Date*' in self.cleaned_data.columns:
            self.cleaned_data['Parent_Birth_Date*'] = self.cleaned_data['Parent_Birth_Date*'].fillna('1980-01-01')
        
        if 'Admission_Date*' in self.cleaned_data.columns:
            self.cleaned_data['Admission_Date*'] = self.cleaned_data['Admission_Date*'].fillna('2024-01-01')
        
        # Fill missing names with defaults
        if 'Student_First_Name*' in self.cleaned_data.columns:
            self.cleaned_data['Student_First_Name*'] = self.cleaned_data['Student_First_Name*'].fillna('Student')
        
        if 'Student_Last_Name*' in self.cleaned_data.columns:
            self.cleaned_data['Student_Last_Name*'] = self.cleaned_data['Student_Last_Name*'].fillna('User')
        
        if 'Parent_First_Name*' in self.cleaned_data.columns:
            self.cleaned_data['Parent_First_Name*'] = self.cleaned_data['Parent_First_Name*'].fillna('Parent')
        
        if 'Parent_Last_Name*' in self.cleaned_data.columns:
            self.cleaned_data['Parent_Last_Name*'] = self.cleaned_data['Parent_Last_Name*'].fillna('User')
        
        logger.info("Finished filling missing required fields")
    
    def save_cleaned_data(self):
        """Save the cleaned data to a new Excel file"""
        if self.cleaned_data is None:
            logger.error("No cleaned data to save")
            return False
            
        try:
            logger.info(f"Saving cleaned data to {self.output_file}")
            
            # Create a new Excel writer
            with pd.ExcelWriter(self.output_file, engine='openpyxl') as writer:
                # Write the cleaned data
                self.cleaned_data.to_excel(writer, sheet_name='Student_Data_Cleaned', index=False)
                
                # Create a summary sheet
                self._create_summary_sheet(writer)
            
            logger.info(f"Successfully saved cleaned data to {self.output_file}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving file: {e}")
            return False
    
    def _create_summary_sheet(self, writer):
        """Create a summary sheet with statistics"""
        summary_data = {
            'Metric': [
                'Total Rows',
                'Total Columns',
                'Required Fields Present',
                'Optional Fields Present',
                'Date Created',
                'Original File',
                'Cleaning Actions'
            ],
            'Value': [
                len(self.cleaned_data),
                len(self.cleaned_data.columns),
                len([col for col in self.cleaned_data.columns if '*' in col]),
                len([col for col in self.cleaned_data.columns if '*' not in col]),
                datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                self.input_file,
                'Removed empty columns, duplicates, cleaned data'
            ]
        }
        
        summary_df = pd.DataFrame(summary_data)
        summary_df.to_excel(writer, sheet_name='Summary', index=False)
    
    def generate_report(self):
        """Generate a detailed report of the cleaning process"""
        report_file = 'excel-cleanup-report.txt'
        
        with open(report_file, 'w') as f:
            f.write("EXCEL DATA CLEANUP REPORT\n")
            f.write("=" * 50 + "\n\n")
            f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Input File: {self.input_file}\n")
            f.write(f"Output File: {self.output_file}\n\n")
            
            if self.original_data is not None:
                f.write(f"Original Data:\n")
                f.write(f"  Rows: {len(self.original_data)}\n")
                f.write(f"  Columns: {len(self.original_data.columns)}\n")
                f.write(f"  Columns: {list(self.original_data.columns)}\n\n")
            
            if self.cleaned_data is not None:
                f.write(f"Cleaned Data:\n")
                f.write(f"  Rows: {len(self.cleaned_data)}\n")
                f.write(f"  Columns: {len(self.cleaned_data.columns)}\n")
                f.write(f"  Columns: {list(self.cleaned_data.columns)}\n\n")
                
                # Show sample data
                f.write("Sample Data (first 3 rows):\n")
                f.write(self.cleaned_data.head(3).to_string())
                f.write("\n\n")
        
        logger.info(f"Report saved to {report_file}")
    
    def run_cleanup(self):
        """Run the complete cleanup process"""
        logger.info("Starting Excel data cleanup process...")
        
        # Step 1: Load data
        if not self.load_data():
            return False
        
        # Step 2: Remove empty columns
        if not self.remove_empty_columns():
            return False
        
        # Step 3: Remove duplicates
        if not self.remove_duplicates():
            return False
        
        # Step 4: Clean data
        if not self.clean_data():
            return False
        
        # Step 5: Validate data
        if not self.validate_data():
            return False
        
        # Step 6: Save cleaned data
        if not self.save_cleaned_data():
            return False
        
        # Step 7: Generate report
        self.generate_report()
        
        logger.info("Excel data cleanup completed successfully!")
        return True

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Clean Excel data for SMS bulk import')
    parser.add_argument('--input', '-i', default='Student_Data_Template.xlsx', 
                       help='Input Excel file (default: Student_Data_Template.xlsx)')
    parser.add_argument('--output', '-o', default='Student_Data_Cleaned.xlsx',
                       help='Output Excel file (default: Student_Data_Cleaned.xlsx)')
    
    args = parser.parse_args()
    
    # Check if input file exists
    if not os.path.exists(args.input):
        logger.error(f"Input file not found: {args.input}")
        sys.exit(1)
    
    # Create cleaner and run
    cleaner = ExcelDataCleaner(args.input, args.output)
    success = cleaner.run_cleanup()
    
    if success:
        logger.info("✅ Cleanup completed successfully!")
        logger.info(f"📁 Cleaned file: {args.output}")
        logger.info("📊 You can now run the bulk import script with the cleaned file")
    else:
        logger.error("❌ Cleanup failed!")
        sys.exit(1)

if __name__ == "__main__":
    main() 