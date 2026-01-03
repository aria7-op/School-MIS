# Documents in Student API Response

## What Was Changed

Added **documents** support to the student API so that student files are returned in GET requests.

## Changes Made

### File: `utils/studentUtils.js`

Modified the `buildStudentIncludeQuery` function to include documents:

1. **Default Behavior** (no `include` parameter):
   - Now returns **first 5 documents** per student
   - Shows: id, title, type, path, mimeType, size, createdAt
   - Only non-deleted documents

2. **With `include=documents` parameter**:
   - Returns **all documents** for the student
   - Shows: full details including description, uploader info, etc.

## API Usage

### Get Students with Documents (Default)
```http
GET /api/students?limit=10
```

**Response includes:**
```json
{
  "id": "1027",
  "firstName": "Ahmad",
  "documents": [
    {
      "id": "1",
      "title": "Student Tazkira",
      "type": "ID_PROOF",
      "path": "uploads/students/1027/tazkira/filename.pdf",
      "mimeType": "application/pdf",
      "size": 1024000,
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

### Get Students with Full Document Details
```http
GET /api/students?include=documents
```

**Response includes:**
```json
{
  "id": "1027",
  "documents": [
    {
      "id": "1",
      "uuid": "abc-123",
      "title": "Student Tazkira",
      "description": "Student studentTazkira document",
      "type": "ID_PROOF",
      "path": "uploads/students/1027/tazkira/filename.pdf",
      "mimeType": "application/pdf",
      "size": 1024000,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z",
      "createdByUser": {
        "id": "2085",
        "firstName": "Admin",
        "lastName": "User"
      }
    }
  ]
}
```

### Get Single Student with Documents
```http
GET /api/students/1027?include=documents
```

## Deployment

Run the deployment script:
```bash
cd /home/yosuf/Pictures/School
./deploy-student-files.sh
```

Or copy manually:
```bash
scp /home/yosuf/Pictures/School/utils/studentUtils.js \
    root@31.97.70.79:/var/snap/lxd/common/lxd/containers/sms/rootfs/root/sms/utils/
```

Then restart the server:
```bash
ssh root@31.97.70.79
lxc exec sms -- bash
cd /root/sms
pm2 restart sms
```

## Document Fields Explained

- **id**: Document ID
- **uuid**: Unique identifier
- **title**: Document title/name
- **description**: Document description
- **type**: Document type (ID_PROOF, TRANSFER_CERTIFICATE, MARKSHEET, etc.)
- **path**: File path on server
- **mimeType**: File MIME type (application/pdf, image/jpeg, etc.)
- **size**: File size in bytes
- **createdAt**: Upload date
- **createdByUser**: Who uploaded the document

## Frontend Usage

The frontend will now automatically receive documents in the student response:

```typescript
// Fetch students
const response = await fetch('/api/students?include=documents');
const data = await response.json();

// Access documents
data.data.forEach(student => {
  console.log(`Student ${student.id} has ${student.documents.length} documents`);
  
  student.documents.forEach(doc => {
    console.log(`- ${doc.title} (${doc.type}): ${doc.path}`);
  });
});
```

## Benefits

✅ **No extra API calls** - Documents included in student response  
✅ **Performance optimized** - Default shows only 5 most recent  
✅ **Flexible** - Use `include=documents` for full details  
✅ **Type information** - Know what documents each student has  
✅ **Download ready** - File paths included for downloads  

## Document Upload

Upload documents using:
```bash
POST /api/students/:id/documents/bulk
```

See `STUDENT_FILE_UPLOAD_DEPLOYMENT.md` for upload documentation.































