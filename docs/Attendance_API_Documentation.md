# Attendance Management API Documentation

## Overview
The Attendance Management API provides comprehensive functionality for tracking student attendance with in-time and out-time capabilities. This system allows teachers and administrators to manage student attendance records efficiently.

## Base URL
```
https://your-domain.com/api/attendances
```

## Authentication
All endpoints require JWT Bearer token authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Available Endpoints

### 1. Get All Attendances
**GET** `/api/attendances`

Retrieve all attendance records with optional filtering and pagination.

#### Query Parameters
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of records per page (default: 50, max: 100)
- `studentId` (optional): Filter by specific student
- `classId` (optional): Filter by specific class
- `date` (optional): Filter by specific date (YYYY-MM-DD format)
- `status` (optional): Filter by attendance status
- `schoolId` (optional): Filter by school (defaults to user's school)

#### Example Request
```bash
GET /api/attendances?page=1&limit=20&classId=1&date=2025-08-24&status=PRESENT
```

#### Response
```json
{
  "success": true,
  "message": "Attendances retrieved successfully",
  "data": {
    "attendances": [
      {
        "id": "1",
        "uuid": "123e4567-e89b-12d3-a456-426614174000",
        "date": "2025-08-24T00:00:00.000Z",
        "status": "PRESENT",
        "inTime": "2025-08-24T08:00:00.000Z",
        "outTime": "2025-08-24T16:00:00.000Z",
        "remarks": "Student attended all classes",
        "student": {
          "id": "1",
          "rollNo": "001",
          "user": {
            "firstName": "John",
            "lastName": "Doe"
          }
        },
        "class": {
          "id": "1",
          "name": "Grade 10-A",
          "code": "10A"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### 2. Get Attendance by ID
**GET** `/api/attendances/:id`

Retrieve a specific attendance record by its ID.

#### Example Request
```bash
GET /api/attendances/1
```

#### Response
```json
{
  "success": true,
  "message": "Attendance retrieved successfully",
  "data": {
    "id": "1",
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "date": "2025-08-24T00:00:00.000Z",
    "status": "PRESENT",
    "inTime": "2025-08-24T08:00:00.000Z",
    "outTime": "2025-08-24T16:00:00.000Z",
    "remarks": "Student attended all classes",
    "student": {
      "id": "1",
      "rollNo": "001",
      "user": {
        "firstName": "John",
        "lastName": "Doe"
      }
    },
    "class": {
      "id": "1",
      "name": "Grade 10-A",
      "code": "10A"
    }
  }
}
```

### 3. Create Attendance
**POST** `/api/attendances`

Create a new attendance record with in-time and out-time.

#### Request Body
```json
{
  "studentId": "1",
  "classId": "1",
  "subjectId": "1",
  "date": "2025-08-24",
  "status": "PRESENT",
  "inTime": "2025-08-24T08:00:00.000Z",
  "outTime": "2025-08-24T16:00:00.000Z",
  "remarks": "Student attended all classes"
}
```

#### Required Fields
- `studentId`: Student's ID
- `classId`: Class ID
- `date`: Date of attendance (YYYY-MM-DD format)
- `status`: Attendance status

#### Optional Fields
- `subjectId`: Subject ID
- `inTime`: Student arrival time
- `outTime`: Student departure time
- `remarks`: Additional notes

#### Response
```json
{
  "success": true,
  "message": "Attendance created successfully",
  "data": {
    "id": "1",
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "date": "2025-08-24T00:00:00.000Z",
    "status": "PRESENT",
    "inTime": "2025-08-24T08:00:00.000Z",
    "outTime": "2025-08-24T16:00:00.000Z",
    "remarks": "Student attended all classes",
    "studentId": "1",
    "classId": "1",
    "subjectId": "1",
    "schoolId": "1",
    "createdAt": "2025-08-24T10:00:00.000Z"
  }
}
```

### 4. Mark In-Time
**POST** `/api/attendances/mark-in-time`

Mark student arrival time. This endpoint automatically creates an attendance record if none exists, or updates the existing one with the in-time.

#### Request Body
```json
{
  "studentId": "1",
  "classId": "1",
  "subjectId": "1",
  "date": "2025-08-24"
}
```

#### Required Fields
- `studentId`: Student's ID
- `classId`: Class ID
- `date`: Date of attendance

#### Optional Fields
- `subjectId`: Subject ID

#### Response
```json
{
  "success": true,
  "message": "In-time marked successfully",
  "data": {
    "id": "1",
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "date": "2025-08-24T00:00:00.000Z",
    "status": "PRESENT",
    "inTime": "2025-08-24T08:00:00.000Z",
    "outTime": null,
    "studentId": "1",
    "classId": "1",
    "subjectId": "1",
    "schoolId": "1",
    "createdAt": "2025-08-24T08:00:00.000Z"
  }
}
```

### 5. Mark Out-Time
**POST** `/api/attendances/mark-out-time`

Mark student departure time. Requires an existing attendance record.

#### Request Body
```json
{
  "studentId": "1",
  "classId": "1",
  "subjectId": "1",
  "date": "2025-08-24"
}
```

#### Required Fields
- `studentId`: Student's ID
- `classId`: Class ID
- `date`: Date of attendance

#### Optional Fields
- `subjectId`: Subject ID

#### Response
```json
{
  "success": true,
  "message": "Out-time marked successfully",
  "data": {
    "id": "1",
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "date": "2025-08-24T00:00:00.000Z",
    "status": "PRESENT",
    "inTime": "2025-08-24T08:00:00.000Z",
    "outTime": "2025-08-24T16:00:00.000Z",
    "studentId": "1",
    "classId": "1",
    "subjectId": "1",
    "schoolId": "1",
    "updatedAt": "2025-08-24T16:00:00.000Z"
  }
}
```

### 6. Update Attendance
**PUT** `/api/attendances/:id`

Update an existing attendance record.

#### Request Body
```json
{
  "status": "LATE",
  "inTime": "2025-08-24T08:30:00.000Z",
  "outTime": "2025-08-24T16:00:00.000Z",
  "remarks": "Student arrived 30 minutes late"
}
```

#### Optional Fields
- `status`: Attendance status
- `inTime`: Student arrival time
- `outTime`: Student departure time
- `remarks`: Additional notes

#### Response
```json
{
  "success": true,
  "message": "Attendance updated successfully",
  "data": {
    "id": "1",
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "date": "2025-08-24T00:00:00.000Z",
    "status": "LATE",
    "inTime": "2025-08-24T08:30:00.000Z",
    "outTime": "2025-08-24T16:00:00.000Z",
    "remarks": "Student arrived 30 minutes late",
    "studentId": "1",
    "classId": "1",
    "subjectId": "1",
    "schoolId": "1",
    "updatedAt": "2025-08-24T16:00:00.000Z"
  }
}
```

### 7. Bulk Create Attendance
**POST** `/api/attendances/bulk`

Create multiple attendance records at once.

#### Request Body
```json
{
  "attendances": [
    {
      "studentId": "1",
      "classId": "1",
      "subjectId": "1",
      "date": "2025-08-24",
      "status": "PRESENT",
      "inTime": "2025-08-24T08:00:00.000Z",
      "outTime": "2025-08-24T16:00:00.000Z",
      "remarks": "Present"
    },
    {
      "studentId": "2",
      "classId": "1",
      "subjectId": "1",
      "date": "2025-08-24",
      "status": "ABSENT",
      "remarks": "Absent"
    },
    {
      "studentId": "3",
      "classId": "1",
      "subjectId": "1",
      "date": "2025-08-24",
      "status": "LATE",
      "inTime": "2025-08-24T08:30:00.000Z",
      "remarks": "Late arrival"
    }
  ]
}
```

#### Response
```json
{
  "success": true,
  "message": "Bulk attendance created successfully",
  "data": {
    "created": 3
  }
}
```

### 8. Delete Attendance
**DELETE** `/api/attendances/:id`

Soft delete an attendance record (marks as deleted but doesn't remove from database).

#### Response
```json
{
  "success": true,
  "message": "Attendance deleted successfully"
}
```

## Attendance Status Values

The system supports the following attendance statuses:

- `PRESENT`: Student is present
- `ABSENT`: Student is absent
- `LATE`: Student arrived late
- `EXCUSED`: Student is excused (e.g., medical leave)
- `HALF_DAY`: Student attended for part of the day

## Data Models

### Attendance Record Structure
```typescript
interface Attendance {
  id: string;
  uuid: string;
  date: Date;
  status: AttendanceStatus;
  inTime?: Date;        // Student arrival time
  outTime?: Date;       // Student departure time
  remarks?: string;     // Additional notes
  studentId?: string;   // Student reference
  teacherId?: string;   // Teacher reference
  staffId?: string;     // Staff reference
  classId?: string;     // Class reference
  subjectId?: string;   // Subject reference
  schoolId: string;     // School reference
  createdBy: string;    // User who created the record
  updatedBy?: string;   // User who last updated the record
  createdAt: Date;      // Record creation timestamp
  updatedAt: Date;      // Record last update timestamp
  deletedAt?: Date;     // Soft delete timestamp
}
```

## Error Handling

All endpoints return standardized error responses:

### Error Response Format
```json
{
  "success": false,
  "error": "Error description",
  "message": "User-friendly error message",
  "meta": {
    "timestamp": "2025-08-24T10:00:00.000Z",
    "statusCode": 400,
    "errorType": "VALIDATION"
  }
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate record)
- `500`: Internal Server Error

## Usage Examples

### Marking Daily Attendance

1. **Morning Check-in (In-Time)**
```bash
POST /api/attendances/mark-in-time
{
  "studentId": "1",
  "classId": "1",
  "date": "2025-08-24"
}
```

2. **Afternoon Check-out (Out-Time)**
```bash
POST /api/attendances/mark-out-time
{
  "studentId": "1",
  "classId": "1",
  "date": "2025-08-24"
}
```

### Bulk Attendance for a Class

```bash
POST /api/attendances/bulk
{
  "attendances": [
    {
      "studentId": "1",
      "classId": "1",
      "date": "2025-08-24",
      "status": "PRESENT",
      "inTime": "2025-08-24T08:00:00.000Z"
    },
    {
      "studentId": "2",
      "classId": "1",
      "date": "2025-08-24",
      "status": "ABSENT"
    }
  ]
}
```

### Updating Late Arrival

```bash
PUT /api/attendances/1
{
  "status": "LATE",
  "inTime": "2025-08-24T08:30:00.000Z",
  "remarks": "Traffic delay"
}
```

## Permissions Required

- `attendance:read`: View attendance records
- `attendance:create`: Create attendance records
- `attendance:update`: Update attendance records
- `attendance:delete`: Delete attendance records

## Rate Limiting

- Standard endpoints: 100 requests per minute per user
- Bulk operations: 10 requests per minute per user

## Best Practices

1. **Use mark-in-time and mark-out-time** for daily attendance tracking
2. **Use bulk operations** for class-wide attendance
3. **Include remarks** for important notes (late arrivals, early departures, etc.)
4. **Validate data** before sending requests
5. **Handle errors gracefully** in your application
6. **Use pagination** when retrieving large numbers of records

## Support

For technical support or questions about the Attendance API, please contact the development team or refer to the system documentation. 