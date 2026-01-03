#!/usr/bin/env python3
import os
import json
import time
import datetime as dt
from typing import List, Dict, Any, Optional
import pandas as pd
import requests


# Configuration
API_BASE_URL = os.environ.get('API_BASE_URL', 'https://khwanzay.school/api')
SCHOOL_ID = int(os.environ.get('SCHOOL_ID', '1'))
BATCH_SIZE = int(os.environ.get('BATCH_SIZE', '1'))
DELAY_BETWEEN_BATCHES_MS = int(os.environ.get('DELAY_MS', '500'))
EXCEL_FILE_PATH = os.environ.get('EXCEL_FILE', './Student_Data_Cleaned.xlsx')
LOG_FILE = os.environ.get('LOG_FILE', './import-students-from-excel-log.json')


def log_print(message: str):
    timestamp = dt.datetime.now(dt.timezone.utc).isoformat()
    print(f"[{timestamp}] {message}")


def safe_date(date_str: str, default: str = None) -> str:
    """Parse date string and return ISO format, or default if invalid."""
    if not date_str or str(date_str).strip() in ('', 'None', 'nan'):
        return default or dt.date.today().isoformat()
    
    try:
        # Handle various date formats
        date_str = str(date_str).strip()
        if '-' in date_str:
            parts = date_str.split('-')
            if len(parts) == 3:
                year, month, day = parts
                return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
        return default or dt.date.today().isoformat()
    except:
        return default or dt.date.today().isoformat()


def normalize_gender(gender: str) -> str:
    """Normalize gender to MALE/FEMALE."""
    if not gender:
        return 'MALE'
    gender = str(gender).strip().upper()
    if gender in ('M', 'MALE', 'MASCULINE'):
        return 'MALE'
    elif gender in ('F', 'FEMALE', 'FEMININE'):
        return 'FEMALE'
    return 'MALE'


def extract_trailing_numeric_id(class_id_str: str) -> Optional[int]:
    """Extract numeric ID from class code like 'CLS25-1-00026' -> 26, or '10' -> 10."""
    if not class_id_str:
        return None
    
    class_id_str = str(class_id_str).strip()
    
    # If it's already a number, return it
    try:
        return int(class_id_str)
    except ValueError:
        pass
    
    # Extract trailing digits from codes like "CLS25-1-00026" -> 26
    if '-' in class_id_str:
        try:
            # Get the last part after the last dash
            last_part = class_id_str.split('-')[-1]
            return int(last_part)
        except ValueError:
            pass
    
    return None


def generate_phone(index: int) -> str:
    """Generate a unique phone number."""
    return f"+93{700000000 + index}"


def generate_username(first_name: str, last_name: str, prefix: str, index: int) -> str:
    """Generate a unique username."""
    first = (first_name or '').lower().replace(' ', '_')
    last = (last_name or '').lower().replace(' ', '_')
    return f"{prefix}_{first}_{last}_{index}"


def transform_excel_row_to_api_payload(row: pd.Series, index: int) -> Dict[str, Any]:
    """Transform Excel row to API payload matching the SQL version exactly."""
    
    # Extract student data
    student_first = str(row.get('Student_First_Name*', '')).strip() or f"Student{index}"
    student_last = str(row.get('Student_Last_Name*', '')).strip() or f"Last{index}"
    
    # Extract parent data
    parent_first = str(row.get('Parent_First_Name*', '')).strip() or f"Parent{index}"
    parent_last = str(row.get('Parent_Last_Name*', '')).strip() or f"ParentLast{index}"
    
    # Phone numbers - use provided or generate
    student_phone = str(row.get('Student_Phone*', '')).strip()
    if not student_phone or student_phone.lower() in ('nan', 'none', ''):
        student_phone = generate_phone(index + 1000)
    
    parent_phone = str(row.get('Parent_Phone*', '')).strip()
    if not parent_phone or parent_phone.lower() in ('nan', 'none', ''):
        parent_phone = generate_phone(index + 50000)
    
    # Gender
    student_gender = normalize_gender(row.get('Student_Gender*'))
    parent_gender = normalize_gender(row.get('Parent_Gender*'))
    
    # Dates
    dob = safe_date(str(row.get('Student_Date_of_Birth*', '')), '2010-01-01')
    parent_birth_date = safe_date(str(row.get('Parent_Birth_Date*', '')), '1980-01-01')
    admission_date = safe_date(str(row.get('Admission_Date*', '')), dt.date.today().isoformat())
    
    # Class ID
    class_id = extract_trailing_numeric_id(str(row.get('Class_ID*', '')))
    
    # Address fields
    origin_province = str(row.get('Origin_Province', '')).strip() or None
    origin_city = str(row.get('Origin_City', '')).strip() or None
    origin_address = str(row.get('Origin_Address', '')).strip() or None
    
    current_province = str(row.get('Current_Province', '')).strip() or None
    current_city = str(row.get('Current_City', '')).strip() or None
    current_address = str(row.get('Current_Address', '')).strip() or None
    current_state = str(row.get('Current_State', '')).strip() or None
    
    # Other fields
    tazkira_no = str(row.get('Student_Tazkira_No', '')).strip() or None
    parent_tazkira_no = str(row.get('Parent_Tazkira_No', '')).strip() or None
    nationality = str(row.get('Nationality', '')).strip() or 'Afghan'
    religion = str(row.get('Religion', '')).strip() or 'Islam'
    occupation = str(row.get('Occupation', '')).strip() or None
    previous_school = str(row.get('Previous_School', '')).strip() or None
    caste = str(row.get('Caste', '')).strip() or None
    
    # Build payload matching scripts/bulk-import-students-exact.js exactly
    payload: Dict[str, Any] = {
        'schoolId': SCHOOL_ID,
        'admissionDate': admission_date,
        'bloodGroup': None,
        'nationality': nationality,
        'religion': religion,
        'tazkiraNo': tazkira_no,
        'bankAccountNo': None,
        'bankName': None,
        'previousSchool': previous_school,
        'classId': class_id,

        'originAddress': origin_address,
        'originCity': origin_city,
        'originState': None,
        'originProvince': origin_province,
        'originCountry': 'Afghanistan',
        'originPostalCode': None,

        'currentAddress': current_address,
        'currentCity': current_city,
        'currentState': current_state,
        'currentProvince': current_province,
        'currentCountry': 'Afghanistan',
        'currentPostalCode': None,

        'user': {
            'firstName': student_first,
            'middleName': None,
            'lastName': student_last,
            'displayName': f"{student_first} {student_last}".strip(),
            'phone': student_phone,
            'gender': student_gender,
            'dateOfBirth': dob,
            'address': current_address,
            'city': current_city,
            'state': current_state,
            'country': 'Afghanistan',
            'postalCode': None,
            'avatar': None,
            'bio': None,
            'timezone': 'Asia/Kabul',
            'locale': 'en-AF',
            'tazkiraNo': tazkira_no,
            'username': generate_username(student_first, student_last, 'stu', index)
        },

        'parent': {
            'user': {
                'firstName': parent_first,
                'middleName': None,
                'lastName': parent_last,
                'displayName': f"{parent_first} {parent_last}".strip(),
                'phone': parent_phone,
                'gender': parent_gender,
                'birthDate': parent_birth_date,
                'address': current_address,
                'city': current_city,
                'state': current_state,
                'country': 'Afghanistan',
                'postalCode': None,
                'avatar': None,
                'bio': None,
                'timezone': 'Asia/Kabul',
                'locale': 'en-AF',
                'tazkiraNo': parent_tazkira_no,
                'username': generate_username(parent_first, parent_last, 'par', index)
            },
            'occupation': occupation,
            'annualIncome': None,
            'education': None,
            'employer': None,
            'designation': None,
            'workPhone': None,
            'emergencyContact': None,
            'relationship': 'Father',
            'isGuardian': True,
            'isEmergencyContact': True
        }
    }

    return payload


def send_batch_to_api(payloads: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Send batch of student data to API."""
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    results = {
        'successful': 0,
        'failed': 0,
        'errors': []
    }
    
    for i, payload in enumerate(payloads):
        try:
            response = requests.post(
                f"{API_BASE_URL}/students",
                json=payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                results['successful'] += 1
                log_print(f"✅ Student {i+1} created successfully")
            else:
                results['failed'] += 1
                error_msg = f"Student {i+1}: HTTP {response.status_code} - {response.text}"
                results['errors'].append(error_msg)
                log_print(f"❌ {error_msg}")
                
        except Exception as e:
            results['failed'] += 1
            error_msg = f"Student {i+1}: Exception - {str(e)}"
            results['errors'].append(error_msg)
            log_print(f"❌ {error_msg}")
        
        # Small delay between individual requests
        if i < len(payloads) - 1:
            time.sleep(0.1)
    
    return results


def main():
    log_print('🚀 Starting Excel student import')
    log_print(f'📁 Excel file: {EXCEL_FILE_PATH}')
    log_print(f'🌐 API URL: {API_BASE_URL}')
    log_print(f'🏫 School ID: {SCHOOL_ID}')
    log_print(f'📦 Batch size: {BATCH_SIZE}')
    
    # Load Excel file
    try:
        log_print('📖 Reading Excel file...')
        df = pd.read_excel(EXCEL_FILE_PATH)
        log_print(f'📊 Loaded {len(df)} rows from Excel file')
        log_print(f'📋 Columns: {list(df.columns)}')
    except Exception as e:
        log_print(f'❌ Failed to load Excel file: {e}')
        import traceback
        traceback.print_exc()
        return
    
    # Initialize logging
    log_data = {
        'startTime': dt.datetime.now(dt.timezone.utc).isoformat(),
        'totalRecords': len(df),
        'successful': 0,
        'failed': 0,
        'errors': []
    }
    
    # Process in batches
    total_batches = (len(df) + BATCH_SIZE - 1) // BATCH_SIZE
    
    for batch_num in range(total_batches):
        start_idx = batch_num * BATCH_SIZE
        end_idx = min(start_idx + BATCH_SIZE, len(df))
        batch_df = df.iloc[start_idx:end_idx]
        
        log_print(f'📦 Processing batch {batch_num + 1}/{total_batches} (rows {start_idx + 1}-{end_idx})')
        
        # Transform batch to API payloads
        payloads = []
        for idx, (_, row) in enumerate(batch_df.iterrows()):
            try:
                payload = transform_excel_row_to_api_payload(row, start_idx + idx)
                payloads.append(payload)
            except Exception as e:
                log_print(f'❌ Error transforming row {start_idx + idx + 1}: {e}')
                log_data['failed'] += 1
                log_data['errors'].append(f"Row {start_idx + idx + 1}: Transform error - {str(e)}")
        
        # Send batch to API
        if payloads:
            batch_results = send_batch_to_api(payloads)
            log_data['successful'] += batch_results['successful']
            log_data['failed'] += batch_results['failed']
            log_data['errors'].extend(batch_results['errors'])
        
        # Delay between batches
        if batch_num < total_batches - 1:
            log_print(f'⏳ Waiting {DELAY_BETWEEN_BATCHES_MS}ms before next batch...')
            time.sleep(DELAY_BETWEEN_BATCHES_MS / 1000.0)
    
    # Final summary
    log_data['endTime'] = dt.datetime.now(dt.timezone.utc).isoformat()
    log_data['duration'] = (dt.datetime.fromisoformat(log_data['endTime'].replace('Z', '+00:00')) - 
                           dt.datetime.fromisoformat(log_data['startTime'].replace('Z', '+00:00'))).total_seconds()
    
    log_print(f'📈 Summary: {log_data["successful"]} successful, {log_data["failed"]} failed out of {log_data["totalRecords"]} total')
    log_print(f'⏱️ Duration: {log_data["duration"]:.2f} seconds')
    
    # Save log
    try:
        with open(LOG_FILE, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, indent=2, ensure_ascii=False)
        log_print(f'📝 Log saved to: {LOG_FILE}')
    except Exception as e:
        log_print(f'⚠️ Failed to save log: {e}')


if __name__ == '__main__':
    main()