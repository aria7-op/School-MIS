# Student File Upload System - Deployment Guide

## Overview
This document covers deploying the comprehensive student file upload system to the production server.

## Files Changed/Created

### New Files
1. **middleware/studentDocumentUpload.js** - Document upload middleware with multi-file support
2. **utils/fileManagement.js** - File management utilities

### Modified Files
1. **controllers/studentController.js** - Added document upload handlers
2. **routes/students.js** - Added document upload routes

## Schema Changes
**✅ NO SCHEMA CHANGES REQUIRED!**

The existing `Document` model already has all necessary fields:
- id, uuid, title, description, type, path, mimeType, size
- studentId, teacherId, staffId, schoolId
- createdBy, updatedBy, createdAt, updatedAt, deletedAt

## Deployment Options

### Option 1: Use the Deployment Script
```bash
cd /home/yosuf/Pictures/School
./deploy-student-files.sh
```

### Option 2: Copy Files Individually

```bash
SERVER="root@31.97.70.79"
BASE="/var/snap/lxd/common/lxd/containers/sms/rootfs/root/sms"

# Copy new middleware
scp /home/yosuf/Pictures/School/middleware/studentDocumentUpload.js \
    ${SERVER}:${BASE}/middleware/

# Copy modified controller
scp /home/yosuf/Pictures/School/controllers/studentController.js \
    ${SERVER}:${BASE}/controllers/

# Copy modified routes
scp /home/yosuf/Pictures/School/routes/students.js \
    ${SERVER}:${BASE}/routes/

# Copy new utilities
scp /home/yosuf/Pictures/School/utils/fileManagement.js \
    ${SERVER}:${BASE}/utils/
```

## Post-Deployment Steps

1. **SSH into the server:**
   ```bash
   ssh root@31.97.70.79
   lxc exec sms -- bash
   cd /root/sms
   ```

2. **Restart the application:**
   ```bash
   pm2 restart sms
   # or
   npm restart
   ```

3. **Check logs:**
   ```bash
   pm2 logs sms
   ```

## New API Endpoints

### 1. Upload Single Document
```
POST /api/students/:id/documents
Content-Type: multipart/form-data

Fields:
- document: File
- documentType: String (optional, defaults to "OTHER")
- title: String (optional)
- description: String (optional)
```

### 2. Upload Multiple Documents (Bulk)
```
POST /api/students/:id/documents/bulk
Content-Type: multipart/form-data

Fields (all optional, multiple files per field):
- studentTazkira: File[] (max 5)
- fatherTazkira: File[] (max 5)
- motherTazkira: File[] (max 5)
- transferLetter: File[] (max 3)
- admissionLetter: File[] (max 3)
- academicRecord: File[] (max 10)
- profilePicture: File (max 1)
- birthCertificate: File[] (max 3)
- medicalRecords: File[] (max 10)
- other: File[] (max 20)
```

### 3. Get Documents by Type
```
GET /api/students/:id/documents/by-type?type=ID_PROOF
```

### 4. Download Document
```
GET /api/students/:id/documents/:documentId/download
```

### 5. Delete Document
```
DELETE /api/students/:id/documents/:documentId
```

## File Organization Structure

Files are automatically organized as:
```
uploads/
└── students/
    └── {studentId}/
        ├── tazkira/
        │   ├── filename1_timestamp_random.pdf
        │   └── filename2_timestamp_random.jpg
        ├── father_tazkira/
        ├── mother_tazkira/
        ├── transfer_letters/
        ├── admission_letters/
        ├── academic_records/
        ├── profile_pictures/
        ├── birth_certificates/
        ├── medical_records/
        └── other_documents/
```

## Supported File Types

- **Images:** JPG, JPEG, PNG, GIF, WebP, SVG
- **Documents:** PDF, DOC, DOCX, XLS, XLSX
- **Text:** TXT

## File Limits

- Maximum file size: **10MB** per file
- Maximum files per upload: **20 files**
- Specific limits per document type (see endpoint 2 above)

## Features

✅ **Automatic folder creation** per student and document type  
✅ **Multiple files** per document type  
✅ **Proper file naming** with timestamps and random strings  
✅ **Database integration** - all paths saved to Document table  
✅ **File validation** - type and size checks  
✅ **Error handling** - comprehensive error messages  
✅ **File cleanup** - soft delete with optional physical deletion  
✅ **Download support** - stream files to clients  
✅ **File statistics** - get document counts and sizes  

## Testing the Upload

### Using cURL
```bash
# Single file upload
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@/path/to/file.pdf" \
  -F "documentType=ID_PROOF" \
  -F "title=Student Tazkira" \
  http://your-server/api/students/123/documents

# Multiple files upload
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "studentTazkira=@/path/to/tazkira1.pdf" \
  -F "studentTazkira=@/path/to/tazkira2.jpg" \
  -F "academicRecord=@/path/to/grades.pdf" \
  http://your-server/api/students/123/documents/bulk
```

### Using Postman
1. Create new POST request
2. URL: `http://your-server/api/students/123/documents/bulk`
3. Headers: `Authorization: Bearer YOUR_TOKEN`
4. Body: form-data
5. Add file fields: `studentTazkira`, `fatherTazkira`, etc.
6. Attach files
7. Send

## Troubleshooting

### Issue: "No file uploaded"
- Check that you're using `multipart/form-data` content type
- Verify field names match expected names

### Issue: "File too large"
- Files must be under 10MB
- Compress images or PDFs if needed

### Issue: "Student ID is required"
- Ensure student ID is in the URL path
- Check authentication token has proper schoolId

### Issue: "Directory creation failed"
- Check file system permissions
- Ensure `uploads/` directory is writable

## Monitoring

Check uploaded files:
```bash
# On server
cd /root/sms/uploads/students
ls -lah

# Check specific student
ls -lah {studentId}/
```

Check database:
```sql
SELECT * FROM documents WHERE studentId = 123;
```

## Security Notes

- All routes require authentication
- School-level authorization enforced
- File type validation prevents malicious uploads
- File size limits prevent DoS
- Paths are validated and sanitized
- Soft delete preserves audit trail































