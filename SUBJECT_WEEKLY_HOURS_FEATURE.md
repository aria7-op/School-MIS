# Subject Weekly Hours Per Class Feature

## Overview
This feature allows administrators to specify how many hours per week each subject should be taught in each class. This metadata is stored in the database and can be used for scheduling, timetable generation, and reporting purposes.

## Implementation Details

### Database Schema
- **Table**: `subjects`
- **New Column**: `weeklyHoursPerClass` (JSON, nullable)
- **Format**: JSON object with class IDs as keys and weekly hours as values
- **Example**: `{"1": 5, "2": 3, "5": 4}`
  - Class 1: 5 hours per week
  - Class 2: 3 hours per week
  - Class 5: 4 hours per week

### Backend Changes

#### 1. Schema Update (`prisma/schema.prisma`)
```prisma
model Subject {
  // ... existing fields ...
  weeklyHoursPerClass Json?           @db.Json
  // ... rest of the model ...
}
```

#### 2. Validation Schemas (`utils/subjectUtils.js`)
- **SubjectCreateSchema**: Added `weeklyHoursPerClass` field
  - Type: `z.record(z.string(), z.number().int().min(0).max(40))`
  - Validates: Keys are strings (class IDs), values are integers (0-40 hours)
  - Optional field

- **SubjectUpdateSchema**: Added `weeklyHoursPerClass` field with same validation

#### 3. Controller Updates (`controllers/subjectController.js`)
- **createSubject**: Automatically includes `weeklyHoursPerClass` when spreading validated data
- **updateSubject**: Explicitly handles `weeklyHoursPerClass` in update operations
  ```javascript
  if (validatedData.weeklyHoursPerClass !== undefined) {
    updateData.weeklyHoursPerClass = validatedData.weeklyHoursPerClass;
  }
  ```

### Frontend Changes

#### 1. TypeScript Types (`copy/src/features/subjects/types/subjects.ts`)
```typescript
export interface Subject {
  // ... existing fields ...
  weeklyHoursPerClass?: Record<string, number>;
}

export interface SubjectFormData {
  // ... existing fields ...
  weeklyHoursPerClass?: Record<string, number>;
}
```

#### 2. Subject Form Modal (`copy/src/features/subjects/components/SubjectFormModal.tsx`)
Added new UI section that:
- Fetches all available classes using React Query
- Displays each class with an input field for weekly hours
- Allows setting 0-40 hours per week for each class
- Updates the form data in real-time
- Shows helpful tooltip about the feature

**Key Features**:
- Scrollable list for many classes (max-height: 240px)
- Input validation (0-40 hours)
- Visual feedback with hover effects
- Integrated with translation system
- Responsive design

#### 3. Translation Keys (`copy/public/locales/en/translation.json`)
Added new translation keys:
- `admin.subjects.modal.weeklyHoursPerClass`
- `admin.subjects.modal.hoursPerWeek`
- `admin.subjects.modal.noClassesAvailable`
- `admin.subjects.modal.weeklyHoursHelp`

### Service Layer
The existing subject service (`copy/src/features/subjects/services/subjectService.ts`) automatically handles the new field by spreading the form data, requiring no changes.

## How to Use

### 1. Run the Migration
Execute the SQL migration file:
```bash
mysql -u your_user -p your_database < migrations/add_weekly_hours_per_class_to_subject.sql
```

Or manually run:
```sql
ALTER TABLE subjects ADD COLUMN weeklyHoursPerClass JSON NULL;
```

### 2. Creating a Subject with Weekly Hours
1. Navigate to Subjects Management
2. Click "Add Subject"
3. Fill in subject details (name, code, description, etc.)
4. Scroll to "Weekly Hours Per Class" section
5. For each class, set the number of hours per week (0-40)
6. Click "Create Subject"

### 3. Editing Subject Weekly Hours
1. Navigate to Subjects Management
2. Click "Edit" on a subject
3. Modify the weekly hours for any class
4. Click "Update Subject"

### 4. API Usage

**Create Subject**:
```json
POST /api/subjects
{
  "name": "Mathematics",
  "code": "MATH10",
  "creditHours": 5,
  "isElective": false,
  "departmentId": 1,
  "schoolId": 1,
  "weeklyHoursPerClass": {
    "1": 5,
    "2": 4,
    "3": 6
  }
}
```

**Update Subject**:
```json
PUT /api/subjects/123
{
  "weeklyHoursPerClass": {
    "1": 6,
    "2": 5,
    "3": 4
  }
}
```

**Response Format**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Mathematics",
    "code": "MATH10",
    "weeklyHoursPerClass": {
      "1": 6,
      "2": 5,
      "3": 4
    },
    // ... other fields ...
  }
}
```

## Use Cases

### 1. Timetable Generation
Use the weekly hours metadata to automatically generate timetables:
```javascript
// Example: Get weekly hours for a subject in a specific class
const subject = await getSubject(subjectId);
const classId = "1";
const weeklyHours = subject.weeklyHoursPerClass?.[classId] || 0;
// Use weeklyHours to allocate time slots in the timetable
```

### 2. Schedule Validation
Ensure teachers aren't overloaded:
```javascript
// Calculate total teaching hours for a teacher
const totalHours = teacher.subjects.reduce((sum, subject) => {
  const hours = subject.weeklyHoursPerClass?.[classId] || 0;
  return sum + hours;
}, 0);
```

### 3. Curriculum Planning
Generate reports on subject distribution:
```javascript
// Calculate total weekly hours for a class
const totalClassHours = subjects.reduce((sum, subject) => {
  const hours = subject.weeklyHoursPerClass?.[classId] || 0;
  return sum + hours;
}, 0);
```

## Data Structure Examples

### Example 1: Mathematics Subject
```json
{
  "id": 1,
  "name": "Mathematics",
  "code": "MATH10",
  "weeklyHoursPerClass": {
    "1": 5,   // Grade 1: 5 hours/week
    "2": 5,   // Grade 2: 5 hours/week
    "3": 6,   // Grade 3: 6 hours/week
    "4": 6,   // Grade 4: 6 hours/week
    "5": 6,   // Grade 5: 6 hours/week
    "6": 6    // Grade 6: 6 hours/week
  }
}
```

### Example 2: Physical Education (PE)
```json
{
  "id": 2,
  "name": "Physical Education",
  "code": "PE10",
  "weeklyHoursPerClass": {
    "1": 2,   // Grade 1: 2 hours/week
    "2": 2,   // Grade 2: 2 hours/week
    "3": 2,   // Grade 3: 2 hours/week
    "4": 3,   // Grade 4: 3 hours/week
    "5": 3,   // Grade 5: 3 hours/week
    "6": 3    // Grade 6: 3 hours/week
  }
}
```

### Example 3: Elective Subject (not taught in all classes)
```json
{
  "id": 3,
  "name": "Advanced Programming",
  "code": "CS201",
  "isElective": true,
  "weeklyHoursPerClass": {
    "10": 4,  // Only taught in class 10
    "11": 4,  // and class 11
    "12": 6   // with more hours in class 12
  }
}
```

## Validation Rules

1. **Class ID Format**: String representation of class ID
2. **Hours Range**: 0-40 hours per week
3. **Optional Field**: Can be null or empty object
4. **Type**: Must be a valid JSON object

## Future Enhancements

1. **Bulk Update**: Allow updating hours for multiple classes at once
2. **Templates**: Create templates for common subject configurations
3. **Import/Export**: Support CSV/Excel import for bulk setup
4. **Analytics**: Generate reports on subject distribution across classes
5. **Conflict Detection**: Warn if total hours exceed class capacity
6. **History Tracking**: Track changes to weekly hours over time

## Notes

- Existing subjects will have `weeklyHoursPerClass` as `null` initially
- Setting hours to `0` means the subject is not taught in that class
- The feature is fully backward compatible
- Empty JSON object `{}` is valid and means no hours assigned to any class

## Testing

### Manual Testing
1. Create a new subject with weekly hours
2. Edit an existing subject to add weekly hours
3. Verify the data persists correctly
4. Test with 0 hours (subject not taught in class)
5. Test with maximum hours (40)
6. Test with invalid values (should be rejected)

### API Testing
```bash
# Create subject with weekly hours
curl -X POST https://your-domain/api/subjects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Subject",
    "code": "TEST01",
    "creditHours": 3,
    "isElective": false,
    "departmentId": 1,
    "schoolId": 1,
    "weeklyHoursPerClass": {
      "1": 5,
      "2": 4
    }
  }'
```

## Support

For issues or questions about this feature, please refer to:
- Backend code: `controllers/subjectController.js`, `utils/subjectUtils.js`
- Frontend code: `copy/src/features/subjects/`
- Database schema: `prisma/schema.prisma`
- Migration: `migrations/add_weekly_hours_per_class_to_subject.sql`


