import express from 'express';
import { authenticateToken, authorizeRoles, authorizePermissions } from '../middleware/auth.js';
import { validateParams, idSchema } from '../middleware/validation.js';
import studentController from '../controllers/studentController.js';

const router = express.Router();

/**
 * @route   GET /api/activities/students
 * @desc    Get activities for students
 * @access  Private (All authenticated users)
 * @query   {studentId?} - Optional student ID filter
 * @permissions student:read
 */
router.get('/students',
  authenticateToken,
  authorizePermissions(['student:read']),
  async (req, res) => {
    try {
      const { studentId } = req.query;
      
      // If studentId is provided, get activities for that specific student
      if (studentId) {
        // Get student activities (attendance, assignments, grades, etc.)
        const activities = await getStudentActivities(studentId, req.user);
        return res.json({
          success: true,
          data: activities
        });
      }
      
      // Otherwise, get activities for all students the user has access to
      // This would depend on the user's role and scope
      const activities = await getAllStudentActivities(req.user);
      return res.json({
        success: true,
        data: activities
      });
      
    } catch (error) {
      console.error('Error in get activities:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch activities',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/activities/:studentId
 * @desc    Get activities for a specific student
 * @access  Private (All authenticated users)
 * @permissions student:read
 */
router.get('/:studentId',
  authenticateToken,
  authorizePermissions(['student:read']),
  validateParams(idSchema),
  async (req, res) => {
    try {
      const { studentId } = req.params;
      
      // Get student activities (attendance, assignments, grades, etc.)
      const activities = await getStudentActivities(studentId, req.user);
      return res.json({
        success: true,
        data: activities
      });
      
    } catch (error) {
      console.error('Error in get activities:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch activities',
        error: error.message
      });
    }
  }
);

/**
 * Helper function to get activities for a specific student
 */
async function getStudentActivities(studentId, user) {
  const prisma = (await import('../utils/prismaClient.js')).default;
  
  try {
    const studentIdBigInt = BigInt(studentId);
    
    // Get recent activities
    const [recentAttendances, recentAssignments, recentGrades, recentPayments] = await Promise.all([
      // Recent attendance records
      prisma.attendance.findMany({
        where: {
          studentId: studentIdBigInt,
          deletedAt: null
        },
        orderBy: { date: 'desc' },
        take: 10,
        include: {
          class: {
            select: { name: true }
          }
        }
      }),
      
      // Recent assignments
      prisma.assignment.findMany({
        where: {
          class: {
            students: {
              some: {
                id: studentIdBigInt
              }
            }
          },
          deletedAt: null
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          class: { select: { name: true } },
          subject: { select: { name: true } },
          teacher: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      
      // Recent grades
      prisma.grade.findMany({
        where: {
          studentId: studentIdBigInt,
          deletedAt: null
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          subject: { select: { name: true } }
        }
      }),
      
      // Recent payments
      prisma.payment.findMany({
        where: {
          studentId: studentIdBigInt,
          deletedAt: null
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);
    
    // Format activities
    const activities = [];
    
    recentAttendances.forEach(attendance => {
      activities.push({
        type: 'ATTENDANCE',
        id: attendance.id.toString(),
        title: `Attendance: ${attendance.status}`,
        description: `Class: ${attendance.class?.name || 'Unknown'}`,
        date: attendance.date,
        status: attendance.status,
        createdAt: attendance.createdAt
      });
    });
    
    recentAssignments.forEach(assignment => {
      activities.push({
        type: 'ASSIGNMENT',
        id: assignment.id.toString(),
        title: assignment.title,
        description: `${assignment.subject?.name || 'Unknown Subject'} - ${assignment.class?.name || 'Unknown Class'}`,
        date: assignment.dueDate,
        status: assignment.status,
        createdAt: assignment.createdAt
      });
    });
    
    recentGrades.forEach(grade => {
      activities.push({
        type: 'GRADE',
        id: grade.id.toString(),
        title: `Grade: ${grade.score || grade.grade}`,
        description: `Subject: ${grade.subject?.name || 'Unknown'}`,
        date: grade.createdAt,
        score: grade.score,
        grade: grade.grade,
        createdAt: grade.createdAt
      });
    });
    
    recentPayments.forEach(payment => {
      activities.push({
        type: 'PAYMENT',
        id: payment.id.toString(),
        title: `Payment: ${payment.amount}`,
        description: payment.description || 'Fee payment',
        date: payment.paymentDate || payment.createdAt,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt
      });
    });
    
    // Sort by date (most recent first)
    activities.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    
    return activities.slice(0, 50); // Return top 50 activities
    
  } catch (error) {
    console.error('Error fetching student activities:', error);
    throw error;
  }
}

/**
 * Helper function to get activities for all accessible students
 */
async function getAllStudentActivities(user) {
  // This would need to be implemented based on user role and scope
  // For now, return empty array
  return [];
}

export default router;

