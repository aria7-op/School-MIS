import express from 'express';
import { authenticateToken, authorizePermissions, authorizeStudentAccess } from '../middleware/auth.js';
import { PrismaClient } from '../generated/prisma/index.js';

const router = express.Router();
const prisma = new PrismaClient();

// BigInt conversion utility
function convertBigInts(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(convertBigInts);
  }
  if (typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        newObj[key] = convertBigInts(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

// ============================================================================
// Essential CRUD Operations
// ============================================================================

/**
 * @route   GET /api/parents
 * @desc    Get all parents with filtering and pagination
 * @access  Private (Admin, Staff, Teacher)
 * @permissions parent:read
 */
router.get('/', /*authenticateToken, authorizePermissions(['parent:read']),*/ async (req, res) => {
  try {
    const schoolId = (req.user && req.user.schoolId) ? req.user.schoolId : 1;
    const { page = 1, limit = 20, search = '', status = '' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = Math.min(parseInt(limit), 100); // Max 100 per page

    const where = {
      schoolId: BigInt(schoolId),
      deletedAt: null
    };

    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (status) {
      where.user = { ...where.user, status: status };
    }

    const parents = await prisma.parent.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
            avatar: true
          }
        },
        _count: {
          select: {
            students: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.parent.count({ where });

    res.json({
      success: true,
      data: convertBigInts(parents),
      pagination: { 
        page: parseInt(page), 
        limit: take, 
        total,
        pages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Get parents error:', error);
    res.status(500).json({ success: false, message: 'Failed to get parents' });
  }
});

/**
 * @route   GET /api/parents/children
 * @desc    Get children for the authenticated parent
 * @access  Private (Parent)
 * @permissions parent:read
 */
router.get('/children', authenticateToken, authorizePermissions(['parent:read']), async (req, res) => {
  try {
    const schoolId = (req.user && req.user.schoolId) ? req.user.schoolId : 1;
    const userId = (req.user && req.user.id) ? req.user.id : null;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Find parent by userId
    const parent = await prisma.parent.findFirst({
      where: {
        userId: BigInt(userId),
        schoolId: BigInt(schoolId),
        deletedAt: null
      },
      select: { id: true }
    });

    if (!parent) {
      return res.json({ success: true, data: [] });
    }

    const students = await prisma.student.findMany({
      where: {
        parentId: parent.id,
        schoolId: BigInt(schoolId),
        deletedAt: null
      },
      take: 200,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        class: { select: { id: true, name: true, code: true } }
      },
      orderBy: { id: 'desc' }
    });

    // Map to a compact shape similar to frontend expectations
    const data = students.map((s) => ({
      id: s.id.toString(),
      firstName: s.user?.firstName || '',
      lastName: s.user?.lastName || '',
      grade: s.class?.name || '',
      section: '',
      attendance: 0,
      averageGrade: 0,
      recentActivity: '',
      email: '',
      phoneNumber: s.user?.phone || '',
      rollNumber: s.rollNo ? String(s.rollNo) : '',
      subjects: [],
      status: 'ACTIVE'
    }));

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Get parent children error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get parent children' });
  }
});

/**
 * @route   GET /api/parents/notifications
 * @desc    Get notifications for the authenticated parent
 * @access  Private (Parent)
 */
router.get('/notifications', authenticateToken, authorizePermissions(['parent:read']), async (req, res) => {
  try {
    // Placeholder implementation
    return res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Get parent notifications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get notifications' });
  }
});

/**
 * @route   GET /api/parents/dashboard
 * @desc    Get dashboard summary for the authenticated parent
 * @access  Private (Parent)
 */
router.get('/dashboard', authenticateToken, authorizePermissions(['parent:read']), async (req, res) => {
  try {
    const schoolId = (req.user && req.user.schoolId) ? req.user.schoolId : 1;
    const userId = (req.user && req.user.id) ? req.user.id : null;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found' });
    }

    // Get parent and their children
    const parent = await prisma.parent.findFirst({
      where: { userId: BigInt(userId), schoolId: BigInt(schoolId), deletedAt: null },
      include: { 
        students: {
          where: { deletedAt: null },
          include: {
            user: { select: { firstName: true, lastName: true } },
            class: { select: { name: true } }
          }
        }
      }
    });

    if (!parent) {
      return res.status(404).json({ success: false, message: 'Parent not found' });
    }

    const children = parent.students;
    const totalChildren = children.length;

    // Get assignments data
    const studentIds = children.map(child => child.id);
    const assignments = await prisma.assignment.findMany({
      where: {
        classId: { in: children.map(c => c.classId) },
        schoolId: BigInt(schoolId),
        deletedAt: null
      },
      include: {
        submissions: {
          where: { studentId: { in: studentIds } },
          select: { studentId: true, submittedAt: true }
        }
      }
    });

    // Calculate assignment stats
    const totalAssignments = assignments.length;
    const pendingAssignments = assignments.filter(a => 
      !a.submissions.some(s => studentIds.includes(s.studentId))
    ).length;
    const submittedAssignments = assignments.filter(a => 
      a.submissions.some(s => studentIds.includes(s.studentId))
    ).length;
    const overdueAssignments = assignments.filter(a => {
      const dueDate = new Date(a.dueDate);
      const now = new Date();
      return dueDate < now && !a.submissions.some(s => studentIds.includes(s.studentId));
    }).length;

    // Calculate real attendance data
    let recentAttendance = 0;
    
    if (children.length > 0) {
      try {
        // Get attendance for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const attendanceRecords = await prisma.attendance.findMany({
          where: {
            studentId: { in: studentIds },
            schoolId: BigInt(schoolId),
            date: { gte: thirtyDaysAgo },
            deletedAt: null
          },
          select: {
            studentId: true,
            status: true,
            date: true
          }
        });

        // Calculate attendance percentage
        const attendanceByStudent = {};
        attendanceRecords.forEach(record => {
          const studentId = record.studentId.toString();
          if (!attendanceByStudent[studentId]) {
            attendanceByStudent[studentId] = { total: 0, present: 0 };
          }
          attendanceByStudent[studentId].total++;
          if (record.status === 'PRESENT') {
            attendanceByStudent[studentId].present++;
          }
        });

        // Calculate average attendance across all children
        const attendancePercentages = Object.values(attendanceByStudent).map(att => 
          att.total > 0 ? (att.present / att.total) * 100 : 0
        );
        
        recentAttendance = attendancePercentages.length > 0 
          ? Math.round(attendancePercentages.reduce((sum, p) => sum + p, 0) / attendancePercentages.length)
          : 0;
      } catch (attendanceError) {
        console.error('Error calculating attendance:', attendanceError);
        recentAttendance = 0;
      }
    }

    // Get real upcoming exams for children's classes
    const classIds = children.map(c => c.classId).filter(Boolean);
    let upcomingExams = 0;
    
    try {
      if (classIds.length > 0) {
        upcomingExams = await prisma.examTimetable.count({
          where: {
            schoolId: BigInt(schoolId),
            date: { gte: new Date() },
            deletedAt: null,
            exam: {
              classId: { in: classIds }
            }
          }
        });
      }
    } catch (examError) {
      console.error('Error calculating upcoming exams:', examError);
      upcomingExams = 0;
    }

    // Calculate real fees data
    let totalFees = 0;
    let paidFees = 0;
    
    if (children.length > 0 && classIds.length > 0) {
      try {
        // Get fee structure for all children's classes
        const feeStructures = await prisma.feeStructure.findMany({
          where: {
            classId: { in: classIds },
            schoolId: BigInt(schoolId),
            deletedAt: null
          },
          include: {
            items: {
              where: { deletedAt: null }
            }
          }
        });

        // Calculate total fees
        feeStructures.forEach(structure => {
          if (structure.items && structure.items.length > 0) {
            structure.items.forEach(item => {
              totalFees += Number(item.amount || 0);
            });
          }
        });

        // Get actual payments for these students
        const payments = await prisma.payment.findMany({
          where: {
            studentId: { in: studentIds },
            schoolId: BigInt(schoolId),
            status: { in: ['PAID', 'PARTIALLY_PAID'] },
            deletedAt: null
          },
          select: {
            amount: true
          }
        });

        paidFees = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      } catch (feeError) {
        console.error('Error calculating fees:', feeError);
        // Fallback to default values if fee calculation fails
        totalFees = 0;
        paidFees = 0;
      }
    }

    // Generate real recent activity from actual data
    const recentActivity = [];
    
    try {
      // Get recent assignments
      if (classIds.length > 0) {
        const recentAssignments = await prisma.assignment.findMany({
          where: {
            classId: { in: classIds },
            schoolId: BigInt(schoolId),
            deletedAt: null,
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
          },
          include: {
            subject: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        });

        recentAssignments.forEach((assignment, index) => {
          const hoursAgo = Math.floor((Date.now() - new Date(assignment.createdAt).getTime()) / (1000 * 60 * 60));
          recentActivity.push({
            id: `assignment-${assignment.id}`,
            type: 'assignment',
            message: `New ${assignment.subject?.name || 'Assignment'} assignment posted`,
            time: hoursAgo < 24 ? `${hoursAgo} hours ago` : `${Math.floor(hoursAgo / 24)} days ago`,
            icon: '📝'
          });
        });
      }

      // Get recent attendance records
      if (studentIds.length > 0) {
        const recentAttendanceRecords = await prisma.attendance.findMany({
          where: {
            studentId: { in: studentIds },
            schoolId: BigInt(schoolId),
            date: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }, // Last 3 days
            deletedAt: null
          },
          orderBy: { createdAt: 'desc' },
          take: 2
        });

        recentAttendanceRecords.forEach((record, index) => {
          const hoursAgo = Math.floor((Date.now() - new Date(record.createdAt).getTime()) / (1000 * 60 * 60));
          recentActivity.push({
            id: `attendance-${record.id}`,
            type: 'attendance',
            message: `Attendance marked for ${record.status.toLowerCase()}`,
            time: hoursAgo < 24 ? `${hoursAgo} hours ago` : `${Math.floor(hoursAgo / 24)} days ago`,
            icon: record.status === 'PRESENT' ? '✅' : '❌'
          });
        });
      }

      // Get recent grades
      if (studentIds.length > 0) {
        const recentGrades = await prisma.grade.findMany({
          where: {
            studentId: { in: studentIds },
            schoolId: BigInt(schoolId),
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            deletedAt: null
          },
          include: {
            subject: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 2
        });

        recentGrades.forEach((grade, index) => {
          const hoursAgo = Math.floor((Date.now() - new Date(grade.createdAt).getTime()) / (1000 * 60 * 60));
          recentActivity.push({
            id: `grade-${grade.id}`,
            type: 'grade',
            message: `${grade.subject?.name || 'Subject'} test results available`,
            time: hoursAgo < 24 ? `${hoursAgo} hours ago` : `${Math.floor(hoursAgo / 24)} days ago`,
            icon: '📊'
          });
        });
      }

      // Sort by time and limit to 6 most recent
      recentActivity.sort((a, b) => {
        const aTime = parseInt(a.time.split(' ')[0]);
        const bTime = parseInt(b.time.split(' ')[0]);
        return aTime - bTime;
      }).slice(0, 6);
    } catch (activityError) {
      console.error('Error generating recent activity:', activityError);
      // Fallback to empty activity array
    }

    const data = {
      totalChildren,
      totalAssignments,
      pendingAssignments,
      submittedAssignments,
      overdueAssignments,
      recentAttendance,
      upcomingExams,
      totalFees,
      paidFees,
      recentActivity,
      children: await Promise.all(children.map(async (child) => {
        let studentAttendancePercentage = 0;
        let studentAverageGrade = 0;

        try {
          // Calculate individual student attendance
          const studentAttendance = await prisma.attendance.findMany({
            where: {
              studentId: child.id,
              schoolId: BigInt(schoolId),
              date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
              deletedAt: null
            },
            select: { status: true }
          });

          studentAttendancePercentage = studentAttendance.length > 0
            ? Math.round((studentAttendance.filter(a => a.status === 'PRESENT').length / studentAttendance.length) * 100)
            : 0;

          // Calculate individual student average grade
          const studentGrades = await prisma.grade.findMany({
            where: {
              studentId: child.id,
              schoolId: BigInt(schoolId),
              deletedAt: null
            },
            select: { marks: true }
          });

          studentAverageGrade = studentGrades.length > 0
            ? Math.round(studentGrades.reduce((sum, grade) => sum + Number(grade.marks || 0), 0) / studentGrades.length)
            : 0;
        } catch (studentError) {
          console.error(`Error calculating data for student ${child.id}:`, studentError);
          // Use default values if calculation fails
        }

        return {
          id: child.id.toString(),
          firstName: child.user.firstName,
          lastName: child.user.lastName,
          grade: child.class.name,
          attendance: studentAttendancePercentage,
          averageGrade: studentAverageGrade,
          className: child.class.name
        };
      }))
    };

    // Calculate quickStats after children data is processed
    const childrenWithData = data.children;
    const averageGrade = childrenWithData.length > 0 
      ? Math.round(childrenWithData.reduce((sum, child) => sum + child.averageGrade, 0) / childrenWithData.length)
      : 0;

    data.quickStats = {
      averageAttendance: recentAttendance,
      averageGrade: averageGrade,
      pendingFees: totalFees - paidFees,
      upcomingExams
    };

    return res.json({ success: true, data: convertBigInts(data) });
  } catch (error) {
    console.error('Get parent dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get dashboard' });
  }
});

/**
 * @route   GET /api/parents/:id
 * @desc    Get parent by user ID
 * @access  Private (Admin, Staff, Teacher, Parent)
 * @permissions parent:read
 */
router.get('/:id', /*authenticateToken, authorizePermissions(['parent:read']),*/ async (req, res) => {
  try {
    const schoolId = (req.user && req.user.schoolId) ? req.user.schoolId : 1;
    const { id } = req.params;

    // Guard: if id is not a numeric string, this is likely a different route (e.g., 'dashboard')
    if (!/^\d+$/.test(String(id))) {
      return res.status(400).json({ success: false, message: 'Invalid parent id' });
    }

    const parent = await prisma.parent.findFirst({
      where: {
        userId: BigInt(id),
        schoolId: BigInt(schoolId),
        deletedAt: null
      },
      include: {
        user: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
            avatar: true
          }
        },
        students: {
          where: { deletedAt: null },
          take: 50, // Limit students to prevent overloading
          include: {
            user: { 
              select: { 
                id: true, 
                firstName: true, 
                lastName: true,
                avatar: true
              } 
            },
            class: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      }
    });

    if (!parent) {
      return res.status(404).json({ success: false, message: 'Parent not found' });
    }

    res.json({ success: true, data: convertBigInts(parent) });
  } catch (error) {
    console.error('Get parent error:', error);
    res.status(500).json({ success: false, message: 'Failed to get parent' });
  }
});

/**
 * @route   POST /api/parents
 * @desc    Create a new parent
 * @access  Private (Admin, Staff)
 * @permissions parent:create
 */
router.post('/', /*authenticateToken, authorizePermissions(['parent:create']),*/ async (req, res) => {
  try {
    const schoolId = (req.user && req.user.schoolId) ? req.user.schoolId : 1;
    const userId = (req.user && req.user.id) ? req.user.id : 1;
    const parentData = req.body;

    if (!parentData.userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const existingParent = await prisma.parent.findUnique({
      where: { userId: BigInt(parentData.userId) }
    });

    if (existingParent) {
      return res.status(400).json({ success: false, message: 'User is already a parent' });
    }

    const parent = await prisma.parent.create({
      data: {
        userId: BigInt(parentData.userId),
        occupation: parentData.occupation || null,
        annualIncome: parentData.annualIncome ? parseFloat(parentData.annualIncome) : null,
        education: parentData.education || null,
        schoolId: BigInt(schoolId),
        createdBy: BigInt(userId)
      },
      include: {
        user: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Parent created successfully',
      data: convertBigInts(parent)
    });
  } catch (error) {
    console.error('Create parent error:', error);
    res.status(500).json({ success: false, message: 'Failed to create parent' });
  }
});

/**
 * @route   PUT /api/parents/:id
 * @desc    Update parent
 * @access  Private (Admin, Staff)
 * @permissions parent:update
 */
router.put('/:id', /*authenticateToken, authorizePermissions(['parent:update']),*/ async (req, res) => {
  try {
    const schoolId = (req.user && req.user.schoolId) ? req.user.schoolId : 1;
    const { id } = req.params;
    const updateData = req.body;

    const parent = await prisma.parent.update({
      where: {
        userId: BigInt(id),
        schoolId: BigInt(schoolId)
      },
      data: {
        occupation: updateData.occupation,
        annualIncome: updateData.annualIncome ? parseFloat(updateData.annualIncome) : null,
        education: updateData.education,
        updatedBy: BigInt((req.user && req.user.id) ? req.user.id : 1)
      },
      include: {
        user: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Parent updated successfully',
      data: convertBigInts(parent)
    });
  } catch (error) {
    console.error('Update parent error:', error);
    res.status(500).json({ success: false, message: 'Failed to update parent' });
  }
});

/**
 * @route   DELETE /api/parents/:id
 * @desc    Soft delete parent
 * @access  Private (Admin, Staff)
 * @permissions parent:delete
 */
router.delete('/:id', /*authenticateToken, authorizePermissions(['parent:delete']),*/ async (req, res) => {
  try {
    const schoolId = (req.user && req.user.schoolId) ? req.user.schoolId : 1;
    const { id } = req.params;

    await prisma.parent.update({
      where: {
        userId: BigInt(id),
        schoolId: BigInt(schoolId)
      },
      data: {
        deletedAt: new Date(),
        updatedBy: BigInt((req.user && req.user.id) ? req.user.id : 1)
      }
    });

    res.json({ success: true, message: 'Parent deleted successfully' });
  } catch (error) {
    console.error('Delete parent error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete parent' });
  }
});

// ============================================================================
// Parent Students
// ============================================================================

router.get('/:id/students', /*authenticateToken, authorizePermissions(['parent:read', 'student:read_children']),*/ async (req, res) => {
  try {
    const schoolId = (req.user && req.user.schoolId) ? req.user.schoolId : 1;
    const { id } = req.params; // This is the parent user ID

    console.log('🔍 Parent students route called with:', { parentUserId: id, schoolId });

    // First, find the parent record using the user ID
    const parent = await prisma.parent.findFirst({
      where: {
        userId: BigInt(id),
        schoolId: BigInt(schoolId),
        deletedAt: null
      },
      select: { id: true, userId: true }
    });

    if (!parent) {
      console.log('❌ Parent not found for user ID:', id);
      return res.status(404).json({ 
        success: false, 
        message: 'Parent not found' 
      });
    }

    console.log('✅ Parent found:', { parentId: parent.id, parentUserId: parent.userId });

    // Now find students using the parent record ID
    const students = await prisma.student.findMany({
      where: {
        parentId: parent.id, // Use parent record ID, not user ID
        schoolId: BigInt(schoolId),
        deletedAt: null
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        class: { select: { id: true, name: true } }
      }
    });

    console.log('✅ Students found:', students.length);

    res.json({ success: true, data: convertBigInts(students) });
  } catch (error) {
    console.error('Get parent students error:', error);
    res.status(500).json({ success: false, message: 'Failed to get parent students' });
  }
});

// Debug endpoint
router.get('/:id/debug', authenticateToken, authorizePermissions(['parent:read']), async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { id } = req.params; // This is the parent user ID

    console.log('🔍 Debug endpoint called with:', { parentUserId: id, schoolId });

    // First, find the parent record using the user ID
    const parent = await prisma.parent.findFirst({
      where: {
        userId: BigInt(id),
        schoolId: BigInt(schoolId),
        deletedAt: null
      },
      include: {
        user: { 
          select: { 
            id: true, 
            firstName: true, 
            lastName: true, 
            role: true 
          } 
        },
        students: {
          where: { deletedAt: null },
          take: 20, // Limit students for debug
          include: { 
            user: { 
              select: { 
                id: true, 
                firstName: true, 
                lastName: true 
              } 
            } 
          }
        }
      }
    });

    if (!parent) {
      console.log('❌ Parent not found for user ID:', id);
      return res.json({
        success: false,
        message: 'Parent not found',
        debug: { searchedUserId: id, searchedSchoolId: schoolId, parentExists: false }
      });
    }

    console.log('✅ Parent found with students:', { 
      parentId: parent.id, 
      parentUserId: parent.userId, 
      studentsCount: parent.students?.length || 0 
    });

    res.json({
      success: true,
      message: 'Debug info retrieved',
      data: convertBigInts(parent)
    });
  } catch (error) {
    console.error('Debug parent error:', error);
    res.status(500).json({ success: false, message: 'Debug failed' });
  }
});

// ============================================================================
// Placeholder endpoints for other functionality
// ============================================================================

router.get('/:parentId/students/:studentId/attendance', authenticateToken, authorizePermissions(['parent:read', 'student:read_children']), (req, res) => {
  res.json({ success: true, message: 'Student attendance endpoint - implement as needed' });
});

router.get('/:parentId/students/:studentId/grades', authenticateToken, authorizePermissions(['parent:read', 'student:read_children']), (req, res) => {
  res.json({ success: true, message: 'Student grades endpoint - implement as needed' });
});

// Get assignments for all children of a parent
router.get('/:parentId/assignments', authenticateToken, authorizePermissions(['parent:read']), async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { parentId } = req.params;
    const { page = 1, limit = 50, status = '', subject = '', studentId = '', sortBy = 'dueDate', sortOrder = 'asc' } = req.query;

    console.log('🔍 Parent all assignments route called with:', { parentId, schoolId });

    // Verify parent exists
    const parent = await prisma.parent.findFirst({
      where: {
        userId: BigInt(parentId),
        schoolId: BigInt(schoolId),
        deletedAt: null
      },
      select: { id: true }
    });

    if (!parent) {
      return res.status(404).json({ 
        success: false, 
        message: 'Parent not found' 
      });
    }

    // Get all students for this parent
    const students = await prisma.student.findMany({
      where: {
        parentId: parent.id,
        schoolId: BigInt(schoolId),
        deletedAt: null
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        class: { select: { id: true, name: true } }
      }
    });

    if (students.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: { page: 1, limit: 50, total: 0, pages: 0 },
        meta: { students: [], filters: { status, subject, studentId } }
      });
    }

    // Filter students if specific student requested
    let targetStudents = students;
    if (studentId) {
      targetStudents = students.filter(s => s.id.toString() === studentId);
    }

    const classIds = targetStudents.map(s => s.class.id);

    // Build assignment query
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = Math.min(parseInt(limit), 100);

    const where = {
      classId: { in: classIds },
      schoolId: BigInt(schoolId),
      deletedAt: null
    };

    // Add filters
    if (subject) {
      where.subject = {
        name: { contains: subject, mode: 'insensitive' }
      };
    }

    // Get assignments for all student classes
    const assignments = await prisma.assignment.findMany({
      where,
      skip,
      take,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        class: {
          select: {
            id: true,
            name: true
          }
        },
        attachments: {
          select: {
            id: true,
            name: true,
            path: true,
            mimeType: true,
            size: true
          }
        },
        submissions: {
          where: {
            studentId: { in: targetStudents.map(s => s.id) }
          },
          select: {
            id: true,
            studentId: true,
            submittedAt: true,
            score: true,
            feedback: true,
            student: {
              select: {
                id: true,
                user: { select: { firstName: true, lastName: true } }
              }
            },
            attachments: {
              select: {
                id: true,
                name: true,
                path: true
              }
            }
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      }
    });

    // Get total count for pagination
    const total = await prisma.assignment.count({ where });

    // Create student lookup map
    const studentMap = new Map();
    targetStudents.forEach(student => {
      studentMap.set(student.id.toString(), {
        id: student.id.toString(),
        name: `${student.user.firstName} ${student.user.lastName}`,
        class: student.class.name
      });
    });

    // Enhance assignment data with submission status for each student
    const enhancedAssignments = assignments.map(assignment => {
      const now = new Date();
      const dueDate = new Date(assignment.dueDate);
      const daysRemaining = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      
      // Get submissions for each student
      const studentSubmissions = targetStudents.map(student => {
        const submission = assignment.submissions.find(s => s.studentId.toString() === student.id.toString());
        let status = 'PENDING';
        let isOverdue = false;
        
        if (submission && submission.submittedAt) {
          status = 'SUBMITTED';
        } else if (dueDate < now) {
          status = 'OVERDUE';
          isOverdue = true;
        }

        return {
          studentId: student.id.toString(),
          studentName: `${student.user.firstName} ${student.user.lastName}`,
          className: student.class.name,
          submission,
          status,
          isOverdue,
          daysRemaining
        };
      });

      return {
        ...assignment,
        studentSubmissions,
        daysRemaining,
        totalStudents: studentSubmissions.length,
        submittedCount: studentSubmissions.filter(s => s.status === 'SUBMITTED').length,
        overdueCount: studentSubmissions.filter(s => s.status === 'OVERDUE').length,
        pendingCount: studentSubmissions.filter(s => s.status === 'PENDING').length
      };
    });

    // Filter by status if specified
    let filteredAssignments = enhancedAssignments;
    if (status) {
      filteredAssignments = enhancedAssignments.filter(assignment => {
        if (studentId) {
          // If specific student, check that student's status
          const studentSubmission = assignment.studentSubmissions.find(s => s.studentId === studentId);
          return studentSubmission && studentSubmission.status.toLowerCase() === status.toLowerCase();
        } else {
          // If all students, check if any student has this status
          return assignment.studentSubmissions.some(s => s.status.toLowerCase() === status.toLowerCase());
        }
      });
    }

    console.log('✅ Found assignments for parent:', { 
      total: filteredAssignments.length,
      studentsCount: targetStudents.length,
      parentId
    });

    res.json({
      success: true,
      data: convertBigInts(filteredAssignments),
      pagination: {
        page: parseInt(page),
        limit: take,
        total: status ? filteredAssignments.length : total,
        pages: Math.ceil((status ? filteredAssignments.length : total) / take)
      },
      meta: {
        students: Array.from(studentMap.values()),
        filters: {
          status,
          subject,
          studentId,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error('Get parent assignments error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get parent assignments' 
    });
  }
});

router.get('/:parentId/students/:studentId/assignments', authenticateToken, authorizePermissions(['parent:read', 'student:read_children']), async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { parentId, studentId } = req.params;
    const { page = 1, limit = 20, status = '', subject = '', sortBy = 'dueDate', sortOrder = 'asc' } = req.query;

    console.log('🔍 Parent assignments route called with:', { parentId, studentId, schoolId });

    // Verify parent-student relationship
    const parent = await prisma.parent.findFirst({
      where: {
        userId: BigInt(parentId),
        schoolId: BigInt(schoolId),
        deletedAt: null
      },
      select: { id: true }
    });

    if (!parent) {
      return res.status(404).json({ 
        success: false, 
        message: 'Parent not found' 
      });
    }

    // Verify student belongs to this parent
    const student = await prisma.student.findFirst({
      where: {
        id: BigInt(studentId),
        parentId: parent.id,
        schoolId: BigInt(schoolId),
        deletedAt: null
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        class: { select: { id: true, name: true } }
      }
    });

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found or not associated with this parent' 
      });
    }

    console.log('✅ Parent-student relationship verified:', { 
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      className: student.class.name 
    });

    // Build assignment query
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = Math.min(parseInt(limit), 100);

    const where = {
      classId: student.class.id,
      schoolId: BigInt(schoolId),
      deletedAt: null
    };

    // Add filters
    if (subject) {
      where.subject = {
        name: { contains: subject, mode: 'insensitive' }
      };
    }

    // Get assignments for the student's class
    const assignments = await prisma.assignment.findMany({
      where,
      skip,
      take,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        class: {
          select: {
            id: true,
            name: true
          }
        },
        attachments: {
          select: {
            id: true,
            name: true,
            path: true,
            mimeType: true,
            size: true
          }
        },
        submissions: {
          where: {
            studentId: BigInt(studentId)
          },
          select: {
            id: true,
            submittedAt: true,
            score: true,
            feedback: true,
            attachments: {
              select: {
                id: true,
                name: true,
                path: true
              }
            }
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      }
    });

    // Get total count for pagination
    const total = await prisma.assignment.count({ where });

    // Enhance assignment data with submission status
    const enhancedAssignments = assignments.map(assignment => {
      const submission = assignment.submissions[0];
      const now = new Date();
      const dueDate = new Date(assignment.dueDate);
      
      let status = 'PENDING';
      let isOverdue = false;
      
      if (submission && submission.submittedAt) {
        status = 'SUBMITTED';
      } else if (dueDate < now) {
        status = 'OVERDUE';
        isOverdue = true;
      }

      return {
        ...assignment,
        submission,
        status,
        isOverdue,
        daysRemaining: Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24)),
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        className: student.class.name
      };
    });

    // Filter by status if specified
    let filteredAssignments = enhancedAssignments;
    if (status) {
      filteredAssignments = enhancedAssignments.filter(assignment => 
        assignment.status.toLowerCase() === status.toLowerCase()
      );
    }

    console.log('✅ Found assignments:', { 
      total: filteredAssignments.length,
      studentName: `${student.user.firstName} ${student.user.lastName}`
    });

    res.json({
      success: true,
      data: convertBigInts(filteredAssignments),
      pagination: {
        page: parseInt(page),
        limit: take,
        total: status ? filteredAssignments.length : total,
        pages: Math.ceil((status ? filteredAssignments.length : total) / take)
      },
      meta: {
        student: {
          id: student.id.toString(),
          name: `${student.user.firstName} ${student.user.lastName}`,
          class: student.class.name
        },
        filters: {
          status,
          subject,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    console.error('Get parent student assignments error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get student assignments' 
    });
  }
});

router.get('/:parentId/students/:studentId/exams', authenticateToken, authorizePermissions(['parent:read', 'student:read_children']), (req, res) => {
  res.json({ success: true, message: 'Student exams endpoint - implement as needed' });
});

// ============================================================================
// Financial Data Endpoints for Parent Portal
// ============================================================================

/**
 * @route   GET /api/parents/:parentId/students/:studentId/financial-summary
 * @desc    Get comprehensive financial summary for a student
 * @access  Private (Parent)
 * @permissions parent:read, student:read_children
 */
router.get('/:parentId/students/:studentId/financial-summary', authenticateToken, authorizePermissions(['parent:read', 'student:read_children']), authorizeStudentAccess('studentId'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const schoolId = req.user?.schoolId || 1;

    // Verify student exists in this school (access already validated by authorizeStudentAccess)
    const student = await prisma.student.findFirst({
      where: {
        id: BigInt(studentId),
        schoolId: BigInt(schoolId),
        deletedAt: null
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        class: { select: { id: true, name: true, code: true } }
      }
    });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Get all payments for this student
    const payments = await prisma.payment.findMany({
      where: { studentId: BigInt(studentId), schoolId: BigInt(schoolId), deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });

    // Get fee structure for this student's class
    const feeStructure = await prisma.feeStructure.findMany({
      where: {
        classId: student.class.id,
        schoolId: BigInt(schoolId),
        deletedAt: null
      },
      orderBy: { name: 'asc' }
    });

    // Calculate financial summary
    const totalFees = feeStructure.reduce((sum, fee) => sum + Number(fee.amount), 0);
    const totalPaid = payments
      .filter(p => p.status === 'PAID' || p.status === 'PARTIALLY_PAID')
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    const totalPending = payments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    const totalOverdue = payments
      .filter(p => p.status === 'OVERDUE')
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    const outstandingAmount = totalFees - totalPaid;
    const paymentPercentage = totalFees > 0 ? (totalPaid / totalFees) * 100 : 0;

    // Get recent payments (last 10)
    const recentPayments = payments.slice(0, 10).map(payment => ({
      id: payment.id,
      amount: Number(payment.amount),
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      createdAt: payment.createdAt,
      dueDate: payment.dueDate,
      description: payment.description
    }));

    // Get upcoming due payments
    const upcomingPayments = payments
      .filter(p => p.status === 'PENDING' && new Date(p.dueDate) > new Date())
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5)
      .map(payment => ({
        id: payment.id,
        amount: Number(payment.amount),
        dueDate: payment.dueDate,
        description: payment.description
      }));

    // Convert all BigInt values to strings/numbers before creating response
    const responseData = {
      student: {
        id: student.id.toString(),
        name: `${student.user?.firstName || ''} ${student.user?.lastName || ''}`.trim() || 'Unknown Student',
        class: student.class.name,
        classCode: student.class.code
      },
      summary: {
        totalFees: Number(totalFees),
        totalPaid: Number(totalPaid),
        totalPending: Number(totalPending),
        totalOverdue: Number(totalOverdue),
        outstandingAmount: Number(outstandingAmount),
        paymentPercentage: Math.round(paymentPercentage * 100) / 100
      },
      feeStructure: feeStructure.map(fee => ({
        id: fee.id.toString(),
        type: fee.name || fee.type || 'Fee',
        description: fee.description || '',
        amount: Number(fee.amount),
        dueDate: fee.dueDate ? new Date(fee.dueDate).toISOString() : null,
        isRecurring: Boolean(fee.isRecurring)
      })),
      recentPayments: recentPayments.map(payment => ({
        id: payment.id.toString(),
        amount: Number(payment.amount),
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        createdAt: payment.createdAt ? new Date(payment.createdAt).toISOString() : null,
        dueDate: payment.dueDate ? new Date(payment.dueDate).toISOString() : null,
        description: payment.description
      })),
      upcomingPayments: upcomingPayments.map(payment => ({
        id: payment.id.toString(),
        amount: Number(payment.amount),
        dueDate: payment.dueDate ? new Date(payment.dueDate).toISOString() : null,
        description: payment.description
      }))
    };

    res.json({
      success: true,
      data: responseData,
      state: {
        timestamp: new Date().toISOString(),
        schoolId: Number(schoolId),
        studentId: studentId,
        parentId: req.params.parentId
      }
    });

  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * @route   GET /api/parents/:parentId/students/:studentId/payments
 * @desc    Get all payments for a student with filtering
 * @access  Private (Parent)
 * @permissions parent:read, student:read_children
 */
router.get('/:parentId/students/:studentId/payments', authenticateToken, authorizePermissions(['parent:read', 'student:read_children']), authorizeStudentAccess('studentId'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const schoolId = req.user?.schoolId || 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = Math.min(parseInt(limit), 100);

    const where = { studentId: BigInt(studentId), schoolId: BigInt(schoolId), deletedAt: null };
    if (status) { where.status = status; }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const payments = await prisma.payment.findMany({
      where, skip, take, orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.payment.count({ where });

    // Convert all BigInt values to strings/numbers before creating response
    const paymentsData = payments.map(payment => ({
      id: payment.id.toString(),
      amount: Number(payment.amount),
      status: payment.status,
      paymentMethod: payment.paymentMethod || 'Unknown',
      description: payment.description || '',
      dueDate: payment.dueDate ? new Date(payment.dueDate).toISOString() : null,
      createdAt: payment.createdAt ? new Date(payment.createdAt).toISOString() : null,
      updatedAt: payment.updatedAt ? new Date(payment.updatedAt).toISOString() : null,
      feeType: payment.feeType || 'General Fee',
      feeDescription: payment.feeDescription || ''
    }));

    res.json({
      success: true,
      data: paymentsData,
      pagination: {
        page: parseInt(page),
        limit: take,
        total: Number(total),
        pages: Math.ceil(Number(total) / take)
      },
      state: {
        timestamp: new Date().toISOString(),
        schoolId: Number(schoolId),
        studentId: studentId,
        parentId: req.params.parentId,
        filters: {
          status: status || null,
          startDate: startDate || null,
          endDate: endDate || null
        }
      }
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * @route   GET /api/parents/:parentId/students/:studentId/fee-structure
 * @desc    Get fee structure for a student's class
 * @access  Private (Parent)
 * @permissions parent:read, student:read_children
 */
router.get('/:parentId/students/:studentId/fee-structure', authenticateToken, authorizePermissions(['parent:read', 'student:read_children']), authorizeStudentAccess('studentId'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const schoolId = req.user?.schoolId || 1;

    const student = await prisma.student.findFirst({
      where: { id: BigInt(studentId), schoolId: BigInt(schoolId), deletedAt: null },
      include: { 
        user: { select: { firstName: true, lastName: true } },
        class: { select: { id: true, name: true, code: true } } 
      }
    });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const feeStructure = await prisma.feeStructure.findMany({
      where: { classId: student.class.id, schoolId: BigInt(schoolId), deletedAt: null },
      orderBy: { name: 'asc' }
    });

    // Group fees by category
    const feesByCategory = feeStructure.reduce((acc, fee) => {
      const category = fee.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        id: fee.id,
        name: fee.name || fee.type || 'Fee',
        description: fee.description || '',
        amount: Number(fee.amount),
        dueDate: fee.dueDate,
        isRecurring: Boolean(fee.isRecurring),
        isOptional: Boolean(fee.isOptional)
      });
      return acc;
    }, {});

    const totalFees = feeStructure.reduce((sum, fee) => sum + Number(fee.amount), 0);

    // Convert all BigInt values to strings/numbers before creating response
    const responseData = {
      student: {
        id: student.id.toString(),
        name: `${student.user?.firstName || ''} ${student.user?.lastName || ''}`.trim() || 'Unknown Student',
        class: student.class.name,
        classCode: student.class.code
      },
      totalFees: Number(totalFees),
      feesByCategory: Object.fromEntries(
        Object.entries(feesByCategory).map(([category, fees]) => [
          category,
          fees.map(fee => ({
            id: fee.id.toString(),
            name: fee.name || fee.type || 'Fee',
            description: fee.description || '',
            amount: Number(fee.amount),
            dueDate: fee.dueDate ? new Date(fee.dueDate).toISOString() : null,
            isRecurring: Boolean(fee.isRecurring),
            isOptional: Boolean(fee.isOptional)
          }))
        ])
      ),
      academicYear: new Date().getFullYear()
    };

    res.json({
      success: true,
      data: responseData,
      state: {
        timestamp: new Date().toISOString(),
        schoolId: Number(schoolId),
        studentId: studentId,
        parentId: req.params.parentId
      }
    });

  } catch (error) {
    console.error('Error fetching fee structure:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * @route   GET /api/parents/:parentId/students/:studentId/financial-analytics
 * @desc    Get financial analytics and trends for a student
 * @access  Private (Parent)
 * @permissions parent:read, student:read_children
 */
router.get('/:parentId/students/:studentId/financial-analytics', authenticateToken, authorizePermissions(['parent:read', 'student:read_children']), authorizeStudentAccess('studentId'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { period = 'year', year } = req.query;
    const schoolId = req.user?.schoolId || 1;

    // Determine the target year - use query parameter or current year
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    // Access validated already; just compute analytics
    const now = new Date();
    let startDate, endDate;
    
    switch (period) {
      case 'month': 
        startDate = new Date(targetYear, now.getMonth(), 1);
        endDate = new Date(targetYear, now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'quarter': 
        const q = Math.floor(now.getMonth() / 3);
        startDate = new Date(targetYear, q * 3, 1);
        endDate = new Date(targetYear, (q + 1) * 3, 0, 23, 59, 59, 999);
        break;
      default: 
        startDate = new Date(targetYear, 0, 1);
        endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);
    }

    const payments = await prisma.payment.findMany({
      where: { studentId: BigInt(studentId), schoolId: BigInt(schoolId), createdAt: { gte: startDate, lte: endDate }, deletedAt: null },
      orderBy: { createdAt: 'asc' }
    });

    // Calculate analytics
    const totalPaid = payments
      .filter(p => p.status === 'PAID' || p.status === 'PARTIALLY_PAID')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalPending = payments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalOverdue = payments
      .filter(p => p.status === 'OVERDUE')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Payment trends by month
    const monthlyTrends = {};
    payments.forEach(payment => {
      const month = payment.createdAt.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyTrends[month]) {
        monthlyTrends[month] = { paid: 0, pending: 0, overdue: 0 };
      }
      const status = payment.status.toLowerCase();
      if (status === 'completed' || status === 'paid') {
        monthlyTrends[month].paid += Number(payment.amount);
      } else if (status === 'pending') {
        monthlyTrends[month].pending += Number(payment.amount);
      } else if (status === 'overdue') {
        monthlyTrends[month].overdue += Number(payment.amount);
      }
    });

    // Payment method breakdown
    const paymentMethods = {};
    payments.forEach(payment => {
      const method = payment.paymentMethod || 'Unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { count: 0, total: 0 };
      }
      paymentMethods[method].count++;
      paymentMethods[method].total += Number(payment.amount);
    });

    const totalTransactions = payments.length;

    // Convert all BigInt values to strings/numbers before creating response
    res.json({
      success: true,
      data: {
        period,
        summary: {
          totalPaid: Number(totalPaid),
          totalPending: Number(totalPending),
          totalOverdue: Number(totalOverdue),
          totalTransactions: Number(totalTransactions)
        },
        trends: {
          monthly: Object.entries(monthlyTrends).map(([month, data]) => ({
            month,
            paid: Number(data.paid),
            pending: Number(data.pending),
            overdue: Number(data.overdue)
          })).sort((a, b) => a.month.localeCompare(b.month))
        },
        paymentMethods: Object.entries(paymentMethods).map(([method, data]) => ({
          method,
          count: Number(data.count),
          total: Number(data.total),
          percentage: totalTransactions > 0 ? Math.round((data.count / totalTransactions) * 100 * 100) / 100 : 0
        }))
      },
      state: {
        timestamp: new Date().toISOString(),
        schoolId: Number(schoolId),
        studentId: studentId,
        parentId: req.params.parentId,
        period: period,
        year: targetYear,
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error fetching financial analytics:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/:parentId/students/:studentId/fees', authenticateToken, authorizePermissions(['parent:read', 'student:read_children']), (req, res) => {
  res.json({ success: true, message: 'Student fees endpoint - implement as needed' });
});

router.get('/:parentId/students/:studentId/timetable', authenticateToken, authorizePermissions(['parent:read', 'student:read_children']), (req, res) => {
  res.json({ success: true, message: 'Student timetable endpoint - implement as needed' });
});

router.get('/:parentId/notifications', authenticateToken, authorizePermissions(['parent:read', 'notification:read']), (req, res) => {
  res.json({ success: true, message: 'Parent notifications endpoint - implement as needed' });
});

router.patch('/:parentId/notifications/:notificationId/read', authenticateToken, authorizePermissions(['parent:read', 'notification:read']), (req, res) => {
  res.json({ success: true, message: 'Mark notification as read endpoint - implement as needed' });
});

router.patch('/:parentId/notifications/read-all', authenticateToken, authorizePermissions(['parent:read', 'notification:read']), (req, res) => {
  res.json({ success: true, message: 'Mark all notifications as read endpoint - implement as needed' });
});

router.get('/:parentId/students/:studentId/notifications', authenticateToken, authorizePermissions(['parent:read', 'student:read_children']), (req, res) => {
  res.json({ success: true, message: 'Student notifications endpoint - implement as needed' });
});

router.get('/:parentId/students/:studentId/academic-summary', authenticateToken, authorizePermissions(['parent:read', 'student:read_children']), (req, res) => {
  res.json({ success: true, message: 'Student academic summary endpoint - implement as needed' });
});

router.get('/stats', authenticateToken, authorizePermissions(['parent:read']), async (req, res) => {
  try {
    const { schoolId } = req.user;
    
    const totalParents = await prisma.parent.count({
      where: { schoolId: BigInt(schoolId), deletedAt: null }
    });

    const activeParents = await prisma.parent.count({
      where: { 
        schoolId: BigInt(schoolId), 
        deletedAt: null,
        user: { status: 'ACTIVE' }
      }
    });

    res.json({
      success: true,
      data: {
        totalParents,
        activeParents,
        inactiveParents: totalParents - activeParents
      }
    });
  } catch (error) {
    console.error('Get parent stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get parent stats' });
  }
});

export default router; 