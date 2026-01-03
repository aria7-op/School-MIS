# Parent Creation Script for Unlinked Students (API Version)

This script automatically creates parent accounts for students who don't have linked parents in the system using the school API.

## What the script does:

1. **Finds unlinked students**: Fetches all students from the API and filters those without parents
2. **Creates parent user accounts**: Creates a new user record with role 'PARENT' via API
3. **Creates parent records**: Creates a parent record linked to the user via API
4. **Links students to parents**: Updates the student record to link to the new parent via API
5. **Sets default credentials**: Uses student name as username and 'password123' as password

## API Endpoint:

The script uses: `https://khwanzay.school/api`

## Usage:

### 1. Test API connection:
```bash
node scripts/create-parents-for-unlinked-students.js test
```

### 2. Check unlinked students (preview only):
```bash
node scripts/create-parents-for-unlinked-students.js summary
```

### 3. Create parent accounts:
```bash
node scripts/create-parents-for-unlinked-students.js create
```

## Default Credentials:

- **Username**: Student's name (lowercase with underscores)
  - Example: "John Doe" becomes "john_doe"
- **Password**: `password123`

## Example Output:

```
🔍 Testing API connection...
✅ API connection successful
   Status: 200
   Response: {"status":"ok"}

🔍 Starting script to create parents for unlinked students...
📡 Fetching all students from API...
📊 Found 5 students without linked parents

🔍 Processing student: John Doe (ID: 123)
👤 Creating parent with username: john_doe
📡 Creating parent user account...
✅ Created parent user: 456
📡 Creating parent record...
✅ Created parent record: 789
📡 Linking student to parent...
✅ Linked student 123 to parent 789
📋 Summary for John Doe:
   - Parent Username: john_doe
   - Parent Password: password123
   - Parent User ID: 456
   - Parent Record ID: 789
   - Student ID: 123
   - School: Example School

📊 Script completed!
✅ Successfully created 5 parent accounts
❌ Encountered 0 errors

🔑 Default login credentials for all created parents:
   Username: [student_name] (lowercase with underscores)
   Password: password123

⚠️  IMPORTANT: Parents should change their passwords after first login!
```

## API Endpoints Used:

The script makes the following API calls:

1. **GET /students** - Fetch all students
2. **POST /users** - Create parent user account
3. **POST /parents** - Create parent record
4. **PUT /students/{id}** - Link student to parent
5. **GET /health** - Test API connection

## Important Notes:

1. **Password Security**: All created parents have the same default password. They should change it immediately after first login.

2. **Email Addresses**: Temporary email addresses are created in the format `username@parent.local`. Parents should update these with their real email addresses.

3. **Username Format**: Usernames are created from student names by:
   - Converting to lowercase
   - Replacing spaces with underscores
   - Example: "Mary Jane Smith" becomes "mary_jane_smith"

4. **API Safety**: The script only processes students where `parentId` is null, ensuring it doesn't affect already linked students.

5. **Error Handling**: If any individual student fails to process, the script continues with the next student and reports errors at the end.

6. **API Authentication**: The script assumes the API endpoints are publicly accessible. If authentication is required, you may need to add authentication headers.

## Requirements:

- Node.js with ES modules support
- axios package installed (`npm install axios`)
- Internet connection to access the API
- API endpoints must be accessible and functional

## Troubleshooting:

If you encounter errors:

1. **Check API connection**: Run the test command first to verify API connectivity
2. **Verify API endpoints**: Ensure all required endpoints are available and working
3. **Check network connectivity**: Make sure you can reach khwanzay.school
4. **Review API responses**: The script provides detailed error messages from the API
5. **Check API permissions**: Ensure the API allows creating users and parents

## API Error Handling:

The script handles various API errors:
- Connection timeouts
- HTTP error status codes
- API response validation
- Network connectivity issues

## Customization:

You can modify the script to:
- Change the API base URL
- Add authentication headers
- Modify request timeouts
- Change the default password
- Use different username formats
- Add additional parent information
- Modify the email format
- Add custom validation rules

## Security Considerations:

1. **API Security**: Ensure your API endpoints are properly secured
2. **Password Policy**: Consider implementing a password policy for parent accounts
3. **Rate Limiting**: The script processes students sequentially to avoid overwhelming the API
4. **Data Validation**: The API should validate all input data before processing 