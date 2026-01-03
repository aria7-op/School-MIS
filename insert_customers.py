#!/usr/bin/env python3
"""
Script to insert customer data from customers.sql into the API endpoint.
Maps SQL columns to API fields and sends POST requests.
"""

import requests
import json
import re
from datetime import datetime
import time
import uuid

# Configuration
BASE_URL = "https://khwanzay.school"
API_ENDPOINT = f"{BASE_URL}/api/customers"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxNTg1Iiwicm9sZSI6IlRFQUNIRVIiLCJzY2hvb2xJZCI6IjEiLCJpYXQiOjE3NTcyMjg0MTUsImV4cCI6MTc1NzMxNDgxNX0.I4MlfFOLeSC8JJQBO1bxHQ2EA7QU7LGY2p08wLZA0DA"

# Headers for API requests
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def parse_sql_file(file_path):
    """Parse the SQL file and extract customer data."""
    customers = []
    
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Find all INSERT statements
    insert_pattern = r"INSERT INTO customers \(([^)]+)\) VALUES\s*((?:\([^)]+\),?\s*)+)"
    matches = re.findall(insert_pattern, content, re.IGNORECASE | re.MULTILINE)
    
    for columns_str, values_str in matches:
        # Parse column names
        columns = [col.strip() for col in columns_str.split(',')]
        
        # Parse values - handle multiple rows
        values_pattern = r"\(([^)]+)\)"
        value_matches = re.findall(values_pattern, values_str)
        
        for value_str in value_matches:
            # Split values by comma, but be careful with quoted strings
            values = []
            current_value = ""
            in_quotes = False
            quote_char = None
            
            i = 0
            while i < len(value_str):
                char = value_str[i]
                
                if char in ["'", '"'] and not in_quotes:
                    in_quotes = True
                    quote_char = char
                    current_value += char
                elif char == quote_char and in_quotes:
                    in_quotes = False
                    quote_char = None
                    current_value += char
                elif char == ',' and not in_quotes:
                    values.append(current_value.strip())
                    current_value = ""
                else:
                    current_value += char
                
                i += 1
            
            # Add the last value
            if current_value.strip():
                values.append(current_value.strip())
            
            # Create customer dictionary
            if len(values) >= len(columns):
                customer = {}
                for i, column in enumerate(columns):
                    if i < len(values):
                        value = values[i].strip("'\"")
                        customer[column] = value if value != '' else None
                
                customers.append(customer)
    
    return customers

def map_sql_to_api(customer_data):
    """Map SQL column names to API field names."""
    api_data = {}
    
    # Direct mappings
    mappings = {
        'name': 'name',
        'mobile': 'phone',  # SQL uses 'mobile', API uses 'phone'
        'gender': 'gender',
        'source': 'source',
        'purpose': 'purpose',
        'department': 'department',
        'remark': 'rermark',  # Note: API field is 'rermark' (typo in schema)
        'added_by': 'createdBy'
    }
    
    for sql_field, api_field in mappings.items():
        if sql_field in customer_data and customer_data[sql_field]:
            api_data[api_field] = customer_data[sql_field]
    
    # Handle created_at timestamp
    if 'created_at' in customer_data and customer_data['created_at']:
        try:
            # Parse the timestamp and convert to ISO format
            dt = datetime.strptime(customer_data['created_at'], '%Y-%m-%d %H:%M:%S')
            api_data['createdAt'] = dt.isoformat() + 'Z'
        except ValueError:
            print(f"Warning: Could not parse timestamp: {customer_data['created_at']}")
    
    # Set required fields with defaults
    api_data['schoolId'] = 1  # From the token
    api_data['createdBy'] = 1585  # From the token
    api_data['updatedBy'] = 1585  # From the token
    api_data['ownerId'] = 1  # Default owner ID
    
    # Generate UUID if not present
    api_data['uuid'] = str(uuid.uuid4())
    
    # Set type based on department
    if customer_data.get('department') == 'Academic':
        api_data['type'] = 'STUDENT'
    elif customer_data.get('department') == 'Finance':
        api_data['type'] = 'CUSTOMER'
    elif customer_data.get('department') == 'Superadmin':
        api_data['type'] = 'ADMIN'
    else:
        api_data['type'] = 'CUSTOMER'
    
    return api_data

def send_customer_request(customer_data):
    """Send a single customer creation request to the API."""
    try:
        response = requests.post(API_ENDPOINT, headers=HEADERS, json=customer_data, timeout=30)
        
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Success: {customer_data.get('name', 'Unknown')} - ID: {result.get('data', {}).get('id', 'N/A')}")
            return True, result
        else:
            print(f"❌ Error: {customer_data.get('name', 'Unknown')} - Status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False, response.text
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {customer_data.get('name', 'Unknown')} - {str(e)}")
        return False, str(e)

def main():
    """Main function to process and insert customers."""
    print("🚀 Starting customer data insertion...")
    print(f"📡 API Endpoint: {API_ENDPOINT}")
    
    # Parse SQL file
    print("📖 Parsing customers.sql file...")
    try:
        customers = parse_sql_file('src/customers.sql')
        print(f"📊 Found {len(customers)} customers in SQL file")
    except FileNotFoundError:
        print("❌ Error: customers.sql file not found!")
        return
    except Exception as e:
        print(f"❌ Error parsing SQL file: {str(e)}")
        return
    
    # Process customers
    success_count = 0
    error_count = 0
    
    for i, customer_data in enumerate(customers, 1):
        print(f"\n📝 Processing customer {i}/{len(customers)}: {customer_data.get('name', 'Unknown')}")
        
        # Map SQL data to API format
        api_data = map_sql_to_api(customer_data)
        
        # Send request
        success, result = send_customer_request(api_data)
        
        if success:
            success_count += 1
        else:
            error_count += 1
        
        # Add small delay to avoid overwhelming the server
        time.sleep(0.5)
    
    # Summary
    print(f"\n📈 Summary:")
    print(f"   ✅ Successful: {success_count}")
    print(f"   ❌ Failed: {error_count}")
    print(f"   📊 Total: {len(customers)}")
    
    if error_count > 0:
        print(f"\n⚠️  {error_count} customers failed to insert. Check the error messages above.")

if __name__ == "__main__":
    main()