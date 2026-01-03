# Automated Attendance System

## Overview

The Automated Attendance System provides time-based restrictions for student attendance marking and automatically marks absent students who haven't marked in by the specified time. The system operates on Afghanistan timezone (UTC+4:30) and enforces strict time windows for mark-in and mark-out operations.

## Features

### 🕐 Time-Based Restrictions

- **Mark-In Window**: 7:00 AM - 8:00 AM (Afghanistan time)
- **Mark-Out Window**: 12:00 PM - 1:00 PM (Afghanistan time)
- **Auto-Absent Time**: After 9:00 AM (Afghanistan time)

### 🤖 Automated Absent Marking

- Automatically marks students absent if no mark-in is recorded by 9:00 AM
- Processes all active students in the school
- Sends SMS notifications to absent students
- Creates or updates attendance records as needed

### 🌍 Timezone Support

- Full Afghanistan timezone support (UTC+4:30)
- Real-time timezone conversion
- Accurate time window calculations

## API Endpoints

### Public Endpoints (No Authentication Required)

#### 1. Mark In Time
```http
POST /api/attendances/mark-in-time
```

**Time Restriction**: Only allowed from 7:00 AM to 8:00 AM Afghanistan time

**Request Body**:
```json
{
  "studentId": "123",
  "subjectId": "456",
  "date": "2025-01-27"
}
```

**Response**:
- Success: 200 OK with attendance data
- Time Window Closed: 400 Bad Request with time information

#### 2. Mark Out Time
```http
POST /api/attendances/mark-out-time
```

**Time Restriction**: Only allowed from 12:00 PM to 1:00 PM Afghanistan time

**Request Body**:
```json
{
  "studentId": "123",
  "subjectId": "456",
  "date": "2025-01-27"
}
```

**Response**:
- Success: 200 OK with updated attendance data
- Time Window Closed: 400 Bad Request with time information

#### 3. Get Time Status
```http
GET /api/attendances/time-status
```

**Response**:
```json
{
  "success": true,
  "data": {
    "currentAfghanTime": "2025-01-27 08:30:00",
    "currentHour": 8,
    "currentMinute": 30,
    "timeWindows": {
      "markIn": {
        "start": 7,
        "end": 8,
        "isOpen": false,
        "description": "7:00 AM - 8:00 AM (Afghanistan time)"
      },
      "markOut": {
        "start": 12,
        "end": 13,
        "isOpen": false,
        "description": "12:00 PM - 1:00 PM (Afghanistan time)"
      },
      "autoAbsent": {
        "time": 9,
        "isActive": false,
        "description": "After 9:00 AM - automatically mark absent students"
      }
    },
    "nextWindow": {
      "type": "markOut",
      "time": "12:00 PM",
      "description": "Mark-out window opens at 12:00 PM",
      "waitTime": "3.5 hours"
    },
    "timezone": "Asia/Kabul",
    "utcOffset": "+04:30"
  }
}
```

### Protected Endpoints (Authentication Required)

#### 4. Auto-Mark Absent Students
```http
POST /api/attendances/auto-mark-absent
```

**Permissions**: `attendance:create`, `attendance:update`

**Time Restriction**: Only runs after 9:00 AM Afghanistan time

**Response**:
```json
{
  "success": true,
  "data": {
    "totalStudents": 150,
    "presentCount": 120,
    "absentCount": 30,
    "errorCount": 0,
    "processedAt": "2025-01-27 09:15:00",
    "date": "2025-01-27T00:00:00.000Z"
  }
}
```

## Automated Script

### Setup Cron Job

The system includes an automated script that can be run as a cron job:

```bash
# Run every day at 9:15 AM Afghanistan time (4:45 AM UTC)
0 45 4 * * * /usr/bin/node /path/to/scripts/autoAttendance.js
```

### Manual Execution

```bash
# Run manually
node scripts/autoAttendance.js

# Or with specific school ID
SCHOOL_ID=2 node scripts/autoAttendance.js
```

### Environment Variables

```bash
# Required
DATABASE_URL="postgresql://user:password@localhost:5432/school_db"
JWT_SECRET="your-secret-key"

# Optional (defaults to 1)
SCHOOL_ID="1"
```

## Implementation Details

### Time Window Logic

```javascript
// Mark-in window: 7:00 AM - 8:00 AM
const isMarkInTimeWindow = () => {
  const afghanTime = getAfghanistanTime();
  const hour = afghanTime.getHours();
  return hour >= 7 && hour < 8;
};

// Mark-out window: 12:00 PM - 1:00 PM
const isMarkOutTimeWindow = () => {
  const afghanTime = getAfghanistanTime();
  const hour = afghanTime.getHours();
  return hour >= 12 && hour < 13;
};

// Auto-absent time: After 9:00 AM
const isAutoAbsentTime = () => {
  const afghanTime = getAfghanistanTime();
  const hour = afghanTime.getHours();
  return hour >= 9;
};
```

### Timezone Handling

```javascript
const getAfghanistanTime = () => {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { 
    timeZone: 'Asia/Kabul' 
  }));
};
```

## Error Handling

### Time Window Violations

When attempting to mark attendance outside the allowed time windows:

```json
{
  "success": false,
  "error": "Mark-in time window closed",
  "message": "Mark-in is only allowed from 7:00 AM to 8:00 AM Afghanistan time. Current time: 2025-01-27 09:30:00",
  "currentAfghanTime": "2025-01-27 09:30:00",
  "allowedWindow": "7:00 AM - 8:00 AM (Afghanistan time)"
}
```

### Auto-Mark Absent Errors

```json
{
  "success": false,
  "error": "Not yet time to auto-mark absent",
  "message": "Auto-mark absent runs after 9:00 AM Afghanistan time. Current time: 2025-01-27 08:30:00",
  "currentAfghanTime": "2025-01-27 08:30:00",
  "autoMarkTime": "After 9:00 AM (Afghanistan time)"
}
```

## SMS Notifications

### Absent Student Notifications

When a student is automatically marked absent:

- **Recipient**: Student's registered phone number
- **Message**: Includes student name, date, class, status, and reason
- **Campaign ID**: 'absent'
- **Timing**: Sent immediately after marking absent

### Example SMS Content

```
Dear Muhammad Abobakar Ebadi,
You have been marked ABSENT for today (2025-01-27) in Grade 1 - A.
Reason: No mark-in recorded by 9:00 AM
```

## Monitoring and Logging

### Console Logs

The system provides comprehensive logging:

```
🤖 Auto-marking absent students...
🌍 Current Afghanistan time: 2025-01-27 09:15:00
📅 Processing date: 2025-01-27T00:00:00.000Z
🏫 School ID: 1
📚 Found 150 active students
✅ Student Muhammad Abobakar Ebadi already marked present
❌ Created absent record for student John Doe
📱 Absent SMS sent to John Doe
📊 Auto-mark absent summary: { totalStudents: 150, presentCount: 120, absentCount: 30, errorCount: 0 }
✅ Auto-mark absent completed successfully
```

### Error Tracking

- Student processing errors are logged individually
- SMS sending failures are logged but don't stop the process
- Database errors are logged with full context

## Security Considerations

### Authentication

- Mark-in and mark-out endpoints are public (no authentication required)
- Time status endpoint is public for easy access
- Auto-mark absent endpoint requires proper permissions

### Data Validation

- All student IDs are validated against the database
- Date formats are properly parsed and validated
- School ID validation ensures data isolation

### Rate Limiting

Consider implementing rate limiting for public endpoints to prevent abuse:

```javascript
// Example rate limiting
const rateLimit = require('express-rate-limit');

const markInLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many mark-in attempts, please try again later'
});

router.post('/mark-in-time', markInLimit, markInTime);
```

## Testing

### Manual Testing

1. **Test Time Windows**:
   - Try marking in before 7:00 AM → Should fail
   - Try marking in at 7:30 AM → Should succeed
   - Try marking in after 8:00 AM → Should fail

2. **Test Auto-Absent**:
   - Run script before 9:00 AM → Should fail
   - Run script after 9:00 AM → Should succeed

3. **Test Time Status**:
   - Check endpoint at different times
   - Verify timezone accuracy

### Automated Testing

```javascript
// Example test cases
describe('Attendance Time Windows', () => {
  test('mark-in should fail before 7 AM', () => {
    // Mock time to 6:30 AM Afghanistan time
    // Expect 400 error
  });

  test('mark-in should succeed at 7:30 AM', () => {
    // Mock time to 7:30 AM Afghanistan time
    // Expect 200 success
  });

  test('mark-in should fail after 8 AM', () => {
    // Mock time to 8:30 AM Afghanistan time
    // Expect 400 error
  });
});
```

## Troubleshooting

### Common Issues

1. **Timezone Mismatch**:
   - Verify server timezone settings
   - Check Afghanistan timezone support
   - Validate time calculations

2. **SMS Failures**:
   - Check SMS service configuration
   - Verify phone number formats
   - Monitor SMS service logs

3. **Database Errors**:
   - Check Prisma connection
   - Verify database permissions
   - Check for BigInt serialization issues

### Debug Mode

Enable detailed logging by setting environment variable:

```bash
DEBUG=attendance:* node scripts/autoAttendance.js
```

## Future Enhancements

### Planned Features

1. **Flexible Time Windows**:
   - Configurable time windows per school
   - Holiday and weekend exceptions
   - Seasonal adjustments

2. **Advanced Notifications**:
   - Email notifications
   - Push notifications
   - Parent portal alerts

3. **Analytics Dashboard**:
   - Real-time attendance monitoring
   - Trend analysis
   - Performance metrics

4. **Mobile App Integration**:
   - QR code scanning
   - GPS verification
   - Photo verification

### Configuration Options

```javascript
// Future configuration structure
const ATTENDANCE_CONFIG = {
  timeWindows: {
    markIn: { start: 7, end: 8, flexible: false },
    markOut: { start: 12, end: 13, flexible: false },
    autoAbsent: { time: 9, enabled: true }
  },
  notifications: {
    sms: { enabled: true, template: 'default' },
    email: { enabled: false, template: 'parent' },
    push: { enabled: false }
  },
  exceptions: {
    holidays: ['2025-01-01', '2025-01-02'],
    weekends: ['Saturday', 'Sunday'],
    specialDays: []
  }
};
```

## Support

For technical support or questions about the Automated Attendance System:

- **Documentation**: Check this file and related API docs
- **Logs**: Review console logs and error messages
- **Testing**: Use the test endpoints to verify functionality
- **Monitoring**: Check time status endpoint for current system state

---

**Last Updated**: January 27, 2025  
**Version**: 1.0.0  
**Author**: School Management System Team 