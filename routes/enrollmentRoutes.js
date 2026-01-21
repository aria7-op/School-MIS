import express from 'express';
import studentEnrollmentController from '../controllers/studentEnrollmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Enrollment Management Routes
router.post(
  '/enroll',
  authorize(['SCHOOL_ADMIN', 'SUPER_ADMIN']),
  studentEnrollmentController.enrollStudent
);

router.post(
  '/bulk-promote',
  authorize(['SCHOOL_ADMIN', 'SUPER_ADMIN']),
  studentEnrollmentController.bulkPromote
);

router.get(
  '/student/:studentId',
  authorize(['SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER']),
  studentEnrollmentController.getEnrollmentHistory
);

router.get(
  '/student/:studentId/active',
  authorize(['SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER']),
  studentEnrollmentController.getActiveEnrollment
);

router.get(
  '/session/:sessionId',
  authorize(['SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER']),
  studentEnrollmentController.getEnrollmentsBySession
);

router.put(
  '/:id/update',
  authorize(['SCHOOL_ADMIN', 'SUPER_ADMIN']),
  studentEnrollmentController.updateEnrollment
);

router.get(
  '/pending-promotions',
  authorize(['SCHOOL_ADMIN', 'SUPER_ADMIN']),
  studentEnrollmentController.getPendingPromotions
);

router.get(
  '/stats/:sessionId',
  authorize(['SCHOOL_ADMIN', 'SUPER_ADMIN']),
  studentEnrollmentController.getAcademicYearStats
);

// Academic Year Management Routes
router.post(
  '/academic-year/initialize',
  authorize(['SCHOOL_ADMIN', 'SUPER_ADMIN']),
  studentEnrollmentController.initializeAcademicYear
);

router.put(
  '/academic-year/set-current',
  authorize(['SCHOOL_ADMIN', 'SUPER_ADMIN']),
  studentEnrollmentController.setCurrentSession
);

router.post(
  '/academic-year/:sessionId/close',
  authorize(['SCHOOL_ADMIN', 'SUPER_ADMIN']),
  studentEnrollmentController.closeAcademicYear
);

router.get(
  '/academic-year/sessions',
  authorize(['SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER']),
  studentEnrollmentController.getAcademicSessions
);

router.get(
  '/suggest-next-class/:classId',
  authorize(['SCHOOL_ADMIN', 'SUPER_ADMIN']),
  studentEnrollmentController.suggestNextClass
);

router.delete(
  '/remove-from-course',
  authorize(['SCHOOL_ADMIN', 'SUPER_ADMIN']),
  studentEnrollmentController.removeStudentFromCourse
);

router.post(
  '/academic-year/clone-fees',
  authorize(['SCHOOL_ADMIN', 'SUPER_ADMIN']),
  studentEnrollmentController.cloneFeeStructures
);

export default router;










