import express from 'express';
const router = express.Router();
import libraryController from '../controllers/libraryController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { requirePackageFeature } from '../middleware/packageLimits.js';

import {
  validateBookData,
  validateBookIssueData,
  validateReservationData,
  validateReviewData,
} from '../utils/libraryUtils';

router.use(authenticateToken);
router.use(
  requirePackageFeature('library', {
    userMessage: 'Library resources are not available right now. Please contact your administrator.',
  }),
);

// Book CRUD routes
router.post('/books', authenticateToken, authorizeRoles(['LIBRARIAN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), libraryController.createBook);
router.get('/books', authenticateToken, libraryController.getBooks);
router.get('/books/:id', authenticateToken, libraryController.getBookById);
router.put('/books/:id', authenticateToken, authorizeRoles(['LIBRARIAN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), libraryController.updateBook);
router.delete('/books/:id', authenticateToken, authorizeRoles(['LIBRARIAN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), libraryController.deleteBook);

// Book issue and return routes
router.post('/books/issue', authenticateToken, authorizeRoles(['LIBRARIAN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), libraryController.issueBook);
router.patch('/books/return/:issueId', authenticateToken, authorizeRoles(['LIBRARIAN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), libraryController.returnBook);
router.patch('/books/extend/:issueId', authenticateToken, authorizeRoles(['LIBRARIAN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), libraryController.extendBook);

// Book reservation routes
router.post('/books/reservations', authenticateToken, libraryController.createReservation);
router.get('/books/reservations', authenticateToken, libraryController.getReservations);
router.patch('/books/reservations/:id/approve', authenticateToken, authorizeRoles(['LIBRARIAN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), libraryController.approveReservation);
router.patch('/books/reservations/:id/reject', authenticateToken, authorizeRoles(['LIBRARIAN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), libraryController.rejectReservation);

// Book review routes
router.post('/books/reviews', authenticateToken, libraryController.createReview);
router.get('/books/reviews', authenticateToken, libraryController.getReviews);
router.patch('/books/reviews/:id/approve', authenticateToken, authorizeRoles(['LIBRARIAN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), libraryController.approveReview);
router.patch('/books/reviews/:id/reject', authenticateToken, authorizeRoles(['LIBRARIAN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), libraryController.rejectReview);

// Search and recommendations
router.get('/books/search', authenticateToken, libraryController.searchBooks);
router.get('/books/recommendations', authenticateToken, libraryController.getBookRecommendations);

// Analytics and reporting
router.get('/analytics/summary', authenticateToken, libraryController.getLibraryAnalytics);
router.get('/report/generate', authenticateToken, authorizeRoles(['LIBRARIAN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), libraryController.generateLibraryReport);

// Student/Staff specific routes
router.get('/student/:studentId/books', authenticateToken, libraryController.getStudentBooks);
router.get('/staff/:staffId/books', authenticateToken, libraryController.getStaffBooks);
router.get('/overdue/list', authenticateToken, libraryController.getOverdueBooks);

// Dashboard routes
router.get('/dashboard/summary', authenticateToken, libraryController.getDashboardSummary);
router.get('/dashboard/recent-issues', authenticateToken, libraryController.getRecentIssues);
router.get('/dashboard/popular-books', authenticateToken, libraryController.getPopularBooks);

// Bulk operations
router.post('/books/bulk/import', authenticateToken, authorizeRoles(['LIBRARIAN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), libraryController.bulkImportBooks);
router.post('/books/bulk/update-status', authenticateToken, authorizeRoles(['LIBRARIAN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), libraryController.bulkUpdateBookStatus);

// Fine management
router.get('/fines/list', authenticateToken, libraryController.getFinesList);
router.patch('/fines/:issueId/pay', authenticateToken, libraryController.payFine);
router.patch('/fines/:issueId/waive', authenticateToken, authorizeRoles(['LIBRARIAN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), libraryController.waiveFine);

// Book maintenance
router.patch('/books/:id/maintenance', authenticateToken, authorizeRoles(['LIBRARIAN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), libraryController.setBookMaintenance);
router.patch('/books/:id/retire', authenticateToken, authorizeRoles(['LIBRARIAN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), libraryController.retireBook);

export default router; 