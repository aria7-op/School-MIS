# Teacher-Class-Subject Relationship Management

## Problem Statement
In a school management system, you need to handle complex relationships where:
- **One teacher** can teach **multiple classes** and **multiple subjects**
- **One class** can have **multiple teachers** teaching **different subjects**
- **One subject** can be taught by **multiple teachers** in **different classes**

## Current Database Structure Analysis

Looking at your current schema, I can see you have:

```prisma
model Teacher {
  id             BigInt    @id @default(autoincrement())
  // ... other fields
  subjects              Subject[]  // Many-to-many with subjects
  classesAsClassTeacher Class[]    // One-to-many as class teacher
}

model Class {
  id             BigInt    @id @default(autoincrement())
  // ... other fields
  classTeacherId BigInt?
  classTeacher   Teacher?  @relation("Class_classTeacher", fields: [classTeacherId], references: [id])
  subjects       Subject[] // Many-to-many with subjects
}

model Subject {
  id           BigInt    @id @default(autoincrement())
  // ... other fields
  classes      Class[]   // Many-to-many with classes
  teachers     Teacher[] // Many-to-many with teachers
}

model Timetable {
  id         BigInt    @id @default(autoincrement())
  day        Int
  period     Int
  classId    BigInt
  subjectId  BigInt
  teacherId  BigInt
  // ... other fields
}
```

## Issues with Current Structure

1. **Missing Teacher-Class-Subject Junction Table**: You can't track which teacher teaches which subject in which class
2. **Limited Flexibility**: Can't easily query "What subjects does Teacher X teach in Class Y?"
3. **No Teaching Assignment Tracking**: Can't track when assignments were made or their status

## Recommended Solution: Add Junction Tables

### 1. Create TeacherClassSubject Junction Table

```prisma
model TeacherClassSubject {
  id         BigInt    @id @default(autoincrement())
  uuid       String    @unique @default(uuid()) @db.Uuid
  teacherId  BigInt
  classId    BigInt
  subjectId  BigInt
  schoolId   BigInt
  isActive   Boolean   @default(true)
  assignedAt DateTime  @default(now())
  assignedBy BigInt
  updatedBy  BigInt?
  updatedAt  DateTime  @updatedAt
  deletedAt  DateTime?

  // Relations
  teacher Teacher @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  class   Class   @relation(fields: [classId], references: [id], onDelete: Cascade)
  subject Subject @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  school  School  @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  // Unique constraint to prevent duplicate assignments
  @@unique([teacherId, classId, subjectId, schoolId])
  @@index([teacherId])
  @@index([classId])
  @@index([subjectId])
  @@index([schoolId])
  @@map("teacher_class_subjects")
}
```

### 2. Update Existing Models

```prisma
model Teacher {
  // ... existing fields
  
  // Add the junction table relation
  teacherClassSubjects TeacherClassSubject[]
  
  // Keep existing relations
  subjects              Subject[]
  classesAsClassTeacher Class[]
}

model Class {
  // ... existing fields
  
  // Add the junction table relation
  teacherClassSubjects TeacherClassSubject[]
  
  // Keep existing relations
  subjects      Subject[]
  classTeacher  Teacher?  @relation("Class_classTeacher", fields: [classTeacherId], references: [id])
}

model Subject {
  // ... existing fields
  
  // Add the junction table relation
  teacherClassSubjects TeacherClassSubject[]
  
  // Keep existing relations
  classes  Class[]
  teachers Teacher[]
}
```

## Implementation Guide

### 1. Database Migration

Create a migration to add the new table:

```sql
-- Create the junction table
CREATE TABLE teacher_class_subjects (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID UNIQUE DEFAULT gen_random_uuid(),
  teacher_id BIGINT NOT NULL,
  class_id BIGINT NOT NULL,
  subject_id BIGINT NOT NULL,
  school_id BIGINT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by BIGINT NOT NULL,
  updated_by BIGINT,
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  
  UNIQUE(teacher_id, class_id, subject_id, school_id)
);

-- Add indexes
CREATE INDEX idx_teacher_class_subjects_teacher_id ON teacher_class_subjects(teacher_id);
CREATE INDEX idx_teacher_class_subjects_class_id ON teacher_class_subjects(class_id);
CREATE INDEX idx_teacher_class_subjects_subject_id ON teacher_class_subjects(subject_id);
CREATE INDEX idx_teacher_class_subjects_school_id ON teacher_class_subjects(school_id);
```

### 2. Service Layer Implementation

```javascript
// services/teacherClassSubjectService.js
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

class TeacherClassSubjectService {
  /**
   * Assign a teacher to teach a subject in a class
   */
  async assignTeacherToClassSubject(data) {
    const { teacherId, classId, subjectId, schoolId, assignedBy } = data;
    
    // Validate that all entities exist and belong to the same school
    const [teacher, class_, subject] = await Promise.all([
      prisma.teacher.findFirst({
        where: { id: BigInt(teacherId), schoolId: BigInt(schoolId) }
      }),
      prisma.class.findFirst({
        where: { id: BigInt(classId), schoolId: BigInt(schoolId) }
      }),
      prisma.subject.findFirst({
        where: { id: BigInt(subjectId), schoolId: BigInt(schoolId) }
      })
    ]);
    
    if (!teacher || !class_ || !subject) {
      throw new Error('Teacher, class, or subject not found or does not belong to the school');
    }
    
    // Check if assignment already exists
    const existingAssignment = await prisma.teacherClassSubject.findFirst({
      where: {
        teacherId: BigInt(teacherId),
        classId: BigInt(classId),
        subjectId: BigInt(subjectId),
        schoolId: BigInt(schoolId),
        deletedAt: null
      }
    });
    
    if (existingAssignment) {
      throw new Error('Teacher is already assigned to this subject in this class');
    }
    
    // Create the assignment
    const assignment = await prisma.teacherClassSubject.create({
      data: {
        teacherId: BigInt(teacherId),
        classId: BigInt(classId),
        subjectId: BigInt(subjectId),
        schoolId: BigInt(schoolId),
        assignedBy: BigInt(assignedBy)
      },
      include: {
        teacher: {
          select: { id: true, employeeId: true, user: { select: { firstName: true, lastName: true } } }
        },
        class: { select: { id: true, name: true, code: true } },
        subject: { select: { id: true, name: true, code: true } }
      }
    });
    
    return assignment;
  }
  
  /**
   * Get all assignments for a teacher
   */
  async getTeacherAssignments(teacherId, schoolId) {
    return await prisma.teacherClassSubject.findMany({
      where: {
        teacherId: BigInt(teacherId),
        schoolId: BigInt(schoolId),
        deletedAt: null,
        isActive: true
      },
      include: {
        class: { select: { id: true, name: true, code: true, level: true } },
        subject: { select: { id: true, name: true, code: true } }
      }
    });
  }
  
  /**
   * Get all teachers for a class
   */
  async getClassTeachers(classId, schoolId) {
    return await prisma.teacherClassSubject.findMany({
      where: {
        classId: BigInt(classId),
        schoolId: BigInt(schoolId),
        deletedAt: null,
        isActive: true
      },
      include: {
        teacher: {
          select: { 
            id: true, 
            employeeId: true, 
            user: { select: { firstName: true, lastName: true } }
          }
        },
        subject: { select: { id: true, name: true, code: true } }
      }
    });
  }
  
  /**
   * Get all classes for a subject
   */
  async getSubjectClasses(subjectId, schoolId) {
    return await prisma.teacherClassSubject.findMany({
      where: {
        subjectId: BigInt(subjectId),
        schoolId: BigInt(schoolId),
        deletedAt: null,
        isActive: true
      },
      include: {
        class: { select: { id: true, name: true, code: true, level: true } },
        teacher: {
          select: { 
            id: true, 
            employeeId: true, 
            user: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });
  }
  
  /**
   * Remove a teacher assignment
   */
  async removeTeacherAssignment(assignmentId, schoolId, updatedBy) {
    const assignment = await prisma.teacherClassSubject.findFirst({
      where: {
        id: BigInt(assignmentId),
        schoolId: BigInt(schoolId),
        deletedAt: null
      }
    });
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }
    
    return await prisma.teacherClassSubject.update({
      where: { id: BigInt(assignmentId) },
      data: {
        isActive: false,
        updatedBy: BigInt(updatedBy),
        deletedAt: new Date()
      }
    });
  }
  
  /**
   * Get teacher workload summary
   */
  async getTeacherWorkload(teacherId, schoolId) {
    const assignments = await this.getTeacherAssignments(teacherId, schoolId);
    
    const workload = {
      totalClasses: new Set(assignments.map(a => a.classId)).size,
      totalSubjects: new Set(assignments.map(a => a.subjectId)).size,
      assignments: assignments.length,
      details: assignments
    };
    
    return workload;
  }
}

export default new TeacherClassSubjectService();
```

### 3. Controller Implementation

```javascript
// controllers/teacherClassSubjectController.js
import teacherClassSubjectService from '../services/teacherClassSubjectService.js';
import { formatResponse } from '../utils/responseFormatter.js';

class TeacherClassSubjectController {
  /**
   * Assign teacher to class and subject
   */
  assignTeacher = async (req, res) => {
    try {
      const { teacherId, classId, subjectId } = req.body;
      const schoolId = req.user.schoolId;
      const assignedBy = req.user.id;
      
      const assignment = await teacherClassSubjectService.assignTeacherToClassSubject({
        teacherId,
        classId,
        subjectId,
        schoolId,
        assignedBy
      });
      
      res.status(201).json(formatResponse(true, assignment, 'Teacher assigned successfully'));
    } catch (error) {
      res.status(400).json(formatResponse(false, null, error.message));
    }
  };
  
  /**
   * Get teacher assignments
   */
  getTeacherAssignments = async (req, res) => {
    try {
      const { teacherId } = req.params;
      const schoolId = req.user.schoolId;
      
      const assignments = await teacherClassSubjectService.getTeacherAssignments(teacherId, schoolId);
      
      res.json(formatResponse(true, assignments, 'Teacher assignments retrieved successfully'));
    } catch (error) {
      res.status(400).json(formatResponse(false, null, error.message));
    }
  };
  
  /**
   * Get class teachers
   */
  getClassTeachers = async (req, res) => {
    try {
      const { classId } = req.params;
      const schoolId = req.user.schoolId;
      
      const teachers = await teacherClassSubjectService.getClassTeachers(classId, schoolId);
      
      res.json(formatResponse(true, teachers, 'Class teachers retrieved successfully'));
    } catch (error) {
      res.status(400).json(formatResponse(false, null, error.message));
    }
  };
  
  /**
   * Remove teacher assignment
   */
  removeAssignment = async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const schoolId = req.user.schoolId;
      const updatedBy = req.user.id;
      
      await teacherClassSubjectService.removeTeacherAssignment(assignmentId, schoolId, updatedBy);
      
      res.json(formatResponse(true, null, 'Teacher assignment removed successfully'));
    } catch (error) {
      res.status(400).json(formatResponse(false, null, error.message));
    }
  };
  
  /**
   * Get teacher workload
   */
  getTeacherWorkload = async (req, res) => {
    try {
      const { teacherId } = req.params;
      const schoolId = req.user.schoolId;
      
      const workload = await teacherClassSubjectService.getTeacherWorkload(teacherId, schoolId);
      
      res.json(formatResponse(true, workload, 'Teacher workload retrieved successfully'));
    } catch (error) {
      res.status(400).json(formatResponse(false, null, error.message));
    }
  };
}

export default new TeacherClassSubjectController();
```

### 4. Routes

```javascript
// routes/teacherClassSubject.js
import express from 'express';
import teacherClassSubjectController from '../controllers/teacherClassSubjectController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Assign teacher to class and subject
router.post('/assign',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  teacherClassSubjectController.assignTeacher
);

// Get teacher assignments
router.get('/teacher/:teacherId',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  teacherClassSubjectController.getTeacherAssignments
);

// Get class teachers
router.get('/class/:classId',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  teacherClassSubjectController.getClassTeachers
);

// Remove teacher assignment
router.delete('/:assignmentId',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  teacherClassSubjectController.removeAssignment
);

// Get teacher workload
router.get('/workload/:teacherId',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  teacherClassSubjectController.getTeacherWorkload
);

export default router;
```

## Frontend Implementation Examples

### 1. Teacher Assignment Form

```jsx
const TeacherAssignmentForm = () => {
  const [formData, setFormData] = useState({
    teacherId: '',
    classId: '',
    subjectId: ''
  });
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/teacher-class-subject/assign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Teacher assigned successfully!');
        // Refresh assignments list
      }
    } catch (error) {
      alert('Failed to assign teacher: ' + error.message);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <select 
        value={formData.teacherId} 
        onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
        required
      >
        <option value="">Select Teacher</option>
        {teachers.map(teacher => (
          <option key={teacher.id} value={teacher.id}>
            {teacher.user.firstName} {teacher.user.lastName}
          </option>
        ))}
      </select>
      
      <select 
        value={formData.classId} 
        onChange={(e) => setFormData({...formData, classId: e.target.value})}
        required
      >
        <option value="">Select Class</option>
        {classes.map(cls => (
          <option key={cls.id} value={cls.id}>
            {cls.name} ({cls.code})
          </option>
        ))}
      </select>
      
      <select 
        value={formData.subjectId} 
        onChange={(e) => setFormData({...formData, subjectId: e.target.value})}
        required
      >
        <option value="">Select Subject</option>
        {subjects.map(subject => (
          <option key={subject.id} value={subject.id}>
            {subject.name} ({subject.code})
          </option>
        ))}
      </select>
      
      <button type="submit">Assign Teacher</button>
    </form>
  );
};
```

### 2. Teacher Workload Dashboard

```jsx
const TeacherWorkloadDashboard = () => {
  const [workloads, setWorkloads] = useState([]);
  
  useEffect(() => {
    loadTeacherWorkloads();
  }, []);
  
  const loadTeacherWorkloads = async () => {
    try {
      const response = await fetch('/api/teachers', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const teachers = await response.json();
      
      const workloadPromises = teachers.data.map(teacher => 
        fetch(`/api/teacher-class-subject/workload/${teacher.id}`, {
          headers: { 'Authorization': `Bearer ${userToken}` }
        }).then(res => res.json())
      );
      
      const workloads = await Promise.all(workloadPromises);
      setWorkloads(workloads.map(w => w.data));
    } catch (error) {
      console.error('Failed to load workloads:', error);
    }
  };
  
  return (
    <div className="workload-dashboard">
      <h2>Teacher Workload Overview</h2>
      <div className="workload-grid">
        {workloads.map(workload => (
          <div key={workload.teacherId} className="workload-card">
            <h3>{workload.teacherName}</h3>
            <div className="workload-stats">
              <div>Classes: {workload.totalClasses}</div>
              <div>Subjects: {workload.totalSubjects}</div>
              <div>Total Assignments: {workload.assignments}</div>
            </div>
            <div className="workload-details">
              {workload.details.map(assignment => (
                <div key={assignment.id} className="assignment-item">
                  {assignment.class.name} - {assignment.subject.name}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Benefits of This Approach

1. **Flexibility**: Teachers can be assigned to multiple classes and subjects
2. **Data Integrity**: Prevents duplicate assignments
3. **Audit Trail**: Tracks who made assignments and when
4. **Easy Queries**: Can easily find what a teacher teaches or who teaches a class
5. **Scalability**: Can handle complex scenarios like substitute teachers
6. **Workload Management**: Easy to calculate and monitor teacher workloads

## Migration Strategy

1. **Phase 1**: Add the new junction table without removing existing relationships
2. **Phase 2**: Migrate existing data from the current structure
3. **Phase 3**: Update frontend to use new endpoints
4. **Phase 4**: Remove old relationships if no longer needed

This solution provides a robust foundation for managing complex teacher-class-subject relationships in your school management system! 