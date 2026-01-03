import express from 'express';
import AssignmentController from '../controllers/assignmentController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimit.js';
import { enforceStorageLimit } from '../middleware/packageLimits.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Initialize controller
const assignmentController = new AssignmentController();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/assignments/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Allow specific file types
    const allowedTypes = [
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        // Images
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        // Audio
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        // Video
        'video/mp4',
        'video/webm',
        'video/ogg',
        // Archives
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('File type not allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
        files: 10 // Max 10 files
    }
});

const computeUploadedBytes = (req) =>
    (Array.isArray(req.files) ? req.files : []).reduce((total, file) => total + (file.size || 0), 0);

const enforceAssignmentStorageLimit = enforceStorageLimit({
    byteCounter: (req) => computeUploadedBytes(req),
});

// Apply rate limiting to all routes
router.use(rateLimiter);

// Apply authentication to all routes
router.use(authenticateToken);

// Debug endpoint to check user status
router.get('/debug/user-status', (req, res) => {
    console.log('=== USER STATUS DEBUG ===');
    console.log('User:', req.user);
    console.log('User Role:', req.user?.role);
    console.log('School ID:', req.user?.schoolId);
    
    res.json({
        success: true,
        data: {
            user: req.user,
            role: req.user?.role,
            schoolId: req.user?.schoolId,
            hasUser: !!req.user
        }
    });
});

// Debug endpoint to check parent's students
router.get('/debug/parent-students', 
    authorizeRoles(['PARENT']),
    async (req, res) => {
        try {
            const { PrismaClient } = await import('../generated/prisma/index.js');
            const prisma = new PrismaClient();
            
            const parent = await prisma.parent.findFirst({
                where: {
                    userId: BigInt(req.user.id),
                    schoolId: BigInt(req.user.schoolId)
                },
                include: {
                    students: {
                        include: {
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
            
            console.log('=== PARENT STUDENTS DEBUG ===');
            console.log('Parent:', parent);
            
            res.json({
                success: true,
                data: {
                    parent: parent,
                    studentCount: parent?.students?.length || 0,
                    students: parent?.students || []
                }
            });
        } catch (error) {
            console.error('Debug error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Debug endpoint to check assignment details
router.get('/debug/assignment/:id', 
    authorizeRoles(['PARENT']),
    async (req, res) => {
        try {
            const { PrismaClient } = await import('../generated/prisma/index.js');
            const prisma = new PrismaClient();
            
            const assignment = await prisma.assignment.findFirst({
                where: {
                    id: BigInt(req.params.id),
                    schoolId: BigInt(req.user.schoolId),
                    deletedAt: null
                },
                include: {
                    class: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    },
                    subject: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    },
                    teacher: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true
                        }
                    }
                }
            });
            
            console.log('=== ASSIGNMENT DEBUG ===');
            console.log('Assignment:', assignment);
            console.log('Assignment classId:', assignment?.classId);
            console.log('Assignment schoolId:', assignment?.schoolId);
            
            res.json({
                success: true,
                data: {
                    assignment: assignment,
                    exists: !!assignment,
                    classId: assignment?.classId,
                    schoolId: assignment?.schoolId,
                    hasClassId: !!assignment?.classId
                }
            });
        } catch (error) {
            console.error('Debug error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Debug endpoint to check access logic step by step
router.get('/debug/access-check/:id', 
    authorizeRoles(['PARENT']),
    async (req, res) => {
        try {
            const { PrismaClient } = await import('../generated/prisma/index.js');
            const prisma = new PrismaClient();
            
            console.log('=== ACCESS CHECK DEBUG ===');
            console.log('User ID:', req.user.id);
            console.log('School ID:', req.user.schoolId);
            console.log('Assignment ID:', req.params.id);
            
            // Step 1: Check if parent exists
            const parent = await prisma.parent.findFirst({
                where: {
                    userId: BigInt(req.user.id),
                    schoolId: BigInt(req.user.schoolId)
                },
                include: {
                    students: {
                        include: {
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
            
            console.log('Parent found:', !!parent);
            console.log('Parent students count:', parent?.students?.length || 0);
            
            if (!parent) {
                return res.json({
                    success: false,
                    step: 'parent_check',
                    message: 'Parent not found',
                    data: { parentExists: false }
                });
            }
            
            // Step 2: Get student class IDs
            const studentClassIds = parent.students
                .filter(student => student.classId)
                .map(student => student.classId);
                
            console.log('Student class IDs:', studentClassIds);
            
            // Step 3: Check if assignment exists
            const assignment = await prisma.assignment.findFirst({
                where: {
                    id: BigInt(req.params.id),
                    schoolId: BigInt(req.user.schoolId),
                    deletedAt: null
                }
            });
            
            console.log('Assignment found:', !!assignment);
            console.log('Assignment classId:', assignment?.classId);
            
            if (!assignment) {
                return res.json({
                    success: false,
                    step: 'assignment_check',
                    message: 'Assignment not found',
                    data: { 
                        assignmentExists: false,
                        studentClassIds: studentClassIds
                    }
                });
            }
            
            // Step 4: Check if assignment class matches student classes
            const hasAccess = studentClassIds.includes(assignment.classId);
            
            console.log('Has access:', hasAccess);
            console.log('Assignment classId in student classes:', hasAccess);
            
            res.json({
                success: true,
                data: {
                    parentExists: true,
                    assignmentExists: true,
                    studentClassIds: studentClassIds,
                    assignmentClassId: assignment.classId,
                    hasAccess: hasAccess,
                    accessGranted: hasAccess,
                    parent: {
                        id: parent.id,
                        students: parent.students.map(s => ({
                            id: s.id,
                            name: s.user?.displayName || 'Unknown',
                            classId: s.classId,
                            className: s.class?.name || 'Unknown'
                        }))
                    },
                    assignment: {
                        id: assignment.id,
                        title: assignment.title,
                        classId: assignment.classId
                    }
                }
            });
            
        } catch (error) {
            console.error('Debug error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Debug endpoint to check class assignments
router.get('/debug/class-assignments', 
    authorizeRoles(['PARENT']),
    async (req, res) => {
        try {
            const { PrismaClient } = await import('../generated/prisma/index.js');
            const prisma = new PrismaClient();
            
            // Get parent's students
            const parent = await prisma.parent.findFirst({
                where: {
                    userId: BigInt(req.user.id),
                    schoolId: BigInt(req.user.schoolId)
                },
                include: {
                    students: {
                        include: {
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
                return res.json({
                    success: false,
                    message: 'Parent not found'
                });
            }
            
            // Get all assignments for the parent's students' classes
            const studentClassIds = parent.students
                .filter(student => student.classId)
                .map(student => student.classId);
            
            const assignments = await prisma.assignment.findMany({
                where: {
                    schoolId: BigInt(req.user.schoolId),
                    deletedAt: null,
                    classId: {
                        in: studentClassIds
                    }
                },
                include: {
                    class: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    },
                    subject: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            
            res.json({
                success: true,
                data: {
                    parent: {
                        id: parent.id,
                        students: parent.students.map(s => ({
                            id: s.id,
                            name: s.user?.displayName || 'Unknown',
                            classId: s.classId,
                            className: s.class?.name || 'Unknown'
                        }))
                    },
                    studentClassIds: studentClassIds,
                    assignments: assignments.map(a => ({
                        id: a.id,
                        title: a.title,
                        classId: a.classId,
                        className: a.class?.name || 'Unknown',
                        subjectName: a.subject?.name || 'Unknown',
                        dueDate: a.dueDate,
                        status: a.status
                    }))
                }
            });
            
        } catch (error) {
            console.error('Debug error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Debug middleware to log all requests
router.use((req, res, next) => {
    if (req.url.includes('/status')) {
        console.log('Assignments route debug:', { 
            method: req.method, 
            url: req.url, 
            originalUrl: req.originalUrl,
            path: req.path,
            params: req.params,
            body: req.body 
        });
    }
    next();
});

// ========================================
// Integrated Assignment Operations
// ========================================

/**
 * @route   POST /api/assignments/with-attachments
 * @desc    Create assignment with attachments in one API call
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER)
 */
router.post('/with-attachments',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
    async (req, res) => {
        await assignmentController.createAssignmentWithAttachments(req, res);
    }
);

/**
 * @route   POST /api/assignments/upload-with-files
 * @desc    Upload assignment with file attachments
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER)
 */
router.post('/upload-with-files',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
    upload.array('files', 10),
    enforceAssignmentStorageLimit,
    async (req, res) => {
        await assignmentController.uploadAssignmentWithFiles(req, res);
    }
);

/**
 * @route   POST /api/assignments/:id/submit-with-attachments
 * @desc    Submit assignment with attachments
 * @access  Private (STUDENT)
 */
router.post('/:id/submit-with-attachments',
    authorizeRoles(['STUDENT']),
    async (req, res) => {
        await assignmentController.submitAssignmentWithAttachments(req, res);
    }
);

/**
 * @route   POST /api/assignments/:id/upload-submission-with-files
 * @desc    Upload assignment submission with files
 * @access  Private (STUDENT)
 */
router.post('/:id/upload-submission-with-files',
    authorizeRoles(['STUDENT']),
    upload.array('files', 10),
    enforceAssignmentStorageLimit,
    async (req, res) => {
        await assignmentController.uploadAssignmentSubmissionWithFiles(req, res);
    }
);

/**
 * @route   GET /api/assignments/:id/details
 * @desc    Get comprehensive assignment details with attachments and submissions
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, PARENT)
 */
router.get('/:id/details',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
    async (req, res) => {
        await assignmentController.getAssignmentDetails(req, res);
    }
);

/**
 * @route   GET /api/assignments/dashboard
 * @desc    Get assignment dashboard with integrated data
 * @access  Private (ADMIN, TEACHER, STUDENT, PARENT)
 */
router.get('/dashboard',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
    async (req, res) => {
        await assignmentController.getAssignmentDashboard(req, res);
    }
);

/**
 * @route   GET /api/assignments/analytics/integrated
 * @desc    Get integrated assignment analytics
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER)
 */
router.get('/analytics/integrated',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
    async (req, res) => {
        await assignmentController.getIntegratedAssignmentAnalytics(req, res);
    }
);

/**
 * @route   POST /api/assignments/bulk/with-attachments
 * @desc    Bulk create assignments with attachments
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER)
 */
router.post('/bulk/with-attachments',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
    async (req, res) => {
        await assignmentController.createBulkAssignmentsWithAttachments(req, res);
    }
);

// ========================================
// Standard Assignment CRUD Operations
// ========================================

/**
 * @route   POST /api/assignments
 * @desc    Create new assignment (with optional file support)
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER)
 */
router.post('/',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
    upload.array('files', 10),
    enforceAssignmentStorageLimit,
    async (req, res) => {
        await assignmentController.createAssignment(req, res);
    }
);

/**
 * @route   GET /api/assignments
 * @desc    Get all assignments with filtering
 * @access  Private (ADMIN, TEACHER, STUDENT, PARENT)
 */
router.get('/',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
    async (req, res) => {
        await assignmentController.getAllAssignments(req, res);
    }
);

/**
 * @route   GET /api/assignments/parent
 * @desc    Get assignments for parent with view/acknowledgment status
 * @access  Private (PARENT)
 */
router.get('/parent',
    authorizeRoles(['PARENT']),
    async (req, res) => {
        await assignmentController.getParentAssignments(req, res);
    }
);

/**
 * @route   GET /api/assignments/student
 * @desc    Get assignments for student with proper class filtering
 * @access  Private (STUDENT)
 */
router.get('/student',
    authorizeRoles(['STUDENT']),
    async (req, res) => {
        await assignmentController.getStudentAssignments(req, res);
    }
);

/**
 * @route   PATCH /api/assignments/:id/status
 * @desc    Update assignment status
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER)
 */
router.patch('/:id/status',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
    async (req, res) => {
        console.log('Status route hit:', { method: req.method, url: req.url, body: req.body });
        await assignmentController.updateAssignmentStatus(req, res);
    }
);

/**
 * @route   GET /api/assignments/analytics
 * @desc    Get assignment analytics
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER)
 */
router.get('/analytics',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
    async (req, res) => {
        await assignmentController.getAssignmentAnalytics(req, res);
    }
);

/**
 * @route   GET /api/assignments/submissions
 * @desc    Get submissions with filtering (scoped)
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER)
 */
router.get('/submissions',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
    async (req, res) => {
        await assignmentController.listAssignmentSubmissions(req, res);
    }
);

/**
 * @route   GET /api/assignments/teacher
 * @desc    Get assignments for current or specified teacher (query)
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER)
 */
router.get('/teacher',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
    async (req, res) => {
        const resolvedTeacherId =
            req.query?.teacherId ??
            req.user?.teacherId ??
            req.user?.id ??
            null;

        if (resolvedTeacherId) {
            req.params = { ...(req.params || {}), teacherId: resolvedTeacherId.toString() };
        }

        await assignmentController.getAssignmentsByTeacher(req, res);
    }
);

/**
 * @route   GET /api/assignments/teacher/:teacherId
 * @desc    Get assignments by teacher
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER)
 */
router.get('/teacher/:teacherId',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
    async (req, res) => {
        await assignmentController.getAssignmentsByTeacher(req, res);
    }
);

/**
 * @route   GET /api/assignments/:id
 * @desc    Get assignment by ID
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, PARENT)
 */
router.get('/:id',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
    async (req, res) => {
        await assignmentController.getAssignmentById(req, res);
    }
);

/**
 * @route   PUT /api/assignments/:id
 * @desc    Update assignment (with optional file support)
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER)
 */
router.put('/:id',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
    upload.array('files', 10),
    enforceAssignmentStorageLimit,
    async (req, res) => {
        await assignmentController.updateAssignment(req, res);
    }
);

/**
 * @route   DELETE /api/assignments/:id
 * @desc    Delete assignment
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER)
 */
router.delete('/:id',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
    async (req, res) => {
        await assignmentController.deleteAssignment(req, res);
    }
);

// ========================================
// Bulk Operations
// ========================================

/**
 * @route   POST /api/assignments/bulk/create
 * @desc    Bulk create assignments
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER)
 */
router.post('/bulk/create',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
    async (req, res) => {
        await assignmentController.createBulkAssignments(req, res);
    }
);

/**
 * @route   POST /api/assignments/bulk/update
 * @desc    Bulk update assignments
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER)
 */
router.post('/bulk/update',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
    async (req, res) => {
        await assignmentController.bulkUpdateAssignments(req, res);
    }
);

/**
 * @route   POST /api/assignments/bulk/delete
 * @desc    Bulk delete assignments
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER)
 */
router.post('/bulk/delete',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
    async (req, res) => {
        await assignmentController.bulkDeleteAssignments(req, res);
    }
);

// ========================================
// Role-specific Operations
// ========================================

/**
 * @route   GET /api/assignments/class/:classId
 * @desc    Get assignments by class
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, PARENT)
 */
router.get('/class/:classId',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
    async (req, res) => {
        await assignmentController.getAssignmentsByClass(req, res);
    }
);

/**
 * @route   GET /api/assignments/subject/:subjectId
 * @desc    Get assignments by subject
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, PARENT)
 */
router.get('/subject/:subjectId',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
    async (req, res) => {
        await assignmentController.getAssignmentsBySubject(req, res);
    }
);

/**
 * @route   GET /api/assignments/student/:studentId
 * @desc    Get assignments for a specific student
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER, PARENT)
 */
router.get('/student/:studentId',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT']),
    async (req, res) => {
        await assignmentController.getStudentAssignments(req, res);
    }
);

/**
 * @route   GET /api/assignments/my-assignments
 * @desc    Get current user's assignments (teacher)
 * @access  Private (TEACHER)
 */
router.get('/my-assignments',
    authorizeRoles(['TEACHER']),
    async (req, res) => {
        await assignmentController.getMyAssignments(req, res);
    }
);

/**
 * @route   GET /api/assignments/my-class-assignments
 * @desc    Get assignments for current user's class (student)
 * @access  Private (STUDENT)
 */
router.get('/my-class-assignments',
    authorizeRoles(['STUDENT']),
    async (req, res) => {
        await assignmentController.getMyClassAssignments(req, res);
    }
);

// ========================================
// Analytics and Reporting
// ========================================


/**
 * @route   GET /api/assignments/statistics
 * @desc    Get assignment statistics
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER)
 */
router.get('/statistics',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
    async (req, res) => {
        await assignmentController.getAssignmentStatistics(req, res);
    }
);

// ========================================
// Search and Filtering
// ========================================

/**
 * @route   GET /api/assignments/search
 * @desc    Search assignments
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, PARENT)
 */
router.get('/search',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
    async (req, res) => {
        await assignmentController.searchAssignments(req, res);
    }
);

/**
 * @route   GET /api/assignments/overdue
 * @desc    Get overdue assignments
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, PARENT)
 */
router.get('/overdue',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
    async (req, res) => {
        await assignmentController.getOverdueAssignments(req, res);
    }
);

/**
 * @route   GET /api/assignments/upcoming
 * @desc    Get upcoming assignments
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, PARENT)
 */
router.get('/upcoming',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
    async (req, res) => {
        await assignmentController.getUpcomingAssignments(req, res);
    }
);

// ========================================
// Parent Interaction Endpoints
// ========================================

/**
 * @route   POST /api/assignments/:id/notify-parents
 * @desc    Notify parents about an assignment
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER)
 */
router.post('/:id/notify-parents',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
    async (req, res) => {
        await assignmentController.notifyParents(req, res);
    }
);

/**
 * @route   POST /api/assignments/:id/mark-seen
 * @desc    Mark assignment as seen by parent
 * @access  Private (PARENT)
 */
router.post('/:id/mark-seen',
    authorizeRoles(['PARENT']),
    async (req, res) => {
        console.log('=== MARK SEEN ROUTE HIT ===');
        console.log('User:', req.user);
        console.log('Assignment ID:', req.params.id);
        await assignmentController.markAsSeenByParent(req, res);
    }
);

/**
 * @route   POST /api/assignments/:id/acknowledge
 * @desc    Acknowledge assignment by parent
 * @access  Private (PARENT)
 */
router.post('/:id/acknowledge',
    authorizeRoles(['PARENT']),
    async (req, res) => {
        await assignmentController.acknowledgeByParent(req, res);
    }
);

/**
 * @route   GET /api/assignments/:id/parent-views
 * @desc    Get parent view statistics for assignment
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER)
 */
router.get('/:id/parent-views',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
    async (req, res) => {
        await assignmentController.getParentViews(req, res);
    }
);

/**
 * @route   GET /api/assignments/:id/parent-notes
 * @desc    Get parent notes for an assignment
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER, PARENT, SUPER_ADMIN, OWNER)
 */
router.get('/:id/parent-notes',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'SUPER_ADMIN', 'OWNER']),
    async (req, res) => {
        await assignmentController.getParentNotes(req, res);
    }
);

/**
 * @route   POST /api/assignments/parent-notes/:noteId/respond
 * @desc    Respond to a parent note
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER, SUPER_ADMIN, OWNER)
 */
router.post('/parent-notes/:noteId/respond',
    authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'SUPER_ADMIN', 'OWNER']),
    async (req, res) => {
        await assignmentController.respondToParentNote(req, res);
    }
);

// ========================================
// Error Handling Middleware
// ========================================

// Handle multer errors
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 100MB per file.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files uploaded. Maximum is 10 files.'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected file field.'
            });
        }
    }

    if (error.message === 'File type not allowed') {
        return res.status(400).json({
            success: false,
            message: 'File type not allowed. Please upload a valid file type.'
        });
    }

    next(error);
});

export default router;