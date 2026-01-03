# Suggestion & Complaint System Implementation

## Overview
A comprehensive suggestion and complaint system that allows parents to submit suggestions or complaints to specific teachers or admins, with full response capabilities and admin oversight.

## Features Implemented

### 1. Database Schema
- **New Model**: `SuggestionComplaint` with full relationships
- **Enums**: `RecipientType`, `SuggestionComplaintType`, `Priority`, `SuggestionComplaintStatus`
- **Relations**: Connected to Parent, Student, User (recipient/responder), and School models
- **Encryption**: Title and description fields are encrypted for security

### 2. Backend API Endpoints
- `POST /api/suggestion-complaints` - Create new suggestion/complaint
- `GET /api/suggestion-complaints/recipients` - Get available teachers/admins
- `GET /api/suggestion-complaints/parent/:parentId` - Get parent's submissions
- `GET /api/suggestion-complaints/recipient/:recipientId` - Get recipient's submissions
- `GET /api/suggestion-complaints/admin/all` - Get all submissions for admin
- `POST /api/suggestion-complaints/:id/respond` - Respond to submission
- `PUT /api/suggestion-complaints/:id/status` - Update submission status

### 3. Parent Portal Enhancements
- **Recipient Selection**: Choose between teacher or admin
- **Student Selection**: Optional student association
- **Real-time API Integration**: Live data loading and submission
- **Enhanced UI**: Better form layout with recipient and student selection
- **History View**: Shows recipient and student information

### 4. Teacher Portal Component
- **Dedicated Tab**: New "Suggestions" tab in teacher navigation
- **Filtering**: Pending, Responded, and All submissions
- **Response System**: Teachers can respond to submissions
- **Student/Parent Info**: Full context about who submitted what
- **Real-time Updates**: Live data loading and refresh

### 5. Admin Portal Component
- **Comprehensive View**: All submissions across the school
- **Advanced Filtering**: By recipient type, status, priority, type
- **Separate Tabs**: 
  - All submissions
  - Teacher-specific submissions
  - Admin-specific submissions
  - Pending submissions
  - Responded submissions
- **Response Capability**: Admins can respond to any submission
- **Status Management**: Update submission status
- **Full Context**: Complete parent, student, and recipient information

## Key Features

### Role-Based Access
- **Parents**: Can submit to teachers or admins
- **Teachers** (SCHOOL_ADMIN role): Can view and respond to submissions directed to them
- **Admins** (TEACHER role): Can view all submissions and respond to any

### Data Security
- All sensitive data (titles, descriptions, responses) is encrypted
- Proper authentication and authorization on all endpoints
- Role-based permissions for different actions

### User Experience
- **RTL Support**: Full right-to-left support for Persian/Pashto languages
- **Responsive Design**: Works on all device sizes
- **Real-time Updates**: Live data loading and refresh
- **Intuitive UI**: Clear separation between different types of submissions

### Advanced Filtering
- **Parent Portal**: Filter by type (suggestion/complaint)
- **Teacher Portal**: Filter by status (pending/responded/all)
- **Admin Portal**: Filter by recipient type, status, priority, and type

## File Structure

### Backend
```
controllers/suggestionComplaintController.js  # Main controller
routes/suggestionComplaints.js               # API routes
migrations/add_suggestion_complaints.sql     # Database migration
```

### Frontend
```
copy/src/features/parentPortal/components/SuggestionComplaintBox.tsx     # Parent portal
copy/src/features/teacherPortal/components/TeacherSuggestionComplaintBox.tsx  # Teacher portal
copy/src/components/admin/AdminSuggestionComplaintBox.tsx                 # Admin portal
```

## Database Schema

### SuggestionComplaint Model
```sql
- id: BigInt (Primary Key)
- uuid: String (Unique)
- parentId: BigInt (Foreign Key to Parent)
- studentId: BigInt (Optional, Foreign Key to Student)
- recipientId: BigInt (Foreign Key to User)
- recipientType: ENUM('TEACHER', 'ADMIN')
- type: ENUM('SUGGESTION', 'COMPLAINT')
- title: String (Encrypted)
- description: String (Encrypted)
- category: String (Optional)
- priority: ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT')
- status: ENUM('SUBMITTED', 'UNDER_REVIEW', 'RESPONDED', 'RESOLVED', 'CLOSED')
- response: String (Optional, Encrypted)
- respondedAt: DateTime (Optional)
- responderId: BigInt (Optional, Foreign Key to User)
- schoolId: BigInt (Foreign Key to School)
- createdAt: DateTime
- updatedAt: DateTime
- deletedAt: DateTime (Soft Delete)
```

## API Usage Examples

### Create Suggestion/Complaint
```javascript
POST /api/suggestion-complaints
{
  "parentId": "1",
  "studentId": "1", // Optional
  "recipientId": "2",
  "recipientType": "TEACHER",
  "type": "SUGGESTION",
  "title": "Improve grading system",
  "description": "Please add detailed grade breakdowns",
  "category": "academic",
  "priority": "MEDIUM"
}
```

### Respond to Submission
```javascript
POST /api/suggestion-complaints/1/respond
{
  "response": "Thank you for your suggestion. We will implement this in the next update.",
  "status": "RESPONDED"
}
```

### Update Status
```javascript
PUT /api/suggestion-complaints/1/status
{
  "status": "RESOLVED"
}
```

## Translation Keys

The system uses the following translation keys:

### Parent Portal
- `parentPortal.suggestions.recipientType`
- `parentPortal.suggestions.selectRecipient`
- `parentPortal.suggestions.teacher`
- `parentPortal.suggestions.admin`
- `parentPortal.suggestions.student`
- `parentPortal.suggestions.recipient`

### Teacher Portal
- `teacherPortal.suggestions.title`
- `teacherPortal.suggestions.pending`
- `teacherPortal.suggestions.responded`
- `teacherPortal.suggestions.parent`
- `teacherPortal.suggestions.student`
- `teacherPortal.suggestions.respond`

### Admin Portal
- `admin.suggestions.title`
- `admin.suggestions.teachers`
- `admin.suggestions.admins`
- `admin.suggestions.filters`
- `admin.suggestions.allTypes`
- `admin.suggestions.allStatuses`

## Installation & Setup

1. **Database Migration**: Run the migration file to create the necessary tables
2. **Backend**: The API endpoints are automatically available
3. **Frontend**: Import and use the components in the respective portals
4. **Translations**: Add the translation keys to your language files

## Testing

The system includes comprehensive error handling and validation:
- Input validation on all endpoints
- Role-based access control
- Proper error messages and status codes
- Encryption/decryption of sensitive data

## Future Enhancements

Potential improvements for the future:
- Email notifications for new submissions and responses
- File attachments support
- Advanced analytics and reporting
- Mobile app integration
- Push notifications
- Bulk operations for admins


