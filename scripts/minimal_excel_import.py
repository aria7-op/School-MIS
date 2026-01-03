#!/usr/bin/env python3
"""
Minimal Excel import script for testing
"""
import pandas as pd
import requests
import json
import datetime as dt

# Configuration
API_BASE_URL = 'https://khwanzay.school/api'
SCHOOL_ID = 1
EXCEL_FILE = './Student_Data_Cleaned.xlsx'

def main():
    print("Starting Excel import test...")
    
    try:
        # Load Excel file
        print("Loading Excel file...")
        df = pd.read_excel(EXCEL_FILE)
        print(f"Loaded {len(df)} rows")
        print(f"Columns: {list(df.columns)}")
        
        # Show first row
        if len(df) > 0:
            print("\nFirst row:")
            row = df.iloc[0]
            for col in df.columns:
                print(f"  {col}: {row[col]}")
        
        # Test API call with first row
        print("\nTesting API call...")
        test_payload = {
            'schoolId': SCHOOL_ID,
            'admissionDate': '2025-09-01',
            'classId': 1,
            'user': {
                'firstName': str(row.get('Student_First_Name*', 'Test')),
                'lastName': str(row.get('Student_Last_Name*', 'Student')),
                'phone': '+93700000001',
                'gender': 'MALE',
                'dateOfBirth': '2010-01-01',
                'username': 'test_student_1'
            },
            'parent': {
                'user': {
                    'firstName': str(row.get('Parent_First_Name*', 'Test')),
                    'lastName': str(row.get('Parent_Last_Name*', 'Parent')),
                    'phone': '+93700000002',
                    'gender': 'MALE',
                    'birthDate': '1980-01-01',
                    'username': 'test_parent_1'
                },
                'occupation': 'Test',
                'relationship': 'Father'
            }
        }
        
        response = requests.post(f"{API_BASE_URL}/students", json=test_payload, timeout=10)
        print(f"API Response: {response.status_code}")
        print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()