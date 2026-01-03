# Scope Insertion Fix - Branch and Course Context

## Problem
The system was not properly setting `branchId` and `courseId` when creating or updating entities. Students created in a "Course" context were only visible when switching back to "School" context, mixing with other students.

## Root Cause
All INSERT and UPDATE operations were only using `schoolId` from the user context, ignoring the selected `branchId` and `courseId` from the managed scope in the header dropdown.

## Solution Applied

### Backend Changes

#### 1. **Student Creation** (`controllers/studentController.js`)
- **Line ~248**: Added scope resolution to get `branchId` and `courseId` from `resolveManagedScope(req)`
- **Line ~622**: Added `branchId` and `courseId` to student creation data
```javascript
// SCOPE FIX: Get branchId and courseId from managed scope
const scope = await resolveManagedScope(req);
let branchId = scope.branchId ? Number(scope.branchId) : null;
let courseId = scope.courseId ? Number(scope.courseId) : null;

// In prisma.student.create:
...(branchId && { branchId: BigInt(branchId) }),
...(courseId && { courseId: BigInt(courseId) }),
```

#### 2. **Student Update** (`controllers/studentController.js`)
- **Line ~1238**: Added scope resolution for updates
- Automatically adds `branchId` and `courseId` if not already in update data
```javascript
// SCOPE FIX: Get branchId and courseId from managed scope for updates
const scope = await resolveManagedScope(req);
if (scope.branchId && !updateData.branchId) {
  updateData.branchId = Number(scope.branchId);
}
if (scope.courseId && !updateData.courseId) {
  updateData.courseId = Number(scope.courseId);
}
```

#### 3. **Attendance Creation** (`controllers/attendanceController.js`)
- **Line ~742**: Fixed to use actual scope values instead of hardcoded null
- **Line ~918**: Fixed mark-in time attendance
```javascript
// SCOPE FIX: Use actual branchId and courseId from scope
const branchId = scope?.branchId ? Number(scope.branchId) : null;
const courseId = scope?.courseId ? Number(scope.courseId) : null;
```

#### 4. **Teacher Creation** (`services/teacherService.js`)
- **Line ~173**: Added `courseId` from scope
- **Line ~228**: Added `courseId` to teacher payload
```javascript
// SCOPE FIX: Add courseId from scope
const courseId = scope?.courseId ? toBigIntOrNull(scope.courseId) : null;

// In teacherPayload:
courseId: courseId ?? undefined
```

#### 5. **Grade Creation** (`services/gradeService.js`)
- **Line ~159**: Added branchId and courseId retrieval from student if not provided
- Falls back to student's branchId/courseId for grade records
```javascript
// SCOPE FIX: Get branchId and courseId from student or data
let branchId = data.branchId || null;
let courseId = data.courseId || null;

// If not provided, get from student record
if (!branchId || !courseId) {
  const student = await this.prisma.student.findUnique({
    where: { id: data.studentId },
    select: { branchId: true, courseId: true }
  });
  if (student) {
    branchId = branchId || student.branchId;
    courseId = courseId || student.courseId;
  }
}
```

#### 6. **Excel Grade Bulk Entry** (`controllers/excelGradeController.js`)
- **Line ~565**: Added branchId and courseId to grade creation
```javascript
branchId: entry.branchId ? BigInt(entry.branchId) : null,
courseId: entry.courseId ? BigInt(entry.courseId) : null,
```

### Frontend Context (No Changes Needed)
The frontend already properly:
1. Stores the selected context in `AuthContext` (`copy/src/contexts/AuthContext.tsx`)
2. Sends the context via `secureApiService` which adds headers to all requests
3. The `resolveManagedScope` utility on backend reads these headers

## How It Works Now

1. User selects **School** → `schoolId` set, `branchId=null`, `courseId=null`
   - All entities created belong to entire school
   
2. User selects **Branch** → `schoolId` + `branchId` set, `courseId=null`
   - All entities created belong to that specific branch
   
3. User selects **Course** → `schoolId` + `courseId` set, `branchId=null`
   - All entities created belong to that specific course
   - Student will only appear when that course is selected

## Testing

To test:
1. Select a Course from the header dropdown
2. Create a new student
3. Verify the student has `courseId` set in database
4. Switch to School context - student should NOT appear in regular list
5. Switch back to Course context - student should appear

## Database Schema
All major entities support scope fields:
- `students` table: `schoolId`, `branchId`, `courseId` (lines 928-930 in schema.prisma)
- `teachers` table: `schoolId`, `branchId`, `courseId`
- `attendance` table: `schoolId`, `branchId`, `courseId`  
- `grades` table: `schoolId`, `branchId`, `courseId` (lines 1187-1189)
- `classes` table: `schoolId`, `branchId`, `courseId` (already had scope)

## Files Modified
1. `/controllers/studentController.js` - Student creation & update
2. `/controllers/attendanceController.js` - Attendance creation & mark-in
3. `/services/teacherService.js` - Teacher creation
4. `/services/gradeService.js` - Grade creation
5. `/controllers/excelGradeController.js` - Bulk grade entry
6. `/controllers/classController.js` - Already fixed (duplicate class code comments)

## Notes
- All logging added with `🔍` emoji for easy debugging
- Scope resolution uses `resolveManagedScope(req)` utility
- GET operations already filter by scope correctly
- This fix ensures INSERT/UPDATE operations match GET filtering behavior

