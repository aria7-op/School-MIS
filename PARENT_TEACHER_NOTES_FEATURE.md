# Parent-Teacher Assignment Notes Feature

## Overview
This feature enables two-way communication between parents and teachers regarding assignments. Parents can send notes about assignments, and teachers can respond to these notes directly through their portals.

## Changes Implemented

### 1. Database Schema
**File**: `prisma/schema.prisma`
- Added new `AssignmentParentNote` model with the following fields:
  - `id`, `uuid`: Primary identifiers
  - `assignmentId`: Links to the assignment
  - `parentId`: Links to the parent who sent the note
  - `studentId`: Optional link to the specific student
  - `note`: The parent's note content
  - `teacherResponse`: The teacher's response (nullable)
  - `teacherResponseAt`: Timestamp of teacher response
  - `teacherResponderId`: User ID of the teacher who responded
  - `acknowledgedAt`: When the parent acknowledged the assignment
  - `schoolId`: School reference
  - Timestamps: `createdAt`, `updatedAt`, `deletedAt`

- Updated relations in existing models:
  - `Assignment`: Added `parentNotes` relation
  - `Parent`: Added `assignmentNotes` relation
  - `Student`: Added `assignmentNotes` relation
  - `User`: Added `assignmentParentNoteResponses` relation
  - `School`: Added `assignmentParentNotes` relation

**Migration File**: `migrations/add_assignment_parent_notes.sql`
- SQL script to create the new table with proper indexes and foreign key constraints

### 2. Backend Changes

#### Controllers (`controllers/assignmentController.js`)

**Updated Method**:
- `acknowledgeByParent()`: Modified to save parent notes in the new `AssignmentParentNote` table instead of just in notification metadata

**New Methods Added**:
1. `getParentNotes(req, res)`:
   - Endpoint: `GET /api/assignments/:id/parent-notes`
   - Access: Teachers, School Admin, Admin
   - Returns all parent notes for a specific assignment with teacher responses
   - Includes parent info, student info, and teacher responder details

2. `respondToParentNote(req, res)`:
   - Endpoint: `POST /api/assignments/parent-notes/:noteId/respond`
   - Access: Teachers, School Admin, Admin
   - Allows teachers to respond to parent notes
   - Sends notification to parent when response is sent
   - Creates audit log entry

#### Routes (`routes/assignments.js`)

Added three new routes:
1. `GET /api/assignments/:id/parent-notes` - Get parent notes for an assignment
2. `POST /api/assignments/parent-notes/:noteId/respond` - Respond to a parent note

### 3. Frontend Changes

#### Teacher Portal (`copy/src/features/teacherPortal/screens/AssignmentManagement.tsx`)

**New State Variables**:
- `parentNotes`: Array to store parent notes for selected assignment
- `loadingParentNotes`: Loading state for fetching notes
- `showResponseModal`: Controls response modal visibility
- `selectedNoteForResponse`: Currently selected note for responding
- `teacherResponse`: Teacher's response text

**New Functions**:
1. `fetchParentNotes(assignmentId)`: Fetches all parent notes for an assignment
2. `handleRespondToNote()`: Submits teacher's response to a parent note

**UI Changes**:
- Added "Parent Notes" section in assignment details modal
- Displays all parent notes with:
  - Parent name and student info
  - Note creation date/time
  - Note content
  - Teacher response (if exists) or "Respond" button
- Added response modal allowing teachers to:
  - View the parent's note
  - Write and submit a response
  - See who responded and when

#### Parent Portal (`copy/src/features/parentPortal/components/Assignments.tsx`)

**New State Variables**:
- `assignmentNotes`: Array to store assignment notes with responses

**New Interface Fields**:
- `teacherResponse`: Teacher's response text
- `teacherResponseAt`: Timestamp of response
- `teacherResponderName`: Name of teacher who responded

**New Function**:
- `fetchAssignmentNotes(assignmentId)`: Fetches notes and teacher responses for an assignment

**UI Changes**:
- Expanded notes modal to full-width (max-w-2xl)
- Added "Previous Notes & Responses" section showing:
  - All previous notes sent by the parent
  - Teacher responses (if any)
  - "Waiting for response" indicator for unanswered notes
  - Timestamps for both notes and responses
- Clearly separated "Add New Note" section for sending new notes

## API Endpoints Summary

### For Teachers
1. **Get Parent Notes**
   - `GET /api/assignments/:id/parent-notes`
   - Returns all parent notes for an assignment with teacher responses
   - Response includes parent info, student info, and responder details

2. **Respond to Parent Note**
   - `POST /api/assignments/parent-notes/:noteId/respond`
   - Body: `{ "response": "teacher's response text" }`
   - Sends notification to parent
   - Updates note with teacher response and timestamp

### For Parents
- Existing acknowledge endpoint now saves to new table
- Can fetch notes via teacher endpoint (filtered by parent)

## Features

### For Teachers
- View all parent notes on assignments
- See which parents have sent notes and which students they're about
- Respond to parent notes directly
- Track which notes have been responded to
- View response history

### For Parents
- Send notes about assignments (existing feature)
- View all their previous notes
- See teacher responses to their notes
- Know when responses were sent and by whom
- See pending notes waiting for response

## Notifications
- Teachers receive notifications when parents send notes (existing)
- Parents now receive notifications when teachers respond
- Notification type: `ASSIGNMENT_TEACHER_RESPONSE`

## Security & Permissions
- Teachers can only respond to notes on their own assignments
- Parents can only see their own notes and responses
- All endpoints require authentication
- Proper role-based authorization (TEACHER, SCHOOL_ADMIN, ADMIN)
- Audit logs created for teacher responses

## Database Indexes
The following indexes are created for optimal query performance:
- `assignmentId`
- `parentId`
- `studentId`
- `schoolId`
- `teacherResponderId`

## Migration Instructions

1. **Apply Database Migration**:
   ```bash
   mysql -u username -p database_name < migrations/add_assignment_parent_notes.sql
   ```

2. **Regenerate Prisma Client** (if using Prisma):
   ```bash
   npx prisma generate
   ```

3. **Restart Backend Server**:
   The backend needs to be restarted to load the new controller methods and routes.

4. **Clear Frontend Cache**:
   Clear browser cache or do a hard refresh to load updated frontend components.

## Testing Checklist

### Backend Testing
- [ ] Create assignment as teacher
- [ ] Send note as parent
- [ ] Verify note is saved in `assignment_parent_notes` table
- [ ] Fetch parent notes as teacher
- [ ] Respond to note as teacher
- [ ] Verify parent receives notification
- [ ] Check audit logs

### Frontend Testing
- [ ] Teacher portal: View assignment details
- [ ] Teacher portal: See parent notes section
- [ ] Teacher portal: Click "Respond" button
- [ ] Teacher portal: Submit response
- [ ] Parent portal: Send note on assignment
- [ ] Parent portal: View previous notes
- [ ] Parent portal: See teacher response
- [ ] Parent portal: Check notification for response

## Translation Keys

Add these translation keys to your translation files:

```json
{
  "teacherPortal": {
    "assignments": {
      "parentNotes": "Parent Notes",
      "noParentNotes": "No parent notes yet",
      "respond": "Respond",
      "parentNote": "Parent Note",
      "yourResponse": "Your Response",
      "respondedBy": "Responded by",
      "respondToParentNote": "Respond to Parent Note",
      "parentLabel": "Parent",
      "yourResponseLabel": "Your Response",
      "enterResponsePlaceholder": "Enter your response to the parent...",
      "sendResponse": "Send Response",
      "studentLabel": "Student"
    }
  },
  "parentPortal": {
    "assignments": {
      "previousNotes": "Previous Notes & Responses",
      "yourNote": "Your Note",
      "teacherResponse": "Teacher Response",
      "respondedBy": "Responded by",
      "waitingForResponse": "Waiting for teacher response...",
      "addNewNote": "Add New Note"
    }
  }
}
```

## Benefits

1. **Better Communication**: Direct two-way communication between teachers and parents
2. **Context Preservation**: All communication is linked to specific assignments
3. **History Tracking**: Complete history of notes and responses
4. **Accountability**: Teachers can see which notes need responses
5. **Parent Engagement**: Parents can see teachers are responsive to their concerns
6. **Audit Trail**: All interactions are logged for compliance and review

## Future Enhancements

Potential improvements for future versions:
- Email notifications for responses
- Mark notes as urgent/important
- Attach files to notes/responses
- Reply threads (multiple back-and-forth exchanges)
- Translation of notes between languages
- Analytics on response times
- Bulk response to similar notes



