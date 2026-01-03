# Automatic Attendance Service

## Overview

The Automatic Attendance Service is a backend service that automatically marks students as absent based on incomplete attendance records. It runs automatically with your main application and can also be triggered manually.

## Features

### 1. **Automatic Incomplete Attendance Marking**
- **Function**: `markIncompleteAttendanceAsAbsent()`
- **Purpose**: Marks students absent who don't have both `inTime` and `outTime` records for the current day
- **Logic**: 
  - If a student has no attendance record for today → Creates absent record
  - If a student has incomplete attendance (missing inTime OR outTime) → Updates to absent
  - If a student has complete attendance (both inTime AND outTime) → Marks as present

### 2. **Time-Based Auto-Absent Marking**
- **Function**: `autoMarkAbsentStudents()`
- **Purpose**: Marks students absent who haven't marked in by 9:00 AM Afghanistan time
- **Time Window**: After 9:00 AM Afghanistan time (UTC+4:30)

### 3. **Automatic Service**
- **Function**: `startAttendanceService()`
- **Purpose**: Automatically runs the attendance service every 15 minutes
- **Integration**: Starts automatically when your main app.js starts

## How It Works

### Automatic Execution
1. **Service Start**: When your app.js starts, the attendance service automatically starts
2. **Immediate Check**: If it's the right time (after 9 AM), runs immediately
3. **Scheduled Checks**: Checks every 15 minutes if it's time to run
4. **Database Updates**: Updates attendance records in real-time
5. **SMS Notifications**: Sends SMS notifications to absent students (if SMS service is configured)

### Manual Execution
You can also trigger the service manually through API endpoints or scripts.

## API Endpoints

### 1. Mark Incomplete Attendance as Absent
```http
POST /api/attendances/mark-incomplete-absent
Authorization: Bearer <token>
Permissions: attendance:create, attendance:update
```

**Response:**
```json
{
  "success": true,
  "message": "Marked incomplete attendance as absent successfully",
  "data": {
    "totalStudents": 150,
    "presentCount": 45,
    "absentCount": 105,
    "errorCount": 0,
    "processedAt": "08/30/2025, 09:15:30 AM",
    "date": "2025-08-30T09:15:30.000Z",
    "description": "Marked students absent who have incomplete attendance records (missing inTime or outTime)"
  }
}
```

### 2. Auto-Mark Absent Students
```http
POST /api/attendances/auto-mark-absent
Authorization: Bearer <token>
Permissions: attendance:create, attendance:update
```

**Response:**
```json
{
  "success": true,
  "message": "Auto-mark absent completed successfully",
  "data": {
    "totalStudents": 150,
    "presentCount": 45,
    "absentCount": 105,
    "errorCount": 0,
    "processedAt": "08/30/2025, 09:15:30 AM",
    "date": "2025-08-30T09:15:30.000Z"
  }
}
```

### 3. Get Attendance Time Status
```http
GET /api/attendances/time-status
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance time status retrieved successfully",
  "data": {
    "currentAfghanTime": "08/30/2025, 09:15:30 AM",
    "currentHour": 9,
    "currentMinute": 15,
    "timeWindows": {
      "markIn": {
        "start": "Any time",
        "end": "Any time",
        "isOpen": true,
        "description": "Time restrictions removed - attendance can be marked at any time"
      },
      "markOut": {
        "start": "Any time",
        "end": "Any time",
        "isOpen": true,
        "description": "Time restrictions removed - attendance can be marked at any time"
      },
      "autoAbsent": {
        "time": "9:00 AM",
        "isActive": true,
        "description": "Auto-absent feature runs after 9:00 AM Afghanistan time"
      }
    },
    "timezone": "Asia/Kabul",
    "utcOffset": "+04:30"
  }
}
```

## Configuration

### Environment Variables
```bash
# School ID for the attendance service
SCHOOL_ID=1

# Database connection
DATABASE_URL=mysql://user:password@host:port/database
```

### Time Settings
The service uses Afghanistan timezone (UTC+4:30) by default. You can modify the time settings in `services/attendanceService.js`:

```javascript
const ATTENDANCE_TIMES = {
  AUTO_ABSENT_TIME: 9  // 9:00 AM - after this time, mark absent if no mark-in
};
```

## Testing

### Manual Test Script
Run the test script to verify the service works:

```bash
node scripts/test-attendance-service.js
```

### Test Output
```
🧪 Testing Automatic Attendance Service...

📊 Test 1: Getting attendance time status...
✅ Time Status: { ... }

📊 Test 2: Testing mark incomplete attendance as absent...
🏫 Using School ID: 1
✅ Result: { ... }

📊 Test 3: Testing auto-mark absent students...
✅ Auto-mark Result: { ... }

🎉 All tests completed successfully!
```

## Database Schema Requirements

The service expects the following database structure:

### Students Table
- `id` (BigInt)
- `schoolId` (BigInt)
- `classId` (BigInt)
- `deletedAt` (DateTime, nullable)

### Users Table (related to students)
- `status` (String) - must be 'ACTIVE'

### Attendance Table
- `id` (BigInt)
- `studentId` (BigInt)
- `classId` (BigInt)
- `date` (Date)
- `status` (String) - 'PRESENT', 'ABSENT', 'LATE', etc.
- `inTime` (DateTime, nullable)
- `outTime` (DateTime, nullable)
- `schoolId` (BigInt)
- `createdBy` (BigInt)
- `createdAt` (DateTime)
- `updatedAt` (DateTime, nullable)
- `deletedAt` (DateTime, nullable)

## SMS Integration

**Note**: SMS notifications are **NOT** sent for automatic absent marking to avoid spam and reduce costs.

SMS notifications are only sent for:
- **Check-in (Mark In-Time)**: When students mark their arrival
- **Check-out (Mark Out-Time)**: When students mark their departure

This is handled by the existing attendance controller (`controllers/attendanceController.js`) and not by this automatic service.

## Monitoring and Logs

The service provides comprehensive logging:

- **Service Start**: When the attendance service starts
- **Execution Logs**: Each time the service runs
- **Student Processing**: Individual student processing logs
- **SMS Notifications**: SMS sending status
- **Error Handling**: Detailed error logs
- **Summary Reports**: Complete execution summaries

## Troubleshooting

### Common Issues

1. **Service Not Starting**
   - Check if the service file exists: `services/attendanceService.js`
   - Verify database connection
   - Check console logs for errors

2. **No Students Being Processed**
   - Verify students exist in the database
   - Check if students have `status: 'ACTIVE'`
   - Verify school ID configuration

3. **SMS Not Sending**
   - Check SMS service configuration
   - Verify student phone numbers
   - Check SMS service logs

4. **Time Zone Issues**
   - Verify Afghanistan timezone is working
   - Check system time settings
   - Verify time calculations

### Debug Mode
Enable detailed logging by setting environment variable:
```bash
DEBUG=attendance:*
```

## Performance Considerations

- **Batch Processing**: Processes students one by one for reliability
- **Database Optimization**: Uses efficient Prisma queries
- **Memory Management**: Minimal memory footprint
- **Error Isolation**: Individual student errors don't stop the entire process

## Security

- **Authentication Required**: All manual endpoints require valid JWT tokens
- **Permission Based**: Requires specific attendance permissions
- **School Isolation**: Only processes students from the authenticated user's school
- **Audit Trail**: All changes are logged with user information

## Future Enhancements

- **Bulk Processing**: Process multiple schools simultaneously
- **Custom Time Windows**: Configurable time windows per school
- **Advanced Notifications**: Email, push notifications, etc.
- **Analytics Dashboard**: Real-time attendance statistics
- **Machine Learning**: Predict attendance patterns 