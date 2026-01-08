# Manager Assignment & Login Guide

## Overview
When assigning managers in **School Structure Management**, the system automatically creates user accounts that can login to the superadmin portal.

## How It Works

### 1. Assigning a Branch Manager or Course Manager

You have **TWO options** when assigning a manager:

#### Option A: Use Existing User
- Select "Use existing user ID"
- Enter the ID of an existing user
- System will assign that user as manager (user must have appropriate role)

#### Option B: Create New Manager ✨
- Select "Create new manager"
- Fill in the form:
  - **Username** (required) - for login
  - **Password** (required) - for login
  - **First Name** (required)
  - **Last Name** (required)
  - **Email** (optional)
  - **Phone** (optional)

When you submit, the system:
1. ✅ Creates a new user record in the `users` table
2. ✅ Sets the role to `BRANCH_MANAGER` or `COURSE_MANAGER`
3. ✅ Sets user status to `ACTIVE`
4. ✅ Hashes the password securely
5. ✅ Creates the manager assignment
6. ✅ **User can now login immediately** with the username/password

### 2. Backend Implementation

**File**: `School-MIS/services/superadminService.js`

```javascript
// Line 185-229: Creates a new user account
const createManagerUser = async ({ school, payload, role, actorId }) => {
  const userCreatePayload = {
    username,
    password,
    firstName,
    lastName,
    email,
    phone,
    role,  // BRANCH_MANAGER or COURSE_MANAGER
    status: 'ACTIVE',
    schoolId: Number(school.id),
    // ... more fields
  };

  // Creates user via userService - this includes password hashing
  const result = await userService.createUser(userCreatePayload, actorId);
  return result.data;
};

// Line 402-479: Assigns branch manager
async assignManager({ branchId, schoolId, managerUserId, managerPayload, actorId }) {
  let managerUser = null;
  
  if (managerUserId) {
    // Use existing user
    managerUser = await ensureManagerCandidate({...});
  } else {
    // Create new user - THIS IS WHERE THE MAGIC HAPPENS
    managerUser = await createManagerUser({
      school,
      payload: managerPayload,
      role: 'BRANCH_MANAGER',
      actorId,
    });
  }
  
  // Create the assignment record
  const assignment = await prisma.branchManagerAssignment.create({...});
  return assignment;
}
```

### 3. What Gets Created

When you create a new manager, the system creates:

1. **User Record** in `users` table:
   ```
   id: auto-generated
   username: [your input]
   password: [hashed]
   firstName: [your input]
   lastName: [your input]
   email: [your input]
   phone: [your input]
   role: BRANCH_MANAGER or COURSE_MANAGER
   status: ACTIVE
   schoolId: [selected school]
   ```

2. **Assignment Record** in `branchManagerAssignment` or `courseManagerAssignment`:
   ```
   branchId/courseId: [assigned entity]
   userId: [newly created user id]
   schoolId: [selected school]
   assignedBy: [your user id]
   assignedAt: [current timestamp]
   revokedAt: null
   ```

### 4. Login Process

The newly created manager can login via:
- **Superadmin Portal**: Using their username and password
- **Role**: Will have `BRANCH_MANAGER` or `COURSE_MANAGER` role
- **Permissions**: Will have access to manage their assigned branches/courses

### 5. Frontend UI

**File**: `School-MIS/copy/src/features/superadmin/components/SchoolStructureManager.tsx`

The UI provides:
- Radio buttons to choose between existing user or new manager
- Form fields for creating new manager (username, password, firstName, lastName, email, phone)
- Validation to ensure required fields are filled
- Success/error messages after assignment

### 6. Example Workflow

1. **Super Admin** opens School Structure Management
2. Selects a school
3. Clicks "Assign Manager" for a branch or course
4. Chooses "Create new manager"
5. Fills in:
   - Username: `branch_manager_north`
   - Password: `SecurePass123!`
   - First Name: `Ahmad`
   - Last Name: `Karimi`
   - Email: `ahmad.karimi@school.edu.af`
   - Phone: `+93701234567`
6. Clicks "Save assignment"
7. ✅ System creates user account
8. ✅ System creates manager assignment
9. ✅ Manager can now login with `branch_manager_north` / `SecurePass123!`

### 7. Verification

To verify the user was created, check:

```sql
-- Check user was created
SELECT id, username, firstName, lastName, role, status, schoolId
FROM users
WHERE username = 'branch_manager_north';

-- Check assignment was created
SELECT id, branchId, userId, assignedAt, revokedAt
FROM branchManagerAssignment
WHERE userId = [user_id_from_above];
```

### 8. Multiple Assignments

You can assign the same manager to multiple branches/courses:
- First assignment: Creates the user
- Subsequent assignments: Uses the same user ID
- System automatically reuses the created user for additional assignments in the same operation

## Summary

✅ **The feature is already fully implemented and working!**

When you assign a manager through School Structure Management:
- If you choose "Create new manager", a complete user account is created
- The user can login immediately with the provided username/password
- The user has the appropriate role (BRANCH_MANAGER or COURSE_MANAGER)
- The user is assigned to the selected school
- The user can access the superadmin portal based on their permissions

No additional implementation is needed - the feature is production-ready!
