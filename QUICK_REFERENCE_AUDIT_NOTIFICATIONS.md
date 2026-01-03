# ⚡ QUICK REFERENCE: Audit Logs & Notifications

## 🎯 Use This When Adding to Any Controller

---

## 📦 STEP 1: Add Imports

```javascript
// At top of controller file
import { createAuditLog } from '../utils/responseUtils.js';
import { createNotification } from '../services/notificationService.js';
import StudentEventService from '../services/studentEventService.js';  // If student-related
```

---

## ✍️ STEP 2: Add Audit Log

### For CREATE Operations:

```javascript
// After creating entity
await createAuditLog({
  action: 'CREATE',
  entityType: 'EntityName',  // e.g., 'Student', 'Grade', 'Payment'
  entityId: entity.id,
  userId: req.user.id,
  schoolId: req.user.schoolId,
  newData: JSON.stringify(entity),
  ipAddress: req.ip,
  userAgent: req.get('User-Agent')
});
```

### For UPDATE Operations:

```javascript
// BEFORE updating - fetch old data
const oldEntity = await prisma.entityName.findUnique({
  where: { id: entityId }
});

// Update entity
const updatedEntity = await prisma.entityName.update({ ... });

// Create audit log with before/after
await createAuditLog({
  action: 'UPDATE',
  entityType: 'EntityName',
  entityId: entityId,
  userId: req.user.id,
  schoolId: req.user.schoolId,
  oldData: JSON.stringify(oldEntity),     // ← Before state
  newData: JSON.stringify(updatedEntity), // ← After state
  ipAddress: req.ip,
  userAgent: req.get('User-Agent')
});
```

### For DELETE Operations:

```javascript
// BEFORE deleting - fetch data
const entityToDelete = await prisma.entityName.findUnique({
  where: { id: entityId }
});

// Delete (soft delete recommended)
await prisma.entityName.update({
  where: { id: entityId },
  data: { deletedAt: new Date() }
});

// Audit log
await createAuditLog({
  action: 'DELETE',
  entityType: 'EntityName',
  entityId: entityId,
  userId: req.user.id,
  schoolId: req.user.schoolId,
  oldData: JSON.stringify(entityToDelete),
  ipAddress: req.ip,
  userAgent: req.get('User-Agent')
});
```

---

## 🔔 STEP 3: Add Notifications

### Basic Notification:

```javascript
await createNotification({
  type: 'NOTIFICATION_TYPE',     // See types below
  title: 'Short Title',
  message: 'Detailed message for user',
  recipients: [userId1, userId2], // Array of user IDs
  priority: 'NORMAL',             // LOW, NORMAL, HIGH, URGENT
  schoolId: req.user.schoolId,
  senderId: req.user.id,
  channels: ['IN_APP'],           // IN_APP, SMS, EMAIL, PUSH
  entityType: 'entityName',       // Optional: link to entity
  entityId: entity.id,            // Optional: entity ID
  metadata: {                     // Optional: extra data
    key: 'value'
  }
});
```

### Common Notification Types:

```javascript
// Attendance
'ATTENDANCE_MARKED'      // General attendance
'ABSENT_NOTIFICATION'    // Student absent
'LATE_ARRIVAL'          // Student late

// Academic
'GRADE_POSTED'          // New grade
'ASSIGNMENT_CREATED'    // New assignment
'EXAM_SCHEDULED'        // Exam scheduled
'EXAM_RESULT'           // Results published

// Financial
'PAYMENT_RECEIVED'      // Payment confirmation
'PAYMENT_DUE'           // Payment reminder
'PAYMENT_OVERDUE'       // Overdue warning

// General
'INFO'                  // Informational
'SUCCESS'               // Success message
'WARNING'               // Warning
'ERROR'                 // Error alert
```

### Priority Guidelines:

```javascript
'URGENT'  // Use for: Security alerts, critical system issues
'HIGH'    // Use for: Absent students, failed grades, overdue payments
'NORMAL'  // Use for: Grade posted, assignment created, general updates
'LOW'     // Use for: Tips, reminders, non-critical info
```

### Channel Selection:

```javascript
['IN_APP']                    // All notifications (always include)
['IN_APP', 'SMS']            // Important alerts
['IN_APP', 'EMAIL']          // Detailed information
['IN_APP', 'SMS', 'EMAIL']   // Critical notifications
```

---

## 📝 STEP 4: Add Student Events (For Student Operations)

```javascript
// For student-related operations
const studentEventService = new StudentEventService();

// Attendance event
await studentEventService.createStudentAttendanceEvent(
  studentId,
  {
    date: attendance.date,
    status: attendance.status,
    classId: attendance.classId,
    inTime: attendance.inTime,
    outTime: attendance.outTime
  },
  req.user.id,
  req.user.schoolId
);

// Grade event
await studentEventService.createStudentExamGradeEvent(
  studentId,
  {
    examId: grade.examId,
    subjectId: grade.subjectId,
    subject: subject.name,
    examType: exam.type,
    marks: grade.marks,
    totalMarks: exam.totalMarks,
    grade: grade.grade
  },
  req.user.id,
  req.user.schoolId
);

// Payment event
await studentEventService.createStudentPaymentEvent(
  studentId,
  {
    amount: payment.amount,
    paymentDate: payment.paymentDate,
    paymentMethod: payment.paymentMethod,
    receiptNo: payment.receiptNo
  },
  req.user.id,
  req.user.schoolId
);
```

---

## 🎯 COMPLETE EXAMPLE: Attendance Mark In

```javascript
export const markIn = async (req, res) => {
  try {
    const { studentId, classId } = req.body;
    const userId = req.user.id;
    const schoolId = req.user.schoolId;
    
    // 1. VALIDATE
    const student = await prisma.student.findFirst({
      where: {
        id: BigInt(studentId),
        schoolId: BigInt(schoolId),
        deletedAt: null
      },
      include: {
        user: true,
        parent: { include: { user: true } }
      }
    });
    
    if (!student) {
      return createErrorResponse(res, 404, 'Student not found');
    }
    
    // 2. CREATE ATTENDANCE
    const attendance = await prisma.attendance.create({
      data: {
        date: new Date(),
        status: 'PRESENT',
        inTime: new Date(),
        studentId: BigInt(studentId),
        classId: BigInt(classId),
        schoolId: BigInt(schoolId),
        createdBy: BigInt(userId),
        smsInStatus: 'PENDING'  // SMS will be sent
      }
    });
    
    // 3. ✅ CREATE AUDIT LOG
    try {
      await createAuditLog({
        action: 'MARK_IN',
        entityType: 'Attendance',
        entityId: attendance.id,
        userId: userId,
        schoolId: schoolId,
        newData: JSON.stringify({
          studentId: studentId,
          studentName: `${student.user.firstName} ${student.user.lastName}`,
          classId: classId,
          date: attendance.date,
          inTime: attendance.inTime,
          status: attendance.status
        }),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (auditError) {
      console.error('❌ Audit log failed:', auditError);
      // Continue - don't break main flow
    }
    
    // 4. ✅ CREATE STUDENT EVENT
    try {
      const studentEventService = new StudentEventService();
      await studentEventService.createStudentAttendanceEvent(
        studentId,
        {
          date: attendance.date,
          status: attendance.status,
          classId: classId,
          inTime: attendance.inTime
        },
        userId,
        schoolId
      );
    } catch (eventError) {
      console.error('❌ Student event failed:', eventError);
      // Continue - don't break main flow
    }
    
    // 5. ✅ SEND NOTIFICATIONS (if needed)
    try {
      // Check if late
      const inTimeHour = new Date(attendance.inTime).getHours();
      const inTimeMinute = new Date(attendance.inTime).getMinutes();
      const isLate = inTimeHour > 8 || (inTimeHour === 8 && inTimeMinute > 30);
      
      if (isLate && student.parent) {
        await createNotification({
          type: 'LATE_ARRIVAL',
          title: 'Late Arrival',
          message: `${student.user.firstName} ${student.user.lastName} arrived late at ${attendance.inTime.toLocaleTimeString()}`,
          recipients: [student.parent.userId],
          priority: 'NORMAL',
          schoolId: schoolId,
          senderId: userId,
          channels: ['IN_APP', 'SMS'],
          entityType: 'attendance',
          entityId: attendance.id,
          metadata: {
            studentId: studentId,
            studentName: `${student.user.firstName} ${student.user.lastName}`,
            arrivalTime: attendance.inTime,
            expectedTime: '08:30'
          }
        });
      }
    } catch (notifError) {
      console.error('❌ Notification failed:', notifError);
      // Continue - don't break main flow
    }
    
    // 6. RETURN SUCCESS
    return createSuccessResponse(res, 200, 'Attendance marked successfully', {
      attendance: {
        id: attendance.id.toString(),
        studentId: studentId.toString(),
        status: attendance.status,
        inTime: attendance.inTime
      }
    });
    
  } catch (error) {
    console.error('Error in markIn:', error);
    return handlePrismaError(res, error, 'markIn');
  }
};
```

---

## ⚠️ ERROR HANDLING PATTERN

**IMPORTANT:** Always wrap in try-catch to prevent breaking main operation!

```javascript
// ✅ CORRECT: Non-blocking error handling
try {
  await createAuditLog({ ... });
} catch (auditError) {
  console.error('Audit log failed:', auditError);
  // Continue execution - don't throw
}

// ❌ WRONG: Blocking error handling
await createAuditLog({ ... });  // If this fails, entire operation fails!
```

**Why:**
- Audit logs are important but not critical to operation
- Failed notification shouldn't block payment processing
- User gets their main task done, auditing happens in background

---

## 🔍 DEBUGGING TIPS

### Check if Audit Log Was Created:

```sql
SELECT * FROM audit_logs 
WHERE entityType = 'YourEntity' 
  AND entityId = YOUR_ID
ORDER BY createdAt DESC;
```

### Check if Notification Was Sent:

```sql
SELECT n.*, nr.status, nr.readAt
FROM notifications n
LEFT JOIN notification_recipients nr ON nr.notificationId = n.id
WHERE n.entityType = 'YourEntity' 
  AND n.entityId = YOUR_ID;
```

### Check if Event Was Tracked:

```sql
SELECT * FROM student_events
WHERE studentId = STUDENT_ID
  AND eventType LIKE '%YOUR_EVENT%'
ORDER BY createdAt DESC;
```

### Common Console Checks:

```javascript
// Add debug logging
console.log('🔍 Creating audit log for:', { action, entityType, entityId });
console.log('🔍 Notification recipients:', recipients);
console.log('🔍 Student event service:', studentEventService);
```

---

## 📊 WHICH OPERATIONS NEED WHAT?

### CREATE Operations:
- ✅ Audit Log (action: 'CREATE')
- ✅ Notification (if significant)
- ✅ Event tracking (if student-related)

### UPDATE Operations:
- ✅ Audit Log with oldData (action: 'UPDATE')
- ⚠️ Notification (only if important fields changed)
- ⚠️ Event tracking (only if significant change)

### DELETE Operations:
- ✅ Audit Log with oldData (action: 'DELETE')
- ✅ Notification (important: inform stakeholders)
- ⚠️ Event tracking (optional)

### READ Operations:
- ❌ Audit Log (optional, only for sensitive data)
- ❌ Notification (no notification needed)
- ❌ Event tracking (not needed)

---

## 🎨 NOTIFICATION MESSAGE TEMPLATES

### Attendance:
```javascript
// Absent
title: 'Student Absent'
message: `${studentName} was absent on ${date}`

// Late
title: 'Late Arrival'
message: `${studentName} arrived late at ${time}`

// Excused
title: 'Excused Absence'
message: `${studentName} has been marked excused for ${date}`
```

### Grades:
```javascript
// Grade posted
title: 'New Grade Posted'
message: `Grade posted for ${subject}: ${marks}/${totalMarks} (${percentage}%)`

// Low grade
title: '⚠️ Low Grade Alert'
message: `${studentName} scored below passing in ${subject}: ${marks}/${totalMarks}`

// Grade updated
title: 'Grade Updated'
message: `${subject} grade updated from ${oldMarks} to ${newMarks}`
```

### Payments:
```javascript
// Payment received
title: '✅ Payment Received'
message: `Payment of ${amount} received. Receipt #${receiptNo}`

// Payment due
title: 'Payment Due Reminder'
message: `Payment of ${amount} is due on ${dueDate}`

// Payment overdue
title: '⚠️ Payment Overdue'
message: `Payment of ${amount} is overdue since ${dueDate}`
```

---

## 🎯 PRIORITY ASSIGNMENT GUIDE

```javascript
// URGENT - Use for:
- System security alerts
- Critical errors
- Emergency notifications

// HIGH - Use for:
priority: 'HIGH'
- Student absent
- Failing grades (< 40%)
- Payment overdue
- Suspension/expulsion

// NORMAL - Use for:
priority: 'NORMAL'
- Grade posted
- Payment received
- Attendance marked (present)
- Assignment created

// LOW - Use for:
priority: 'LOW'
- General announcements
- Tips and suggestions
- Non-urgent reminders
```

---

## 🎭 RECIPIENT SELECTION PATTERNS

### Student Operations:
```javascript
const student = await prisma.student.findUnique({
  where: { id: studentId },
  include: {
    user: true,
    parent: { include: { user: true } },
    class: { include: { classTeacher: { include: { user: true } } } }
  }
});

const recipients = [
  student.userId,                      // Student
  student.parent?.userId,              // Parent
  student.class?.classTeacher?.userId  // Class teacher (optional)
].filter(Boolean);
```

### Grade Operations:
```javascript
const recipients = [
  student.userId,          // Student
  student.parent?.userId   // Parent
].filter(Boolean);
```

### Payment Operations:
```javascript
const recipients = [
  student.parent?.userId   // Parent (primarily)
].filter(Boolean);

// For overdue, also notify admin:
if (isOverdue) {
  const admins = await getUserIdsByRoles(['SCHOOL_ADMIN', 'FINANCE'], schoolId);
  recipients.push(...admins);
}
```

### System Operations:
```javascript
// Notify all admins
const recipients = await getUserIdsByRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN'], schoolId);
```

---

## 🔄 ERROR HANDLING TEMPLATE

```javascript
// Wrap ALL audit/notification code in try-catch

// ✅ Pattern for audit logs
try {
  await createAuditLog({ ... });
  console.log('✅ Audit log created');
} catch (auditError) {
  console.error('❌ Audit log failed:', auditError);
  // Continue - don't throw
}

// ✅ Pattern for notifications
try {
  await createNotification({ ... });
  console.log('✅ Notification sent');
} catch (notifError) {
  console.error('❌ Notification failed:', notifError);
  // Continue - don't throw
}

// ✅ Pattern for events
try {
  const service = new StudentEventService();
  await service.createStudentEvent({ ... });
  console.log('✅ Event tracked');
} catch (eventError) {
  console.error('❌ Event tracking failed:', eventError);
  // Continue - don't throw
}
```

**Why not throw?** Because main operation (attendance, grade, payment) should succeed even if audit/notification fails!

---

## 🧪 TESTING CHECKLIST

After adding to any controller:

### Manual Tests:
- [ ] Perform the operation (create/update/delete)
- [ ] Check console for success messages
- [ ] Check console for any errors
- [ ] Verify main operation succeeded

### Database Checks:
```sql
-- Check audit log
SELECT * FROM audit_logs 
WHERE entityType = 'YourEntity' 
ORDER BY createdAt DESC LIMIT 5;

-- Check notification
SELECT * FROM notifications 
WHERE entityType = 'YourEntity' 
ORDER BY createdAt DESC LIMIT 5;

-- Check event (if student-related)
SELECT * FROM student_events 
WHERE studentId = YOUR_STUDENT_ID 
ORDER BY createdAt DESC LIMIT 5;
```

### API Tests:
```bash
# Create operation
curl -X POST http://localhost:5000/api/endpoint \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "data": "..." }'

# Check response is successful
# Then check database tables above
```

---

## 📋 IMPLEMENTATION CHECKLIST

### For Each Controller You Update:

**attendanceController.js:**
- [ ] Import audit/notification functions
- [ ] Add audit log to markIn
- [ ] Add audit log to markOut  
- [ ] Add audit log to markLeave
- [ ] Add audit log to updateAttendance
- [ ] Add audit log to deleteAttendance
- [ ] Add notification for absences
- [ ] Add notification for late arrivals
- [ ] Add student events
- [ ] Test all functions
- [ ] Deploy to production

**excelGradeController.js:**
- [ ] Import audit/notification functions
- [ ] Add audit log to bulkGradeEntry
- [ ] Add audit log to updateGrade
- [ ] Add audit log to deleteGrade
- [ ] Add notification for grade posting
- [ ] Add high-priority notification for low grades
- [ ] Add student events
- [ ] Test all functions
- [ ] Deploy to production

**paymentController.js:**
- [ ] Import audit/notification functions
- [ ] Add audit log to createPayment
- [ ] Add audit log to updatePayment
- [ ] Add audit log to deletePayment
- [ ] Add payment receipt notification
- [ ] Add student payment events
- [ ] Test all functions
- [ ] Deploy to production

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying:
- [ ] All changes tested locally
- [ ] No console errors
- [ ] Database queries verified
- [ ] Notifications received successfully
- [ ] No performance degradation

Deploy process:
```bash
# 1. Copy updated controller
scp controllers/attendanceController.js root@server:/path/to/sms/controllers/

# 2. Restart backend
pm2 restart sms

# 3. Monitor logs
pm2 logs sms

# 4. Test in production
# Make a test operation and verify audit log created
```

After deploying:
- [ ] Monitor for errors for 30 minutes
- [ ] Test one operation of each type
- [ ] Verify notifications are delivered
- [ ] Check audit logs are created
- [ ] Confirm no performance issues

---

## 💡 TIPS & BEST PRACTICES

### Tip 1: Always Use Try-Catch
```javascript
// Audit/notification failures shouldn't break main operation
try {
  await createAuditLog({ ... });
} catch (err) {
  console.error('Audit failed:', err);
  // Continue execution
}
```

### Tip 2: Log Success Messages
```javascript
// Helps debugging
console.log('✅ Audit log created for attendance:', attendanceId);
console.log('✅ Notification sent to:', recipients.length, 'users');
```

### Tip 3: Use Meaningful Entity Types
```javascript
// ✅ GOOD: Consistent PascalCase
entityType: 'Student'
entityType: 'Grade'
entityType: 'Attendance'

// ❌ BAD: Inconsistent naming
entityType: 'student'
entityType: 'GRADE'
entityType: 'attendance_record'
```

### Tip 4: Include Relevant Metadata
```javascript
// More metadata = better debugging
metadata: {
  studentId: studentId.toString(),
  studentName: `${firstName} ${lastName}`,
  className: className,
  date: date.toISOString(),
  // ... anything that helps understand the context
}
```

### Tip 5: Test Notification Channels Separately
```javascript
// Start with IN_APP only
channels: ['IN_APP']

// Once working, add SMS
channels: ['IN_APP', 'SMS']

// Finally add EMAIL
channels: ['IN_APP', 'SMS', 'EMAIL']
```

---

## 🎯 COPY-PASTE TEMPLATES

### Template 1: Attendance Mark In/Out

```javascript
// Audit log
await createAuditLog({
  action: 'MARK_IN', // or 'MARK_OUT'
  entityType: 'Attendance',
  entityId: attendance.id,
  userId: req.user.id,
  schoolId: req.user.schoolId,
  newData: JSON.stringify(attendance),
  ipAddress: req.ip,
  userAgent: req.get('User-Agent')
});

// Student event
const studentEventService = new StudentEventService();
await studentEventService.createStudentAttendanceEvent(
  attendance.studentId, attendance, req.user.id, req.user.schoolId
);
```

### Template 2: Grade Entry

```javascript
// Audit log
await createAuditLog({
  action: 'CREATE',
  entityType: 'Grade',
  entityId: grade.id,
  userId: req.user.id,
  schoolId: req.user.schoolId,
  newData: JSON.stringify(grade),
  ipAddress: req.ip,
  userAgent: req.get('User-Agent')
});

// Student event
const studentEventService = new StudentEventService();
await studentEventService.createStudentExamGradeEvent(
  grade.studentId,
  { ...grade, subject: subjectName, examType: examType },
  req.user.id,
  req.user.schoolId
);

// Notification
await createNotification({
  type: 'GRADE_POSTED',
  title: 'New Grade',
  message: `Grade: ${grade.marks}/${exam.totalMarks}`,
  recipients: [studentUserId, parentUserId],
  priority: grade.marks < passingMarks ? 'HIGH' : 'NORMAL',
  schoolId: req.user.schoolId,
  senderId: req.user.id
});
```

### Template 3: Payment Recording

```javascript
// Audit log
await createAuditLog({
  action: 'CREATE',
  entityType: 'Payment',
  entityId: payment.id,
  userId: req.user.id,
  schoolId: req.user.schoolId,
  newData: JSON.stringify(payment),
  ipAddress: req.ip,
  userAgent: req.get('User-Agent')
});

// Student event
const studentEventService = new StudentEventService();
await studentEventService.createStudentPaymentEvent(
  payment.studentId, payment, req.user.id, req.user.schoolId
);

// Receipt notification
await createNotification({
  type: 'PAYMENT_RECEIVED',
  title: 'Payment Received',
  message: `Amount: ${payment.amount}, Receipt #${payment.receiptNo}`,
  recipients: [parentUserId],
  priority: 'NORMAL',
  schoolId: req.user.schoolId,
  senderId: req.user.id,
  channels: ['IN_APP', 'SMS', 'EMAIL']
});
```

---

## ⏱️ TIME ESTIMATES

### Per Controller:
- Add imports: 5 minutes
- Add audit log to CREATE: 15 minutes
- Add audit log to UPDATE: 20 minutes (need oldData)
- Add audit log to DELETE: 15 minutes
- Add notifications: 30 minutes
- Add events: 20 minutes
- Testing: 30 minutes
- **Total per controller: 2-3 hours**

### Priority Order:
1. attendanceController.js - 3 hours
2. excelGradeController.js - 3 hours
3. paymentController.js - 2 hours
4. Create auditController.js - 2 hours
5. **Total: 10 hours**

---

## 📞 NEED HELP?

### Common Questions:

**Q: Which audit log function should I use?**
A: Use `import { createAuditLog } from '../utils/responseUtils.js'`

**Q: Do I need to add to every function?**
A: Yes, for CREATE, UPDATE, DELETE. Optional for READ.

**Q: What if audit log fails?**
A: Wrap in try-catch, log error, continue execution.

**Q: How do I know if notification was sent?**
A: Check notifications table, check console for success/error logs.

**Q: Can I test locally?**
A: Yes! All systems work in development. Check database after operations.

**Q: What if I break something?**
A: Wrapped in try-catch, so main operation continues. Just fix and redeploy.

---

**🎉 You're ready to implement! Start with attendanceController.js**

*Refer to AUDIT_NOTIFICATION_EVENT_ANALYSIS.md for detailed system analysis.*
*Refer to IMPLEMENTATION_GUIDE_AUDIT_NOTIFICATIONS.md for step-by-step walkthrough.*

