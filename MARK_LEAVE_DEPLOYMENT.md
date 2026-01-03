# Mark Leave Feature - Deployment Guide

## 🎯 Overview

Enhanced Mark Leave functionality that:
- ✅ Marks student attendance status as EXCUSED (leave)
- ✅ Saves leave document (PDF/Image) to organized folders
- ✅ Stores document path in database
- ✅ Sends SMS notification to parents
- ✅ Generates printable leave certificate

## 📦 Files Changed

### New Files
1. **middleware/leaveDocumentUpload.js** - Handles leave document uploads

### Modified Files
1. **controllers/attendanceController.js** - Added `markStudentLeave()` function
2. **routes/attendances.js** - Added `/mark-leave` endpoint
3. **prisma/schema.prisma** - Added `leaveDocumentPath` field to Attendance model

## 🚀 Deployment Steps

### Option 1: Use the Deployment Script (Recommended)

```bash
cd /home/yosuf/Pictures/School
./deploy-mark-leave.sh
```

### Option 2: Copy Files Manually

```bash
SERVER="root@31.97.70.79"
BASE="/var/snap/lxd/common/lxd/containers/sms/rootfs/root/sms"

# Copy middleware
scp /home/yosuf/Pictures/School/middleware/leaveDocumentUpload.js \
    ${SERVER}:${BASE}/middleware/

# Copy controller
scp /home/yosuf/Pictures/School/controllers/attendanceController.js \
    ${SERVER}:${BASE}/controllers/

# Copy routes
scp /home/yosuf/Pictures/School/routes/attendances.js \
    ${SERVER}:${BASE}/routes/

# Copy schema
scp /home/yosuf/Pictures/School/prisma/schema.prisma \
    ${SERVER}:${BASE}/prisma/
```

## 🗄️ Database Migration

After copying files, run this SQL migration:

```bash
# SSH into server
ssh root@31.97.70.79
lxc exec sms -- bash
cd /root/sms

# Run migration
mysql -u root -p your_database_name <<EOF
ALTER TABLE attendances ADD COLUMN leaveDocumentPath VARCHAR(500) NULL AFTER remarks;
EOF
```

Or manually:

```sql
-- Connect to MySQL
mysql -u root -p your_database_name

-- Add the new column
ALTER TABLE attendances ADD COLUMN leaveDocumentPath VARCHAR(500) NULL AFTER remarks;

-- Verify the column was added
DESCRIBE attendances;

-- Exit MySQL
exit;
```

## 🔄 Regenerate Prisma Client

```bash
# On the server
cd /root/sms
npx prisma generate
```

## 🎬 Restart Application

```bash
# On the server
cd /root/sms
pm2 restart sms
pm2 logs sms --lines 50
```

## 📡 New API Endpoint

### POST /api/attendances/mark-leave

**Request:**
```http
POST /api/attendances/mark-leave
Content-Type: multipart/form-data
Authorization: Bearer YOUR_TOKEN

Body (form-data):
- studentId: "1028" (required)
- date: "2025-11-04" (required)
- reason: "Medical appointment" (required)
- classId: "1" (optional - auto-detected from student)
- remarks: "Doctor visit" (optional)
- leaveDocument: [file] (optional - PDF/Image, max 5MB)
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Leave marked successfully",
  "data": {
    "attendance": {
      "id": "123",
      "studentId": "1028",
      "date": "2025-11-04T00:00:00.000Z",
      "status": "EXCUSED",
      "remarks": "Medical appointment",
      "leaveDocumentPath": "uploads/attendance/leaves/1028/2025-11-04/leave_document_1762242476575.pdf",
      "student": {
        "user": {
          "firstName": "Ahmad",
          "lastName": "Khan"
        }
      }
    },
    "leaveDocument": {
      "path": "uploads/attendance/leaves/1028/2025-11-04/leave_document_1762242476575.pdf",
      "filename": "leave_document_1762242476575.pdf",
      "size": 102400,
      "uploadedAt": "2025-11-04T10:30:00.000Z"
    }
  }
}
```

## 📂 Folder Structure

Leave documents are automatically organized as:

```
uploads/
└── attendance/
    └── leaves/
        └── {studentId}/
            └── {date}/
                └── leave_document_timestamp.pdf
```

Example:
```
uploads/
└── attendance/
    └── leaves/
        ├── 1028/
        │   ├── 2025-11-04/
        │   │   └── leave_document_1762242476575.pdf
        │   └── 2025-11-05/
        │       └── leave_document_1762243567890.pdf
        └── 1029/
            └── 2025-11-04/
                └── leave_document_1762244678901.pdf
```

## 🧪 Testing

### Test 1: Mark Leave Without Document

```bash
curl -X POST https://khwanzay.school/api/attendances/mark-leave \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "studentId=1028" \
  -F "date=2025-11-04" \
  -F "reason=Medical appointment"
```

### Test 2: Mark Leave With Document

```bash
curl -X POST https://khwanzay.school/api/attendances/mark-leave \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "studentId=1028" \
  -F "date=2025-11-04" \
  -F "reason=Medical appointment" \
  -F "leaveDocument=@/path/to/doctor-note.pdf"
```

### Test 3: Verify in Database

```sql
SELECT 
    a.id,
    a.date,
    a.status,
    a.remarks,
    a.leaveDocumentPath,
    CONCAT(u.firstName, ' ', u.lastName) as studentName
FROM attendances a
JOIN students s ON a.studentId = s.id
JOIN users u ON s.userId = u.id
WHERE a.status = 'EXCUSED'
  AND a.leaveDocumentPath IS NOT NULL
ORDER BY a.date DESC
LIMIT 10;
```

## ✨ Features

### 1. Automatic Folder Creation
- Folders created automatically per student and date
- No manual setup required

### 2. Document Validation
- **Allowed formats:** PDF, JPG, PNG, GIF, WebP
- **Max file size:** 5MB
- **Automatic validation** with friendly error messages

### 3. Status Management
- Updates existing attendance if found
- Creates new record if none exists
- Status automatically set to `EXCUSED`

### 4. SMS Notification
- Automatic SMS to parent's phone (if available)
- Campaign ID: 405 (Leave notification)
- Non-blocking (doesn't fail if SMS fails)

### 5. Database Integration
- Document path saved in `leaveDocumentPath` field
- Linked to attendance record
- Easy retrieval and verification

## 🔍 Troubleshooting

### Issue: "Missing required fields"
**Solution:** Ensure `studentId`, `date`, and `reason` are provided

### Issue: "File too large"
**Solution:** Compress the file to under 5MB

### Issue: "Could not determine class ID"
**Solution:** Either provide `classId` in request, or ensure student has a class assigned

### Issue: "Column 'leaveDocumentPath' doesn't exist"
**Solution:** Run the database migration (ALTER TABLE command above)

### Issue: "Cannot find module 'leaveDocumentUpload'"
**Solution:** Ensure `middleware/leaveDocumentUpload.js` is copied to the server

### Issue: "Folder permission denied"
**Solution:** 
```bash
chmod 755 uploads/
chmod 755 uploads/attendance/
chown -R www-data:www-data uploads/  # or your Node.js user
```

## 📊 Schema Changes

### Attendance Model (Before)
```prisma
model Attendance {
  id        BigInt   @id @default(autoincrement())
  date      DateTime
  status    AttendanceStatus
  remarks   String?  @db.VarChar(255)
  // ... other fields
}
```

### Attendance Model (After)
```prisma
model Attendance {
  id                BigInt   @id @default(autoincrement())
  date              DateTime
  status            AttendanceStatus
  remarks           String?  @db.VarChar(255)
  leaveDocumentPath String?  @db.VarChar(500)  // ← NEW FIELD
  // ... other fields
}
```

## 🎯 Frontend Integration

The frontend already has the UI ready! It just needs to send the document with the request.

The frontend form in `LeaveModal.tsx` has:
- Student selection ✅
- Date picker ✅
- Reason textarea ✅
- Print button ✅ (already works)
- Mark Leave button ✅ (now enhanced)

## 🎉 Benefits

1. **Organized Storage:** Files stored in logical folder structure
2. **Database Tracking:** All document paths saved for auditing
3. **Automatic Status:** Attendance status automatically set to EXCUSED
4. **Parent Notification:** SMS sent automatically
5. **Audit Trail:** Who marked leave and when is tracked
6. **Print Support:** Frontend generates printable leave certificate
7. **Flexible:** Works with or without document upload

## 📝 Next Steps

1. ✅ Deploy backend files
2. ✅ Run database migration
3. ✅ Restart server
4. ⏳ Test with frontend
5. ⏳ Monitor logs for any issues
6. ⏳ Verify documents are saved correctly

## 🔗 Related Files

- Frontend: `copy/src/features/attendance/components/LeaveModal.tsx`
- Backend Controller: `controllers/attendanceController.js`
- Backend Routes: `routes/attendances.js`
- Middleware: `middleware/leaveDocumentUpload.js`
- Schema: `prisma/schema.prisma`

---

**Ready to deploy!** Run `./deploy-mark-leave.sh` to get started! 🚀























