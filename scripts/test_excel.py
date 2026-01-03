#!/usr/bin/env python3
import pandas as pd
import os

print('Testing Excel file loading...')
print('Current directory:', os.getcwd())
print('Files in directory:', os.listdir('.'))

try:
    df = pd.read_excel('./Student_Data_Cleaned.xlsx')
    print(f'Successfully loaded {len(df)} rows')
    print('Columns:', list(df.columns))
    print('First few rows:')
    print(df.head(2))
except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()