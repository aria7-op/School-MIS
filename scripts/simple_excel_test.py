#!/usr/bin/env python3
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import pandas as pd
    print("Pandas imported successfully")
    
    # Test Excel file reading
    excel_file = './Student_Data_Cleaned.xlsx'
    print(f"Attempting to read: {excel_file}")
    
    if os.path.exists(excel_file):
        print("File exists")
        df = pd.read_excel(excel_file)
        print(f"Successfully loaded {len(df)} rows")
        print("Columns:", list(df.columns))
        
        # Show first row
        if len(df) > 0:
            print("First row data:")
            for col in df.columns:
                print(f"  {col}: {df.iloc[0][col]}")
    else:
        print("File does not exist")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()