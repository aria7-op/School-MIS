#!/usr/bin/env python3
import re
import os
import json
import time
import datetime as dt
from typing import List, Dict, Any, Optional

import requests


# Configuration
API_BASE_URL = os.environ.get('API_BASE_URL', 'https://khwanzay.school/api')
AUTH_TOKEN = os.environ.get('AUTH_TOKEN', '')
SCHOOL_ID = int(os.environ.get('SCHOOL_ID', '1'))
BATCH_SIZE = int(os.environ.get('BATCH_SIZE', '1'))
DELAY_BETWEEN_BATCHES_MS = int(os.environ.get('DELAY_MS', '500'))
SQL_FILE_PATH = os.environ.get('SQL_FILE', './scripts/students.sql')
LOG_FILE = os.environ.get('LOG_FILE', './scripts/import-students-from-sql-log.json')


# SQL column order from scripts/students.sql `CREATE TABLE students` definition
SQL_COLUMNS = [
    'id', 'name', 'lastname', 'father_name', 'grandfather_name', 'gender',
    'province', 'district', 'tazkira_num', 'age', 'dob', 'status',
    'native_language', 'asas_num', 'father_job', 'brother', 'uncle',
    'uncles_son', 'maternal_cousin', 'current_Address', 'fees', 'fees_type',
    'discount', 'dues', 'dus_date', 'created_at', 'class_id', 'photo', 'files',
    'mother_id', 'staff_id', 'village', 'page_num', 'cover_name', 'mama',
    'phone', 'uid', 'card_number', 'password'
]


def log_print(message: str):
    timestamp = dt.datetime.now(dt.timezone.utc).isoformat()
    print(f"[{timestamp}] {message}")


def read_sql_insert_rows(sql_path: str) -> List[List[Any]]:
    """Parse INSERT INTO `students` ... VALUES (...), (...); into list of row value lists.
    Robustly handles quoted strings, escaped quotes, NULL, and numbers.
    """
    with open(sql_path, 'r', encoding='utf-8') as f:
        sql = f.read()

    # Find all INSERT statements for students
    inserts = re.findall(r"INSERT\s+INTO\s+`?students`?\s*\([^)]*\)\s*VALUES\s*(.*?);", sql, flags=re.IGNORECASE | re.DOTALL)
    if not inserts:
        log_print('No INSERT statements found for `students`.')
        return []

    tuples_blob = ' '.join(inserts)

    # Split top-level tuples: (...),(...)
    rows: List[str] = []
    depth = 0
    token = []
    in_string = False
    escape = False
    quote_char = ''
    for ch in tuples_blob:
        if in_string:
            token.append(ch)
            if escape:
                escape = False
            elif ch == '\\':
                escape = True
            elif ch == quote_char:
                in_string = False
            continue
        if ch in ("'", '"'):
            in_string = True
            quote_char = ch
            token.append(ch)
            continue
        if ch == '(':
            depth += 1
            token.append(ch)
            continue
        if ch == ')':
            depth -= 1
            token.append(ch)
            if depth == 0:
                rows.append(''.join(token).strip())
                token = []
            continue
        if depth > 0:
            token.append(ch)

    # Parse each tuple into list of values
    def parse_tuple(t: str) -> List[Any]:
        assert t[0] == '(' and t[-1] == ')'
        inner = t[1:-1]
        vals: List[str] = []
        buf: List[str] = []
        in_str = False
        esc = False
        q = ''
        for c in inner:
            if in_str:
                buf.append(c)
                if esc:
                    esc = False
                elif c == '\\':
                    esc = True
                elif c == q:
                    in_str = False
                continue
            if c in ("'", '"'):
                in_str = True
                q = c
                buf.append(c)
                continue
            if c == ',' and not in_str:
                vals.append(''.join(buf).strip())
                buf = []
            else:
                buf.append(c)
        if buf:
            vals.append(''.join(buf).strip())

        def normalize(v: str) -> Any:
            if v.upper() == 'NULL':
                return None
            if len(v) >= 2 and v[0] in ("'", '"') and v[-1] == v[0]:
                s = v[1:-1]
                s = s.replace('\\"', '"').replace("\\'", "'")
                return s
            # numbers (keep as string if leading zeros important; here safe to keep string for dates etc.)
            return v if re.search(r"[^0-9.-]", v) else (int(v) if re.fullmatch(r"-?\d+", v) else float(v))

        return [normalize(v) for v in vals]

    parsed_rows = [parse_tuple(r) for r in rows]
    return parsed_rows


def to_row_dict(values: List[Any]) -> Dict[str, Any]:
    row = {}
    for i, col in enumerate(SQL_COLUMNS):
        row[col] = values[i] if i < len(values) else None
    return row


def normalize_gender(g: Optional[str]) -> Optional[str]:
    if not g:
        return None
    g = str(g).strip().lower()
    if g in ('male', 'm'): return 'MALE'
    if g in ('female', 'f'): return 'FEMALE'
    return None


def safe_date(s: Optional[str], default: str) -> str:
    if not s or s in ('0000-00-00', '0'):
        return default
    try:
        # Validate format
        dt.datetime.strptime(s, '%Y-%m-%d')
        return s
    except Exception:
        return default


def generate_phone(seed: int) -> str:
    base = 70000000 + (seed % 10000000)
    return f"+93{base}"


def generate_username(first: str, last: str, suffix: str, seed: int) -> str:
    f = (first or 'user').strip().lower().replace(' ', '_')
    l = (last or 'user').strip().lower().replace(' ', '_')
    return f"{f}_{l}_{suffix}_{seed % 10000:04d}"


def extract_trailing_numeric_id(value: Optional[str]) -> Optional[int]:
    """Extract the trailing numeric group from a string like 'CLS25-1-00026' -> 26.
    Returns None if no digits found.
    """
    if not value:
        return None
    s = str(value)
    m = re.search(r"(\d+)$", s)
    if not m:
        return None
    digits = m.group(1)
    try:
        return int(digits)  # int('00026') -> 26
    except Exception:
        return None


def map_sql_row_to_api(row: Dict[str, Any], index: int) -> Dict[str, Any]:
    # Derive fields
    student_first = (row.get('name') or '').strip() or 'Student'
    student_last = (row.get('lastname') or '').strip() or 'User'
    parent_first = (row.get('father_name') or '').strip() or 'Parent'
    parent_last = (row.get('grandfather_name') or '').strip() or 'Guardian'

    student_phone = (row.get('phone') or '').strip() or generate_phone(index + 1000)
    parent_phone = generate_phone(index + 50000)

    student_gender = normalize_gender(row.get('gender')) or 'MALE'
    parent_gender = 'MALE'

    dob = safe_date(str(row.get('dob') or ''), '2010-01-01')
    created_at = str(row.get('created_at') or '')[:10]
    admission_date = safe_date(created_at, dt.date.today().isoformat())

    # Map class_id code to numeric id by taking trailing digits (last 2-3 or more -> natural int)
    class_id_raw = (row.get('class_id') or '').strip()
    class_id = extract_trailing_numeric_id(class_id_raw)

    current_address = (row.get('current_Address') or '').strip() or None
    current_city = (row.get('district') or '').strip() or None
    current_province = (row.get('province') or '').strip() or None

    # Build payload matching scripts/bulk-import-students-exact.js
    payload: Dict[str, Any] = {
        'schoolId': SCHOOL_ID,
        'admissionDate': admission_date,
        'bloodGroup': None,
        'nationality': None,
        'religion': None,
        'tazkiraNo': str(row.get('tazkira_num') or '') or None,
        'bankAccountNo': None,
        'bankName': None,
        'previousSchool': None,
        'classId': class_id,  # Optional numeric ID extracted from class code

        'originAddress': None,
        'originCity': None,
        'originState': None,
        'originProvince': current_province or None,
        'originCountry': 'Afghanistan',
        'originPostalCode': None,

        'currentAddress': current_address,
        'currentCity': current_city,
        'currentState': None,
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
            'state': None,
            'country': 'Afghanistan',
            'postalCode': None,
            'avatar': None,
            'bio': None,
            'timezone': 'Asia/Kabul',
            'locale': 'en-AF',
            'tazkiraNo': str(row.get('tazkira_num') or '') or None,
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
                'birthDate': '1980-01-01',
                'address': current_address,
                'city': current_city,
                'state': None,
                'country': 'Afghanistan',
                'postalCode': None,
                'avatar': None,
                'bio': None,
                'timezone': 'Asia/Kabul',
                'locale': 'en-AF',
                'tazkiraNo': None,
                'username': generate_username(parent_first, parent_last, 'par', index)
            },
            'occupation': row.get('father_job') or None,
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


def post_student(payload: Dict[str, Any]) -> Dict[str, Any]:
    url = f"{API_BASE_URL}/students"
    headers = {
        'Content-Type': 'application/json'
    }
    resp = requests.post(url, headers=headers, data=json.dumps(payload), timeout=30)
    try:
        data = resp.json()
    except Exception:
        data = {'success': False, 'message': f'Non-JSON response: {resp.status_code}'}
    if resp.status_code == 429:
        return {'success': False, 'retry': True, 'message': data.get('message', 'rate limited')}
    return {'success': bool(data.get('success')), 'data': data, 'status': resp.status_code, 'message': data.get('message')}


def main():
    # AUTH_TOKEN no longer required since authentication was removed from student creation
    log_print('🔓 No authentication required for student creation')

    log = {
        'startTime': dt.datetime.now(dt.timezone.utc).isoformat(),
        'totalRows': 0,
        'successful': 0,
        'failed': 0,
        'details': []
    }

    log_print(f"Reading SQL: {SQL_FILE_PATH}")
    parsed = read_sql_insert_rows(SQL_FILE_PATH)
    log['totalRows'] = len(parsed)
    log_print(f"Found {len(parsed)} rows in SQL dump")

    for i in range(0, len(parsed), BATCH_SIZE):
        batch = parsed[i:i+BATCH_SIZE]
        log_print(f"Processing batch {i//BATCH_SIZE + 1} ({len(batch)} students)")
        for j, values in enumerate(batch):
            idx = i + j
            try:
                row = to_row_dict(values)
                payload = map_sql_row_to_api(row, idx)
                student_name = f"{payload['user']['firstName']} {payload['user']['lastName']}".strip()
                log_print(f"Creating student {idx+1}: {student_name}")
                result = post_student(payload)
                if result.get('retry'):
                    # Try once more after a short wait
                    log_print("Retrying after 2s due to 429...")
                    time.sleep(2)
                    result = post_student(payload)
                if result.get('success'):
                    log['successful'] += 1
                    log['details'].append({'index': idx+1, 'name': student_name, 'success': True})
                    log_print(f"✅ Created: {student_name}")
                else:
                    log['failed'] += 1
                    msg = result.get('message') or result
                    log['details'].append({'index': idx+1, 'name': student_name, 'success': False, 'message': str(msg)})
                    log_print(f"❌ Failed: {student_name} -> {msg}")
                time.sleep(0.2)
            except Exception as e:
                log['failed'] += 1
                log['details'].append({'index': idx+1, 'success': False, 'error': str(e)})
                log_print(f"❌ Error on row {idx+1}: {e}")

        if i + BATCH_SIZE < len(parsed):
            time.sleep(DELAY_BETWEEN_BATCHES_MS / 500.0)

    log['endTime'] = dt.datetime.now(dt.timezone.utc).isoformat()
    with open(LOG_FILE, 'w', encoding='utf-8') as f:
        json.dump(log, f, indent=2)
    log_print(f"Done. Success: {log['successful']}, Failed: {log['failed']}. Log -> {LOG_FILE}")


if __name__ == '__main__':
    main()

