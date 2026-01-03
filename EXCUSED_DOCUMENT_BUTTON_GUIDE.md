# EXCUSED Status - View Document Button Guide

## 🔍 Why You're Not Seeing the Button

Looking at your database:
```
| attendance_id | studentId | status  | leaveDocumentPath |
|--------------|-----------|---------|-------------------|
| 6397         | 9         | EXCUSED | NULL              |
```

**The button doesn't appear because `leaveDocumentPath` is NULL** - no document was uploaded with that leave request.

## ✅ How to Make the Button Appear

### Option 1: Mark New Leave WITH Document

1. Open Attendance page
2. Click "Mark Leave"
3. Select student  
4. Enter reason
5. **⚠️ IMPORTANT:** Upload a document (PDF or image)
6. Click "Mark Leave"
7. **Result:** Student will show EXCUSED with "View Leave Document" button!

### Option 2: Update Existing Leave (Add Document)

You can manually update the database to add a document path for testing:

```sql
-- Update existing leave record with a test document path
UPDATE attendances 
SET leaveDocumentPath = 'uploads/attendance/leaves/9/2025-11-04/test_document.pdf'
WHERE id = 6397;
```

But the file must actually exist at that path!

## 🎯 Button Visibility Logic

The "View Leave Document" button appears when **ALL** these conditions are met:

✅ `attendance.status === 'EXCUSED'`  
✅ `attendance.leaveDocumentPath !== null`  
✅ `attendance.leaveDocumentPath !== ''`

## 📍 Where the Button Appears

### In StudentAttendanceCard (Overview Tab):
```
┌─────────────────────────────────────┐
│ AR  Ahmad Rezwan     [EXCUSED]      │
├─────────────────────────────────────┤
│ @ahmad_rezwan...                    │
│                                     │
│ ╔═══════════════════════════════╗  │
│ ║ 📄 EXCUSED (Leave)            ║  │
│ ║ Reason: Medical appointment   ║  │
│ ║                               ║  │
│ ║ [📄 View Leave Document]      ║  ← THIS BUTTON
│ ╚═══════════════════════════════╝  │
│                                     │
│ User ID: 19        • EXCUSED        │
└─────────────────────────────────────┘
```

### In AttendanceList (List Tab):
```
┌────────────────────────────────────────────┐
│ 📄 Ahmad Rezwan  #N/A                     │
│ Nov 4, 2025 • In: -- • Out: --            │
│ "Medical appointment"                      │
│                                            │
│ [📄 View Leave Document]  ← THIS BUTTON   │
│                              [EXCUSED]     │
└────────────────────────────────────────────┘
```

## 🧪 Test Steps

### 1. Deploy Backend (if not done)
```bash
scp middleware/leaveDocumentUpload.js root@31.97.70.79:/var/snap/lxd/common/lxd/containers/sms/rootfs/root/sms/middleware/
scp controllers/attendanceController.js root@31.97.70.79:/var/snap/lxd/common/lxd/containers/sms/rootfs/root/sms/controllers/
scp routes/attendances.js root@31.97.70.79:/var/snap/lxd/common/lxd/containers/sms/rootfs/root/sms/routes/

# Then restart
pm2 restart sms
```

### 2. Rebuild Frontend
```bash
cd /home/yosuf/Pictures/School/copy
npm run build
# Deploy dist to production
```

### 3. Mark NEW Leave with Document

1. Go to Attendance → Overview tab
2. Click "Mark Leave" button (top right)
3. Select a student
4. Enter reason: "Medical appointment"
5. **Upload a file** (click "Choose File" in Leave Modal)
6. Click "Mark Leave"

### 4. Verify

The student card should now show:
- Blue background with "EXCUSED (Leave)"
- Leave reason displayed
- **"View Leave Document" button** (blue button with file icon)
- Clicking opens the document in new tab

## 🎨 Button Styling

The button looks like this:
```
┌──────────────────────────────┐
│ 📄 View Leave Document       │  ← Blue background, white text
└──────────────────────────────┘
```

**Hover effect:** Darker blue

## 🔧 Troubleshooting

### "Button still not showing after upload"
- Check browser console for errors
- Hard refresh (Ctrl+Shift+R)
- Verify backend received file (check `pm2 logs sms`)

### "Button shows but document won't open"
- Check file exists: `ls -lh uploads/attendance/leaves/9/2025-11-04/`
- Check file permissions: `chmod 644 uploads/attendance/leaves/9/2025-11-04/*`

### "Getting 404 when clicking button"
- Ensure `/attendances/:id/leave-document` route is deployed
- Check `pm2 logs` for errors

## ✨ Summary

**Current State:**
- Student ID 9 is marked as EXCUSED ✅
- But NO document was uploaded ❌
- So NO button appears ✅ (correct behavior)

**To See the Button:**
- Mark a **new leave** with a **document attached**
- Or upload document for existing leave via API
- Button will appear automatically! 🎉























