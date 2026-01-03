#!/usr/bin/env python3
import pandas as pd
import os
import sys

# Write to file instead of stdout
with open('debug_output.txt', 'w') as f:
    f.write("Starting Excel debug...\n")
    f.flush()
    
    try:
        f.write("Current directory: " + os.getcwd() + "\n")
        f.write("Files in directory: " + str(os.listdir('.')) + "\n")
        f.flush()
        
        f.write("Loading Excel file...\n")
        df = pd.read_excel('./Student_Data_Cleaned.xlsx')
        f.write(f"Successfully loaded {len(df)} rows\n")
        f.write(f"Columns: {list(df.columns)}\n")
        f.flush()
        
        if len(df) > 0:
            f.write("First row data:\n")
            row = df.iloc[0]
            for col in df.columns:
                f.write(f"  {col}: {row[col]}\n")
            f.flush()
            
    except Exception as e:
        f.write(f"Error: {e}\n")
        import traceback
        f.write(traceback.format_exc() + "\n")
        f.flush()

print("Debug complete - check debug_output.txt")