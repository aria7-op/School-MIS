import prisma from '../utils/prismaClient.js';
import { setAuditContext, appendAuditMetadata } from '../middleware/audit.js';
import {
  resolveManagedScope,
  normalizeScopeWithSchool,
  toBigIntSafe,
  applyScopeToWhere
} from '../utils/contextScope.js';
import {
  getTenantContextForSchool,
  countStudentsForSchool,
  updateSubscriptionUsage,
  calculateUsageSnapshot,
} from '../services/subscriptionService.js';
import path from 'path';
import {
  handlePrismaError,
  createSuccessResponse,
  createErrorResponse
} from '../utils/responseUtils.js';
import bcrypt from 'bcryptjs';
import {
  generateStudentCode,
  validateStudentConstraints,
  buildStudentSearchQuery,
  buildStudentIncludeQuery,
  generateStudentStats,
  generateStudentAnalytics,
  calculateStudentPerformance,
  generateStudentExportData,
  validateStudentImportData,
  generateStudentCodeSuggestions,
  getStudentCountByClass,
  getStudentCountByStatus,
  transformFormDataToBackend,
  transformBackendDataToForm
} from '../utils/studentUtils.js';
import {
  setStudentInCache,
  getStudentFromCache,
  setStudentListInCache,
  getStudentListFromCache,
  setStudentSearchInCache,
  getStudentSearchFromCache,
  setStudentStatsInCache,
  getStudentStatsFromCache,
  setStudentAnalyticsInCache,
  getStudentAnalyticsFromCache,
  setStudentPerformanceInCache,
  getStudentPerformanceFromCache,
  invalidateStudentCacheOnCreate,
  invalidateStudentCacheOnUpdate,
  invalidateStudentCacheOnDelete,
  invalidateStudentCacheOnBulkOperation,
  getStudentCacheStats,
  warmStudentCache
} from '../cache/studentCache.js';
import {
  createAuditLog
} from '../middleware/audit.js';
import {
  triggerEntityCreatedNotifications,
  triggerEntityUpdatedNotifications
} from '../utils/notificationTriggers.js';
import { createNotification, createStudentNotification } from '../services/notificationService.js';
import notificationHelpers from '../utils/notificationHelpers.js';
import EnrollmentService from '../services/enrollmentService.js';

const enrollmentService = new EnrollmentService();
import {
  validateSchoolAccess,
  validateClassAccess
} from '../middleware/validation.js';
import StudentEventService from '../services/studentEventService.js';
import ParentService from '../services/parentService.js';

const roleAllowsDetailedLimitMessage = (role) =>
  ['SUPER_ADMIN', 'SUPER_DUPER_ADMIN'].includes((role || '').toUpperCase());

// Utility function to convert BigInt values to strings for JSON serialization
function convertBigInts(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  // Handle Prisma Decimal type (both before and after JSON serialization)
  if (obj && typeof obj === 'object') {
    // Check if it's a Decimal object by constructor name
    if (obj.constructor && obj.constructor.name === 'Decimal') {
      return parseFloat(obj.toString());
    }
    // Check if it's a serialized Decimal object (has s, e, d properties)
    if (obj.d && Array.isArray(obj.d) && typeof obj.s === 'number' && typeof obj.e === 'number') {
      // Prisma Decimal format: { s: sign, e: exponent, d: [digits] }
      // The exponent 'e' represents the position of the decimal point
      // For whole numbers, use the value directly from d[0]
      const value = obj.d[0] || 0;
      return obj.s === -1 ? -value : value;
    }
    // Additional check: if object has toNumber method (some Decimal implementations)
    if (typeof obj.toNumber === 'function') {
      return obj.toNumber();
    }
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

const appendAndClause = (existing, clause) => {
  if (!existing) return [clause];
  if (Array.isArray(existing)) return [...existing, clause];
  return [existing, clause];
};

const fetchScopedStudentIds = async (scope) => {
  if (
    !scope ||
    (scope.schoolId === null || scope.schoolId === undefined) &&
    (scope.branchId === null || scope.branchId === undefined) &&
    (scope.courseId === null || scope.courseId === undefined)
  ) {
    return null;
  }

  const filters = ['`deletedAt` IS NULL'];
  const params = [];

  if (scope.schoolId !== null && scope.schoolId !== undefined) {
    filters.push('`schoolId` = ?');
    params.push(scope.schoolId.toString());
  }
  if (scope.branchId !== null && scope.branchId !== undefined) {
    filters.push('`branchId` = ?');
    params.push(scope.branchId.toString());
  }
  if (scope.courseId !== null && scope.courseId !== undefined) {
    filters.push('`courseId` = ?');
    params.push(scope.courseId.toString());
  }

  if (params.length === 0) {
    return null;
  }

  const sql = `SELECT id FROM students WHERE ${filters.join(' AND ')}`;
  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return rows.map((row) => (typeof row.id === 'bigint' ? row.id : BigInt(row.id)));
};

const ensureScopedStudentWhere = async (scope, baseWhere = {}) => {
  const where = { ...baseWhere };

  if (scope && scope.schoolId !== null && scope.schoolId !== undefined) {
    where.schoolId = BigInt(scope.schoolId);
  }

  const scopedIds = await fetchScopedStudentIds(scope);
  if (!scopedIds) {
    return { where, empty: false };
  }

  if (scopedIds.length === 0) {
    const scopedClause = { id: { in: [] } };
    where.AND = appendAndClause(where.AND, scopedClause);
    return { where, empty: true };
  }

  const scopedClause = { id: { in: scopedIds } };
  where.AND = appendAndClause(where.AND, scopedClause);
  return { where, empty: false };
};

const combineStudentWhere = (baseWhere = {}, extraWhere = {}) => {
  const hasBase = baseWhere && Object.keys(baseWhere).length > 0;
  const hasExtra = extraWhere && Object.keys(extraWhere).length > 0;
  if (hasBase && hasExtra) {
    return { AND: [baseWhere, extraWhere] };
  }
  if (hasExtra) return extraWhere;
  return baseWhere;
};

const verifyStudentInScope = async (studentId, scope) => {
  if (!scope) return true;

  const filters = ['`id` = ?', '`deletedAt` IS NULL'];
  const params = [studentId.toString()];

  if (scope.schoolId !== null && scope.schoolId !== undefined) {
    filters.push('`schoolId` = ?');
    params.push(scope.schoolId.toString());
  }
  if (scope.branchId !== null && scope.branchId !== undefined) {
    filters.push('`branchId` = ?');
    params.push(scope.branchId.toString());
  }
  if (scope.courseId !== null && scope.courseId !== undefined) {
    filters.push('`courseId` = ?');
    params.push(scope.courseId.toString());
  }

  const sql = `SELECT id FROM students WHERE ${filters.join(' AND ')}`;
  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return rows.length > 0;
};

class StudentController {
  // ======================
  // CRUD OPERATIONS
  // ======================

  /**
   * Create a new student
   */
  async createStudent(req, res) {
    try {
      console.log('🔍 ===== STUDENT CREATION STARTED =====');
      console.log('🔍 Request body type:', typeof req.body);
      console.log('🔍 Request body keys:', Object.keys(req.body || {}));
      console.log('🔍 Full request body:', JSON.stringify(req.body, null, 2));
      console.log('🔍 Request body user field:', req.body?.user);
      console.log('🔍 Request body parent field:', req.body?.parent);
      console.log('🔍 Request body cardNo field:', req.body?.cardNo);

      // Transform form data structure to backend format if needed
      let studentData = req.body;
      if (studentData.student && studentData.student.personalInfo) {
        console.log('🔍 Detected form structure, transforming to backend format...');
        studentData = transformFormDataToBackend(studentData);
        console.log('🔍 Transformed data:', JSON.stringify(studentData, null, 2));
      }
      let { schoolId, classId, class: className } = studentData;

      // Remove class field from studentData to avoid Prisma errors
      if (className && 'class' in studentData) {
        delete studentData.class;
      }

      // SCOPE FIX: Get branchId and courseId from managed scope
      const scope = await resolveManagedScope(req);
      console.log('🔍 Resolved managed scope:', scope);

      let branchId = scope.branchId ? Number(scope.branchId) : null;
      let courseId = scope.courseId ? Number(scope.courseId) : null;

      // If schoolId is not provided in request body, get it from user context or use default
      if (!schoolId) {
        // First try to get from scope
        if (scope.schoolId) {
          schoolId = Number(scope.schoolId);
          console.log('🔍 Using schoolId from managed scope:', schoolId);
        } else if (req.user) {
          // Authenticated user - use their school context
          if (req.user.type === 'owner' || req.user.role === 'SUPER_ADMIN') {
            // For owners, use the first school or require schoolId in request
            schoolId = req.user.schoolId || req.user.schoolIds?.[0];
            if (!schoolId) {
              return createErrorResponse(res, 400, 'School ID is required for student creation');
            }
          } else {
            // For regular users, use their school
            schoolId = req.user.schoolId;
            if (!schoolId) {
              return createErrorResponse(res, 400, 'User does not have an associated school');
            }
          }
          // Validate school access for authenticated users
          await validateSchoolAccess(req.user, schoolId);
        } else {
          // No authentication - use default school ID (1) or require it in request
          schoolId = schoolId || 1; // Default to school ID 1
          console.log('🔍 No authentication - using default school ID:', schoolId);
        }
      }

      console.log('🔍 Final scope for student creation:', { schoolId, branchId, courseId });

      if (schoolId) {
        try {
          const tenantContext = await getTenantContextForSchool(schoolId);
          const maxStudents = tenantContext?.limits?.maxStudents;
          if (maxStudents !== null && maxStudents !== undefined) {
            const currentCount = await countStudentsForSchool(schoolId);
            if (Number(currentCount) + 1 > Number(maxStudents)) {
              const canViewDetails = roleAllowsDetailedLimitMessage(user?.role);
              const friendlyMessage =
                'Student enrollment is currently unavailable. Please contact your administrator.';
              const detailedMessage =
                'Student limit reached for your current subscription. Please upgrade your plan to add more students.';

              const payload = {
                success: false,
                error: canViewDetails ? 'STUDENT_LIMIT_REACHED' : 'ACTION_UNAVAILABLE',
                message: canViewDetails ? detailedMessage : friendlyMessage,
              };

              if (canViewDetails) {
                payload.meta = {
                  schoolId,
                  currentCount,
                  maxStudents,
                };
              }

              return res.status(403).json(payload);
            }
          }
        } catch (limitError) {
          console.warn('⚠️ Failed to enforce student package limit:', limitError);
        }
      }

      // Handle class name to ID conversion if class name is provided
      if (className && !classId && schoolId) {
        console.log('🔍 Converting class name to classId:', className);
        // Try to find class by name in the school
        const classRecord = await prisma.class.findFirst({
          where: {
            name: {
              contains: className,
              mode: 'insensitive'
            },
            schoolId: BigInt(schoolId),
            deletedAt: null
          }
        });

        if (classRecord) {
          classId = Number(classRecord.id);
          console.log('🔍 Found class ID:', classId, 'for class name:', className);
        } else {
          console.warn('⚠️ Class not found by name:', className, 'for school:', schoolId);
        }
      }

      // Validate class access if provided (only for authenticated users)
      if (classId && req.user) {
        await validateClassAccess(req.user, classId, schoolId);
      }

      // Generate student code
      const studentCode = await generateStudentCode(
        studentData.admissionNo || studentData.user?.firstName,
        schoolId
      );

      // Validate student constraints
      await validateStudentConstraints(schoolId, studentCode, classId);

      // Remove classId and schoolId from studentData to avoid Prisma validation error
      const { classId: _, schoolId: __, ...studentDataWithoutRelations } = studentData;

      console.log('🔍 DEBUG: studentDataWithoutRelations keys:', Object.keys(studentDataWithoutRelations));
      console.log('🔍 DEBUG: studentDataWithoutRelations.cardNo:', studentDataWithoutRelations.cardNo);
      console.log('🔍 DEBUG: studentDataWithoutRelations.rollNo:', studentDataWithoutRelations.rollNo);
      console.log('🔍 DEBUG: studentDataWithoutRelations.admissionNo:', studentDataWithoutRelations.admissionNo);

      // Validate that user data exists
      if (!studentData.user) {
        return res.status(400).json({
          success: false,
          message: 'User data is required for student creation',
          error: 'MISSING_USER_DATA'
        });
      }

      // Remove dateOfBirth from user data and map to birthDate
      const { dateOfBirth, ...userDataWithoutDateOfBirth } = studentData.user;

      // Extract address fields and extra tazkira fields - move to metadata
      const {
        address, city, state, country, postalCode,
        tazkiraVolume, tazkiraPage, tazkiraRecord, fatherName,
        ...userDataWithoutAddress
      } = userDataWithoutDateOfBirth;

      // Create metadata object with address information (only include defined values)
      // Build comprehensive user metadata for fields that don't have direct columns
      const userMetadata = {};

      // Store address in metadata
      if (address || city || state || country || postalCode) {
        userMetadata.address = {};
        if (address) userMetadata.address.street = address;
        if (city) userMetadata.address.city = city;
        if (state) userMetadata.address.state = state;
        if (country) userMetadata.address.country = country;
        if (postalCode) userMetadata.address.postalCode = postalCode;
      }

      // Store paper tazkira extra fields in metadata (volume, page, record)
      if (studentData.user?.tazkiraVolume || studentData.user?.tazkiraPage || studentData.user?.tazkiraRecord) {
        userMetadata.tazkira = {
          volume: studentData.user.tazkiraVolume,
          page: studentData.user.tazkiraPage,
          record: studentData.user.tazkiraRecord
        };
      }

      // Store relatives information in user metadata if provided
      if (studentData.relatives) {
        userMetadata.relatives = {
          fatherUncles: studentData.relatives.fatherUncles || [],
          fatherCousins: studentData.relatives.fatherCousins || [],
          motherUncles: studentData.relatives.motherUncles || [],
          motherCousins: studentData.relatives.motherCousins || []
        };
        console.log('🔍 Saving relatives in user metadata:', userMetadata.relatives);
      }

      // Remove invalid fields that don't exist in Prisma schema
      const {
        originDistrict,
        currentDistrict,
        relatives, // Remove relatives - already stored in user metadata
        ...studentDataWithoutInvalidFields
      } = studentDataWithoutRelations;

      // Convert date strings to Date objects for Prisma
      const processedStudentData = {
        ...studentDataWithoutInvalidFields,
        // Convert admissionDate to Date object if it exists
        ...(studentDataWithoutInvalidFields.admissionDate && {
          admissionDate: new Date(studentDataWithoutInvalidFields.admissionDate)
        }),
        // Include origin address fields (only valid ones)
        ...(studentDataWithoutInvalidFields.originAddress && { originAddress: studentDataWithoutInvalidFields.originAddress }),
        ...(studentDataWithoutInvalidFields.originCity && { originCity: studentDataWithoutInvalidFields.originCity }),
        ...(studentDataWithoutInvalidFields.originState && { originState: studentDataWithoutInvalidFields.originState }),
        ...(studentDataWithoutInvalidFields.originProvince && { originProvince: studentDataWithoutInvalidFields.originProvince }),
        ...(studentDataWithoutInvalidFields.originCountry && { originCountry: studentDataWithoutInvalidFields.originCountry }),
        ...(studentDataWithoutInvalidFields.originPostalCode && { originPostalCode: studentDataWithoutInvalidFields.originPostalCode }),
        // Include current residence address fields (only valid ones)
        ...(studentDataWithoutInvalidFields.currentAddress && { currentAddress: studentDataWithoutInvalidFields.currentAddress }),
        ...(studentDataWithoutInvalidFields.currentCity && { currentCity: studentDataWithoutInvalidFields.currentCity }),
        ...(studentDataWithoutInvalidFields.currentState && { currentState: studentDataWithoutInvalidFields.currentState }),
        ...(studentDataWithoutInvalidFields.currentProvince && { currentProvince: studentDataWithoutInvalidFields.currentProvince }),
        ...(studentDataWithoutInvalidFields.currentCountry && { currentCountry: studentDataWithoutInvalidFields.currentCountry }),
        ...(studentDataWithoutInvalidFields.currentPostalCode && { currentPostalCode: studentDataWithoutInvalidFields.currentPostalCode })
      };

      console.log('🔍 DEBUG: processedStudentData keys:', Object.keys(processedStudentData));
      console.log('🔍 DEBUG: processedStudentData.cardNo:', processedStudentData.cardNo);
      console.log('🔍 DEBUG: processedStudentData.rollNo:', processedStudentData.rollNo);
      console.log('🔍 DEBUG: processedStudentData.admissionNo:', processedStudentData.admissionNo);

      // Check if parent data is provided
      let parentId = null;

      // Validate parent data structure if provided
      if (studentData.parent && !studentData.parent.user) {
        return res.status(400).json({
          success: false,
          message: 'Parent data must include user information',
          error: 'INVALID_PARENT_DATA_STRUCTURE'
        });
      }

      // Debug: Log the entire studentData to see what's being received
      console.log('🔍 DEBUG: Full studentData received:', JSON.stringify(studentData, null, 2));
      console.log('🔍 DEBUG: studentData.parent exists?', !!studentData.parent);
      console.log('🔍 DEBUG: studentData.parent.user exists?', !!(studentData.parent && studentData.parent.user));
      console.log('🔍 DEBUG: studentData.parent type:', typeof studentData.parent);
      console.log('🔍 DEBUG: studentData.parent keys:', studentData.parent ? Object.keys(studentData.parent) : 'null');

      if (studentData.parent && studentData.parent.user) {
        console.log('🔍 Creating parent with user data...');
        console.log('🔍 Parent data:', JSON.stringify(convertBigInts(studentData.parent), null, 2));
        if (req.user) {
          console.log('🔍 Current user:', {
            id: req.user.id,
            type: req.user.type,
            role: req.user.role,
            schoolId: req.user.schoolId,
            createdByOwnerId: req.user.createdByOwnerId
          });
        } else {
          console.log('🔍 No authenticated user (public creation)');
        }

        try {
          console.log('🔍 Creating parent with data:', JSON.stringify(convertBigInts(studentData.parent), null, 2));

          // Determine the correct owner ID for parent creation
          let parentOwnerId;
          if (req.user) {
            if (req.user.type === 'owner') {
              parentOwnerId = req.user.id;
            } else if (req.user.role === 'SUPER_ADMIN') {
              // For super admin, we need to find the school owner
              const school = await prisma.school.findUnique({
                where: { id: BigInt(schoolId) },
                select: { ownerId: true }
              });
              parentOwnerId = school?.ownerId;
              console.log('🔍 Found school owner ID:', parentOwnerId);
            } else {
              // For regular users, use their createdByOwnerId
              parentOwnerId = req.user.createdByOwnerId;
            }
          } else {
            // Public creation: use school.ownerId as the parent owner
            const school = await prisma.school.findUnique({
              where: { id: BigInt(schoolId) },
              select: { ownerId: true }
            });
            parentOwnerId = school?.ownerId || null;
            console.log('🔍 Public creation: using school owner ID for parent:', parentOwnerId);
          }

          console.log('🔍 Final parent owner ID:', parentOwnerId);
          console.log('🔍 School ID:', schoolId);

          const parent = await ParentService.createParentWithUser(
            studentData.parent,
            parentOwnerId,
            schoolId
          );
          console.log('🔍 Parent created successfully:', JSON.stringify(convertBigInts(parent), null, 2));
          console.log('🔍 Parent object keys:', Object.keys(parent));
          console.log('🔍 Parent ID type:', typeof parent.id);
          console.log('🔍 Parent ID value:', parent.id);

          // Extract the parent record ID from the created parent
          if (parent && parent.id) {
            parentId = parent.id;
            console.log('🔍 Parent record ID extracted:', parentId);
          }
        } catch (parentError) {
          console.error('❌ Error creating parent:', parentError);
          return createErrorResponse(res, 500, `Failed to create parent: ${parentError.message}`);
        }
      } else if (studentData.parentId) {
        // Use existing parent ID if provided
        parentId = studentData.parentId;
        console.log('🔍 Using existing parent ID:', parentId);
      } else {
        console.log('🔍 No parent data provided, proceeding without parent');
      }

      console.log('🔍 Final parentId before student creation:', parentId);
      console.log('🔍 ParentId type:', typeof parentId);
      console.log('🔍 ParentId value:', parentId);

      // Determine the correct owner ID for student creation
      let studentOwnerId;
      if (req.user) {
        if (req.user.type === 'owner') {
          studentOwnerId = req.user.id;
        } else if (req.user.role === 'SUPER_ADMIN') {
          // For super admin, we need to find the school owner
          const school = await prisma.school.findUnique({
            where: { id: BigInt(schoolId) },
            select: { ownerId: true }
          });
          studentOwnerId = school?.ownerId;
        } else {
          // For regular users, use their createdByOwnerId
          studentOwnerId = req.user.createdByOwnerId;
        }
      } else {
        // Public creation: use the school owner id
        const school = await prisma.school.findUnique({
          where: { id: BigInt(schoolId) },
          select: { ownerId: true }
        });
        studentOwnerId = school?.ownerId || null;
      }

      // Generate salt and hash password for student user using bcrypt
      const studentSalt = await bcrypt.genSalt(10);
      const studentPasswordHash = await bcrypt.hash('password123', studentSalt);

      // Generate unique username for student
      console.log('🔍 Username from frontend:', studentData.user.username);
      console.log('🔍 Username type:', typeof studentData.user.username);
      console.log('🔍 Username length:', studentData.user.username?.length);

      let studentUsername = studentData.user.username || `${studentData.user.firstName.toLowerCase()}_${Math.floor(Math.random() * 1000)}`;

      console.log('🔍 Initial studentUsername:', studentUsername);

      // Ensure username uniqueness by checking if it already exists
      let counter = 1;
      let finalStudentUsername = studentUsername;
      while (await prisma.user.findUnique({ where: { username: finalStudentUsername } })) {
        finalStudentUsername = `${studentUsername}_${counter}`;
        counter++;
      }
      studentUsername = finalStudentUsername;

      console.log('🔍 Final studentUsername:', studentUsername);

      // Determine user status based on class assignment
      const userStatus = classId ? 'ACTIVE' : 'INACTIVE';
      console.log('🔍 Setting user status:', userStatus, '(classId:', classId, ')');

      // Debug: Log the final data being sent to student creation
      console.log('🔍 Creating student with data:');
      console.log('  - parentId:', parentId);
      console.log('  - parentId type:', typeof parentId);
      console.log('  - parent connection:', parentId ? { parent: { connect: { id: BigInt(parentId) } } } : 'No parent');
      console.log('  - user status:', userStatus);

      // Create student with user and parent connection
      const student = await prisma.student.create({
        data: {
          ...processedStudentData,
          admissionNo: studentCode,
          createdBy: req.user ? req.user.id : (studentOwnerId ?? BigInt(1)),
          school: {
            connect: { id: BigInt(schoolId) }
          },
          // SCOPE FIX: Add branchId and courseId from managed scope
          ...(branchId && { branchId: BigInt(branchId) }),
          ...(courseId && {
            course: {
              connect: { id: BigInt(courseId) }
            }
          }),          // Handle class relation if classId is provided
          ...(classId && {
            class: {
              connect: { id: BigInt(classId) }
            }
          }),
          // Connect to parent if parentId exists
          ...(parentId && {
            parent: {
              connect: { id: BigInt(parentId) }
            }
          }),
          user: {
            create: {
              ...userDataWithoutAddress,
              // Use the generated unique username
              username: studentUsername,
              // Map dateOfBirth to birthDate for User model and convert to Date
              ...(dateOfBirth && { birthDate: new Date(dateOfBirth) }),
              // Store address in metadata as JSON string
              metadata: Object.keys(userMetadata).length > 0 ? JSON.stringify(userMetadata) : null,
              role: 'STUDENT',
              status: userStatus, // ACTIVE if classId provided, INACTIVE otherwise
              schoolId,
              createdBy: req.user ? req.user.id : (studentOwnerId ?? BigInt(1)),
              createdByOwnerId: studentOwnerId, // Use the correct owner ID
              salt: studentSalt,
              password: studentPasswordHash
            }
          }
        },
        include: {
          user: {
            select: {
              id: true,
              uuid: true,
              firstName: true,
              middleName: true,
              lastName: true,
              dariName: true,
              phone: true,
              gender: true,
              birthDate: true,
              tazkiraNo: true,
              status: true,
              avatar: true,
              metadata: true, // Contains relatives, tazkira details, address
              createdAt: true,
              updatedAt: true
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          section: {
            select: {
              id: true,
              name: true
            }
          },
          parent: {
            select: {
              id: true,
              occupation: true,
              annualIncome: true,
              education: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  dariName: true,
                  phone: true,
                  gender: true,
                  birthDate: true,
                  tazkiraNo: true,
                  metadata: true
                }
              }
            }
          },
          school: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          documents: {
            where: { deletedAt: null },
            select: {
              id: true,
              title: true,
              type: true,
              path: true,
              mimeType: true,
              size: true,
              createdAt: true
            }
          }
        }
      });
      if (schoolId) {
        try {
          await updateSubscriptionUsage(schoolId);
        } catch (usageError) {
          console.warn('⚠️ Failed to update subscription usage after student creation:', usageError);
        }
      }

      // Create student enrollment event after student is created
      const studentEventService = new StudentEventService();
      const event = await studentEventService.createStudentEnrollmentEvent(
        student,
        req.user ? req.user.id : (studentOwnerId ?? BigInt(1)),
        schoolId
      );

      // Invalidate cache
      await invalidateStudentCacheOnCreate(student);

      // Audit log is handled by route middleware

      // ===== COMPREHENSIVE NOTIFICATIONS =====
      try {
        const classInfo = student.classId ? await prisma.class.findUnique({
          where: { id: student.classId },
          select: { name: true, code: true }
        }) : null;

        const className = classInfo ? `${classInfo.name}${classInfo.code ? '-' + classInfo.code : ''}` : 'Unknown Class';

        await createStudentNotification(
          'created',
          student,
          req.user ? req.user.id : BigInt(studentOwnerId ?? 1),
          schoolId,
          req.user?.createdByOwnerId,
          {
            className
          }
        );

        console.log('✅ Student enrollment notifications dispatched via blueprint service');
      } catch (notifError) {
        console.error('❌ Failed to send enrollment notifications:', notifError);
      }

      // Convert all BigInt values to strings before response
      const convertedStudent = convertBigInts(student);
      const convertedEvent = convertBigInts(event);

      return createSuccessResponse(res, 201, 'Student created successfully', {
        student: convertedStudent,
        event: convertedEvent
      });
    } catch (error) {
      return handlePrismaError(res, error, 'createStudent');
    }
  }

  /**
   * Get students with pagination and filters
   */
  async getStudents(req, res) {
    console.log('=== getStudents START ===');
    console.log('Query:', req.query);
    console.log('User:', req.user);

    try {
      console.log('Step 1: Determining user type and schoolId...');
      // Handle different user types
      let schoolId;
      if (req.user.type === 'owner' || req.user.role === 'SUPER_ADMIN') {
        // Owner can access all schools or specific school
        schoolId = req.query.schoolId || req.user.schoolId;
        console.log('Owner accessing students for schoolId:', schoolId);
      } else {
        // Regular user can only access their school
        schoolId = req.user.schoolId;
        console.log('Regular user accessing students for schoolId:', schoolId);
      }

      console.log('Step 2: Validating schoolId...');
      if (!schoolId) {
        console.log('ERROR: No schoolId found');
        return createErrorResponse(res, 400, 'School ID is required');
      }
      console.log('SchoolId validated:', schoolId);

      const scope = await resolveManagedScope(req);
      if (scope?.schoolId !== null && scope?.schoolId !== undefined) {
        schoolId = Number(scope.schoolId);
      }

      console.log('Step 3: Extracting query parameters...');
      const {
        page = 1,
        limit = 100,
        search = '',
        classId,
        sectionId,
        status,
        gender,
        includeInactive,
        academicSessionId,
        include = [],
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Validate and sanitize pagination parameters
      const pageNum = Math.max(1, parseInt(page) || 1);
      let limitNum;

      // Handle special cases for limit
      if (limit === 'all' || limit === 'unlimited') {
        limitNum = undefined; // No limit - fetch all
      } else {
        limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
      }

      console.log('Query parameters extracted:', { page: pageNum, limit: limitNum, search, classId, sectionId, status, gender, include, sortBy, sortOrder });

      console.log('Step 4: Building include query...');
      const includeQuery = buildStudentIncludeQuery(include);
      console.log('Include query built:', includeQuery);

      console.log('Step 5: Building search query...');
      const searchQuery = buildStudentSearchQuery({
        search,
        classId,
        sectionId,
        status,
        gender,
        includeInactive,
        schoolId
      });
      console.log('Search query built:', searchQuery);

      // Note: For academic session filtering, use the dedicated /api/enrollments/session/:sessionId endpoint
      // Student.classId/sectionId reflect current enrollment, so default queries show current year data
      // Historical queries should use enrollments API for accurate year-specific class assignments

      console.log('Step 6: Preparing final query...');
      const finalQuery = {
        where: {
          ...searchQuery,
          schoolId: BigInt(schoolId),
          deletedAt: null
        },
        include: includeQuery,
        orderBy: { [sortBy]: sortOrder }
      };

      // Log the query before scoping to see gender filter
      console.log('🔍 Final query BEFORE scoping:', JSON.stringify(finalQuery.where, (key, value) => {
        if (typeof value === 'bigint') return value.toString();
        return value;
      }, 2));

      // Check if this is an ID search - if so, don't paginate to get exact result
      const isIdSearch = search && !isNaN(search) && !isNaN(parseFloat(search));

      const { where: scopedWhere, empty } = await ensureScopedStudentWhere(scope, finalQuery.where);
      finalQuery.where = scopedWhere;

      // Log the query after scoping to see if gender filter is preserved
      console.log('🔍 Final query AFTER scoping:', JSON.stringify(finalQuery.where, (key, value) => {
        if (typeof value === 'bigint') return value.toString();
        return value;
      }, 2));

      let students = [];
      let totalCount = 0;

      if (empty) {
        console.log('Scoped context returned no accessible students for the current filters.');
      } else {
        // For any search, remove pagination to ensure we get all matching results
        if (search) {
          console.log('🔍 Search detected - removing pagination to get all matching results');
          // Don't add skip/take for searches to ensure we get all results
        } else if (limitNum !== undefined) {
          // Only add pagination if no search and limit is specified
          finalQuery.skip = (pageNum - 1) * limitNum;
          finalQuery.take = limitNum;
        }

        // Convert BigInt values to strings for logging
        const logQuery = JSON.parse(JSON.stringify(finalQuery, (key, value) => {
          if (typeof value === 'bigint') {
            return value.toString();
          }
          return value;
        }));
        console.log('Final query prepared:', JSON.stringify(logQuery, null, 2));

        console.log('Step 7: Executing Prisma query...');

        // Add timeout to prevent hanging queries
        const queryTimeout = 30000; // 30 seconds

        try {
          const countWhere = (await ensureScopedStudentWhere(scope, {
            ...searchQuery,
            schoolId: BigInt(schoolId),
            deletedAt: null
          })).where;

          // Execute both count and data queries in parallel for better performance
          [students, totalCount] = await Promise.race([
            Promise.all([
              prisma.student.findMany(finalQuery),
              prisma.student.count({ where: countWhere })
            ]),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Query timeout after 30 seconds')), queryTimeout)
            )
          ]);

          console.log('🔍 Prisma query executed successfully');
        } catch (error) {
          console.error('🔍 Prisma query failed:', error.message);

          // If search failed, try a simpler approach
          if (search) {
            console.log('🔍 Trying fallback search approach...');
            try {
              // Try a simpler search without complex OR conditions
              const simpleQuery = {
                where: {
                  schoolId: BigInt(schoolId),
                  deletedAt: null,
                  OR: [
                    { id: isNaN(search) ? undefined : parseInt(search) },
                    { userId: isNaN(search) ? undefined : parseInt(search) },
                    { admissionNo: { contains: search } },
                    { rollNo: { contains: search } }
                  ].filter(condition => Object.values(condition)[0] !== undefined)
                },
                include: includeQuery,
                orderBy: { [sortBy]: sortOrder }
              };

              const scopedSimpleWhere = await ensureScopedStudentWhere(scope, simpleQuery.where);
              if (scopedSimpleWhere.empty) {
                students = [];
                totalCount = 0;
              } else {
                simpleQuery.where = scopedSimpleWhere.where;
                students = await prisma.student.findMany(simpleQuery);
                totalCount = students.length;
              }
              console.log('🔍 Fallback search found:', students.length, 'results');
            } catch (fallbackError) {
              console.error('🔍 Fallback search also failed:', fallbackError.message);
              throw error; // Throw original error
            }
          } else {
            throw error; // Re-throw if not a search
          }
        }
      }

      // For any search, remove pagination to ensure we get all matching results
      console.log('Step 8: Query completed. Found students:', students.length, 'Total count:', totalCount);

      // Debug: Check if there are any students in the database at all
      if (students.length === 0 && search) {
        console.log('🔍 No students found for search. Checking if any students exist in database...');
        try {
          const totalStudentsInDb = await prisma.student.count({
            where: {
              schoolId: BigInt(schoolId),
              deletedAt: null
            }
          });
          console.log('🔍 Total students in database for this school:', totalStudentsInDb);

          if (totalStudentsInDb > 0) {
            // Get a sample student to see the data structure
            const sampleStudent = await prisma.student.findFirst({
              where: {
                schoolId: BigInt(schoolId),
                deletedAt: null
              },
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    phone: true
                  }
                }
              }
            });
            console.log('🔍 Sample student data:', JSON.stringify(sampleStudent, (key, value) => {
              if (typeof value === 'bigint') return value.toString();
              return value;
            }, 2));
          }
        } catch (debugError) {
          console.error('🔍 Error checking database:', debugError.message);
        }
      }

      // Debug: Log search results for debugging
      if (search) {
        console.log('🔍 Search results for term "' + search + '":');
        students.forEach((student, index) => {
          console.log(`🔍 Student ${index + 1}:`, {
            id: student.id,
            admissionNo: student.admissionNo,
            rollNo: student.rollNo,
            name: student.user ? `${student.user.firstName} ${student.user.lastName}` : 'No user data',
            username: student.user?.username,
            phone: student.user?.phone
          });
        });
      }

      // Debug: Log parent data to see what's being returned
      if (students.length > 0) {
        console.log('🔍 First student parent data:', JSON.stringify(students[0].parent, (key, value) => {
          if (typeof value === 'bigint') {
            return value.toString();
          }
          return value;
        }, 2));
        if (students[0].parent?.user) {
          console.log('🔍 Parent user fields:', Object.keys(students[0].parent.user));
          console.log('🔍 Parent username value:', students[0].parent.user.username);
        }
      }

      // Calculate pagination metadata
      let pagination;
      if (search) {
        // Any search - no pagination, return all matching results
        pagination = {
          currentPage: 1,
          totalPages: 1,
          totalCount: students.length,
          limit: 'search',
          hasNextPage: false,
          hasPrevPage: false,
          isSearch: true
        };
      } else if (limitNum !== undefined) {
        // Normal pagination
        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        pagination = {
          currentPage: pageNum,
          totalPages,
          totalCount,
          limit: limitNum,
          hasNextPage,
          hasPrevPage
        };
      } else {
        // No pagination - all results
        pagination = {
          currentPage: 1,
          totalPages: 1,
          totalCount: students.length,
          limit: 'all',
          hasNextPage: false,
          hasPrevPage: false
        };
      }

      console.log('Step 9: Pagination metadata:', pagination);
      console.log('=== getStudents END ===');

      // Convert BigInt values to strings for JSON serialization
      const convertedStudents = convertBigInts(students);

      return createSuccessResponse(res, 200, 'Students fetched successfully', convertedStudents, {
        pagination
      });
    } catch (error) {
      console.error('=== getStudents ERROR ===', error);

      // Handle specific timeout errors
      if (error.message.includes('timeout')) {
        console.error('Query timed out - this might indicate a database performance issue');
        return createErrorResponse(res, 408, 'Request timeout - database query took too long', {
          error: 'Query timeout',
          suggestion: 'Try reducing the limit or adding more specific filters'
        });
      }

      // Handle connection errors
      if (error.code === 'P1001' || error.message.includes('connection')) {
        console.error('Database connection error');
        return createErrorResponse(res, 503, 'Database connection error - please try again', {
          error: 'Database unavailable'
        });
      }

      return handlePrismaError(res, error, 'getStudents');
    }
  }

  /**
   * Get student by ID
   */
  async getStudentById(req, res) {
    try {
      const { id } = req.params;
      const { include = [], includeEnrollmentHistory = 'true' } = req.query;

      const scope = await resolveManagedScope(req);

      // Check cache first
      const cachedStudent = await getStudentFromCache(id);
      if (cachedStudent) {
        const inScope = await verifyStudentInScope(BigInt(id), scope);
        if (inScope) {
          return createSuccessResponse(res, 200, 'Student fetched from cache', cachedStudent, {
            source: 'cache'
          });
        }
      }

      const includeQuery = buildStudentIncludeQuery(include);

      const { where: scopedWhere, empty } = await ensureScopedStudentWhere(scope, {
        id: BigInt(id),
        deletedAt: null
      });
      if (empty) {
        return createErrorResponse(res, 404, 'Student not found');
      }

      const student = await prisma.student.findFirst({
        where: scopedWhere,
        include: includeQuery
      });

      if (!student) {
        return createErrorResponse(res, 404, 'Student not found');
      }

      // Include enrollment history if requested
      if (includeEnrollmentHistory === 'true') {
        try {
          const enrollmentHistory = await enrollmentService.getEnrollmentHistory(id);
          student.enrollmentHistory = enrollmentHistory;

          // Also get active enrollment
          const activeEnrollment = await enrollmentService.getActiveEnrollment(id);
          student.activeEnrollment = activeEnrollment;
        } catch (enrollError) {
          console.warn('Failed to fetch enrollment history:', enrollError);
          student.enrollmentHistory = [];
          student.activeEnrollment = null;
        }
      }

      // Cache the student
      await setStudentInCache(student);

      return createSuccessResponse(res, 200, 'Student fetched successfully', student, {
        source: 'database'
      });
    } catch (error) {
      return handlePrismaError(res, error, 'getStudentById');
    }
  }

  /**
   * Update student
   */
  async updateStudent(req, res) {
    try {
      const { id } = req.params;

      console.log('🔍 ===== STUDENT UPDATE STARTED =====');
      console.log('🔍 Student ID:', id);
      console.log('🔍 RAW req.body:', JSON.stringify(req.body, null, 2));
      console.log('🔍 req.body.expectedFees BEFORE destructuring:', req.body.expectedFees);
      console.log('🔍 req.body.expectedFees type BEFORE destructuring:', typeof req.body.expectedFees);

      // Transform form data structure to backend format if needed
      let requestBody = req.body;
      if (requestBody.student && requestBody.student.personalInfo) {
        console.log('🔍 Detected form structure in update, transforming to backend format...');
        requestBody = transformFormDataToBackend(requestBody);
        console.log('🔍 Transformed update data:', JSON.stringify(requestBody, null, 2));
      }

      const { user, parent, class: className, relatives, ...updateData } = requestBody;

      // SCOPE FIX: Get branchId and courseId from managed scope for updates
      const scope = await resolveManagedScope(req);
      console.log('🔍 Resolved managed scope for update:', scope);

      // Add scope fields to updateData if they exist in scope and not already in updateData
      if (scope.branchId && !updateData.branchId) {
        updateData.branchId = Number(scope.branchId);
        console.log('🔍 Adding branchId from scope:', updateData.branchId);
      }
      if (scope.courseId && !updateData.courseId) {
        updateData.courseId = Number(scope.courseId);
        console.log('🔍 Adding courseId from scope:', updateData.courseId);
      }

      // Handle class name to ID conversion if class name is provided
      if (className && !updateData.classId && req.user) {
        console.log('🔍 Converting class name to classId in update:', className);
        const classRecord = await prisma.class.findFirst({
          where: {
            name: {
              contains: className,
              mode: 'insensitive'
            },
            schoolId: BigInt(req.user.schoolId),
            deletedAt: null
          }
        });

        if (classRecord) {
          updateData.classId = Number(classRecord.id);
          console.log('🔍 Found class ID:', updateData.classId, 'for class name:', className);
        } else {
          console.warn('⚠️ Class not found by name:', className, 'for school:', req.user.schoolId);
        }
      }

      console.log('🔍 Request body keys:', Object.keys(req.body));
      console.log('🔍 updateData keys:', Object.keys(updateData));
      console.log('🔍 updateData.cardNo:', updateData.cardNo);
      console.log('🔍 updateData.rollNo:', updateData.rollNo);
      console.log('🔍 updateData.admissionNo:', updateData.admissionNo);
      console.log('🔍 updateData.expectedFees AFTER destructuring:', updateData.expectedFees);
      console.log('🔍 updateData.expectedFees type AFTER destructuring:', typeof updateData.expectedFees);

      // Validate student ID format
      if (!/^[0-9]+$/.test(id)) {
        return createErrorResponse(res, 400, 'Invalid student ID');
      }

      // Get existing student with proper school validation
      const existingStudent = await prisma.student.findFirst({
        where: {
          id: parseInt(id),
          schoolId: BigInt(req.user.schoolId),
          deletedAt: null
        },
        include: {
          parent: {
            include: {
              user: true
            }
          }
        }
      });

      if (!existingStudent) {
        return createErrorResponse(res, 404, 'Student not found');
      }

      setAuditContext(req, {
        before: convertBigInts(existingStudent),
        entityId: existingStudent.id,
        schoolId: existingStudent.schoolId,
        userId: existingStudent.userId
      });

      // Validate class access if class is being updated
      const existingClassId = existingStudent.classId !== null && existingStudent.classId !== undefined
        ? Number(existingStudent.classId)
        : null;
      const newClassId = updateData.classId !== null && updateData.classId !== undefined
        ? Number(updateData.classId)
        : null;

      if (newClassId && existingClassId !== newClassId) {
        await validateClassAccess(
          req.user,
          newClassId,
          req.user?.schoolId ?? existingStudent.schoolId
        );
      }

      // Track any newly created parent during update
      let createdParentId = null;

      // Handle parent data update or creation if provided
      if (parent && existingStudent.parent) {
        console.log('🔍 Updating existing parent data...');
        console.log('🔍 Parent data:', JSON.stringify(convertBigInts(parent), null, 2));
        console.log('🔍 Existing parent ID:', existingStudent.parent.id);

        try {
          // Update parent user data if provided
          if (parent.user) {
            console.log('🔍 Updating parent user data...');

            // Extract address fields and move to metadata
            const { address, city, state, country, postalCode, ...userDataWithoutAddress } = parent.user;

            // Create metadata object with address information (only include defined values)
            const userMetadata = {};
            if (address || city || state || country || postalCode) {
              userMetadata.address = {};
              if (address) userMetadata.address.street = address;
              if (city) userMetadata.address.city = city;
              if (state) userMetadata.address.state = state;
              if (country) userMetadata.address.country = country;
              if (postalCode) userMetadata.address.postalCode = postalCode;
            }

            // Debug parent user data
            console.log('🔍 DEBUG: Parent user data before update:', JSON.stringify(userDataWithoutAddress, null, 2));
            console.log('🔍 DEBUG: Parent dariName:', userDataWithoutAddress.dariName);

            // Update parent user
            await prisma.user.update({
              where: { id: existingStudent.parent.user.id },
              data: {
                ...userDataWithoutAddress,
                // Store address in metadata as JSON string
                metadata: Object.keys(userMetadata).length > 0 ? JSON.stringify(userMetadata) : null,
                updatedBy: req.user.id,
                updatedAt: new Date()
              }
            });
            console.log('🔍 Parent user updated successfully');
          }

          // Update parent record data if provided (non-user fields)
          const parentFields = { ...parent };
          delete parentFields.user; // Remove user data as it's handled separately

          if (Object.keys(parentFields).length > 0) {
            console.log('🔍 Updating parent record data...');
            await prisma.parent.update({
              where: { id: existingStudent.parent.id },
              data: {
                ...parentFields,
                updatedBy: req.user.id,
                updatedAt: new Date()
              }
            });
            console.log('🔍 Parent record updated successfully');
          }

        } catch (parentError) {
          console.error('❌ Error updating parent:', parentError);
          return createErrorResponse(res, 500, `Failed to update parent: ${parentError.message}`);
        }
      } else if (parent && !existingStudent.parent) {
        console.log('🔍 Parent data provided and student has no existing parent — creating and linking new parent');
        try {
          // Determine correct owner for the new parent
          let parentOwnerId;
          if (req.user) {
            if (req.user.type === 'owner') parentOwnerId = req.user.id;
            else if (req.user.role === 'SUPER_ADMIN') {
              const school = await prisma.school.findUnique({
                where: { id: BigInt(req.user.schoolId) },
                select: { ownerId: true }
              });
              parentOwnerId = school?.ownerId;
            } else {
              parentOwnerId = req.user.createdByOwnerId;
            }
          } else {
            const school = await prisma.school.findUnique({
              where: { id: BigInt(existingStudent.schoolId) },
              select: { ownerId: true }
            });
            parentOwnerId = school?.ownerId || null;
          }

          // Basic validation: must include user data to create a parent
          if (!parent.user) {
            return createErrorResponse(res, 400, 'Parent creation requires user data');
          }

          // Create the parent using the existing service to keep consistency
          const newParent = await ParentService.createParentWithUser(
            parent,
            parentOwnerId,
            Number(existingStudent.schoolId)
          );

          createdParentId = newParent?.id || null;
          if (createdParentId) {
            // We'll connect this new parent later when building prismaUpdateData relations
            console.log('✅ Created new parent and prepared to connect. Parent ID:', createdParentId);
          } else {
            console.warn('⚠️ Parent created but no ID returned');
          }
        } catch (createParentErr) {
          console.error('❌ Failed to create and link parent during student update:', createParentErr);
          return createErrorResponse(res, 500, `Failed to create and link parent: ${createParentErr.message}`);
        }
      }

      // EVENT-FIRST WORKFLOW: Log event before updating student
      const studentEventService = new StudentEventService();
      const eventData = {
        studentId: existingStudent.id,
        updateData,
        previousData: existingStudent,
        updatedBy: req.user.id,
        schoolId: req.user.schoolId
      };

      // Log the student update event FIRST
      const event = await studentEventService.createStudentUpdateEvent(
        eventData,
        req.user.id,
        req.user.schoolId
      );

      // Prepare update data with proper field filtering
      const validStudentFields = [
        'admissionNo', 'rollNo', 'cardNo', 'admissionDate', 'bloodGroup', 'nationality',
        'religion', 'caste', 'bankAccountNo', 'bankName', 'ifscCode',
        'previousSchool', 'classId', 'sectionId', 'parentId', 'status', 'priority',
        'expectedFees', 'tazkiraNo', 'localLastName',
        'originAddress', 'originCity', 'originState', 'originProvince', 'originCountry', 'originPostalCode',
        'currentAddress', 'currentCity', 'currentState', 'currentProvince', 'currentCountry', 'currentPostalCode'
      ];

      const filteredUpdateData = {};
      console.log('🔍 DEBUG: Filtering updateData fields...');
      console.log('🔍 DEBUG: validStudentFields:', validStudentFields);
      console.log('🔍 DEBUG: updateData.expectedFees before filtering:', updateData.expectedFees);
      for (const key of Object.keys(updateData)) {
        console.log(`🔍 DEBUG: Checking field "${key}", value:`, updateData[key]);
        if (validStudentFields.includes(key)) {
          console.log(`🔍 DEBUG: Field "${key}" is valid, including in filteredUpdateData`);
          // Handle BigInt fields
          if (key === 'classId' || key === 'sectionId' || key === 'parentId') {
            if (updateData[key] === null || updateData[key] === 'null') {
              // Allow null values to pass through for disconnection
              filteredUpdateData[key] = null;
            } else if (updateData[key] && updateData[key] !== 'undefined') {
              try {
                filteredUpdateData[key] = BigInt(updateData[key]);
              } catch (error) {
                console.warn(`Invalid ${key} value: ${updateData[key]}, skipping...`);
                continue;
              }
            }
          } else if (key === 'admissionDate') {
            // Handle date fields
            if (updateData[key]) {
              filteredUpdateData[key] = new Date(updateData[key]);
            }
          } else if (key === 'expectedFees') {
            // Handle Decimal fields - ensure it's a number or null
            if (updateData[key] === null || updateData[key] === 'null' || updateData[key] === '') {
              filteredUpdateData[key] = null;
            } else {
              const numValue = parseFloat(updateData[key]);
              filteredUpdateData[key] = isNaN(numValue) ? null : numValue;
            }
          } else {
            filteredUpdateData[key] = updateData[key];
          }
        }
      }

      // Build prisma update payload: map scalar fields and relations
      const prismaUpdateData = {
        updatedBy: req.user.id,
        updatedAt: new Date()
      };

      // Allowed scalar fields (non-relations)
      const scalarFields = [
        'admissionNo', 'rollNo', 'cardNo', 'admissionDate', 'bloodGroup', 'nationality',
        'religion', 'caste', 'bankAccountNo', 'bankName', 'ifscCode',
        'previousSchool', 'tazkiraNo', 'expectedFees', 'localLastName',
        'originAddress', 'originCity', 'originState', 'originProvince', 'originCountry', 'originPostalCode',
        'currentAddress', 'currentCity', 'currentState', 'currentProvince', 'currentCountry', 'currentPostalCode',
        'status', 'priority'
      ];
      console.log('🔍 DEBUG: filteredUpdateData keys:', Object.keys(filteredUpdateData));
      console.log('🔍 DEBUG: filteredUpdateData.cardNo:', filteredUpdateData.cardNo);
      console.log('🔍 DEBUG: filteredUpdateData.expectedFees:', filteredUpdateData.expectedFees);
      console.log('🔍 DEBUG: filteredUpdateData.expectedFees type:', typeof filteredUpdateData.expectedFees);
      console.log('🔍 DEBUG: scalarFields:', scalarFields);

      appendAuditMetadata(req, {
        changedFields: Object.keys(filteredUpdateData),
        scalarFieldsTouched: Object.keys(filteredUpdateData).filter((field) => scalarFields.includes(field))
      });

      setAuditContext(req, {
        summary: `Student ${existingStudent.id?.toString?.() ?? existingStudent.id} updated`,
        entityId: existingStudent.id
      });

      for (const key of Object.keys(filteredUpdateData)) {
        console.log(`🔍 DEBUG: Processing scalar field "${key}"`);
        if (scalarFields.includes(key)) {
          console.log(`🔍 DEBUG: Field "${key}" is scalar, adding to prismaUpdateData`);

          // Special handling for date fields
          if (key === 'admissionDate' && filteredUpdateData[key]) {
            prismaUpdateData[key] = new Date(filteredUpdateData[key]);
          } else {
            prismaUpdateData[key] = filteredUpdateData[key];
          }
        }
      }

      // Relations: class, section, parent
      if (Object.prototype.hasOwnProperty.call(filteredUpdateData, 'classId')) {
        const val = filteredUpdateData.classId;
        if (val === null) {
          prismaUpdateData.class = { disconnect: true };
        } else if (val !== undefined) {
          prismaUpdateData.class = { connect: { id: val } };
        }
      }
      if (Object.prototype.hasOwnProperty.call(filteredUpdateData, 'sectionId')) {
        const val = filteredUpdateData.sectionId;
        if (val === null) {
          prismaUpdateData.section = { disconnect: true };
        } else if (val !== undefined) {
          prismaUpdateData.section = { connect: { id: val } };
        }
      }
      if (Object.prototype.hasOwnProperty.call(filteredUpdateData, 'parentId') || createdParentId) {
        const val = createdParentId ? BigInt(createdParentId) : filteredUpdateData.parentId;
        if (val === null) {
          prismaUpdateData.parent = { disconnect: true };
        } else if (val !== undefined) {
          prismaUpdateData.parent = { connect: { id: val } };
        }
      }

      // Handle user updates if provided
      let userUpdateData = null;
      if (user) {
        console.log('🔍 Updating student user data...');
        console.log('🔍 User data:', JSON.stringify(convertBigInts(user), null, 2));

        try {
          // Extract fields that don't belong in User table or need special handling
          const {
            address, city, state, country, postalCode,
            dateOfBirth, // Frontend sends dateOfBirth, need to map to birthDate
            tazkiraVolume, tazkiraPage, tazkiraRecord, fatherName,
            ...userDataWithoutSpecialFields
          } = user;

          console.log('🔍 DEBUG: Original user data:', JSON.stringify(user, null, 2));
          console.log('🔍 DEBUG: userDataWithoutSpecialFields:', JSON.stringify(userDataWithoutSpecialFields, null, 2));
          console.log('🔍 DEBUG: dariName in userDataWithoutSpecialFields:', userDataWithoutSpecialFields.dariName);

          // Create metadata object for fields that don't have columns
          const userMetadata = {};

          // Store address in metadata
          if (address || city || state || country || postalCode) {
            userMetadata.address = {};
            if (address) userMetadata.address.street = address;
            if (city) userMetadata.address.city = city;
            if (state) userMetadata.address.state = state;
            if (country) userMetadata.address.country = country;
            if (postalCode) userMetadata.address.postalCode = postalCode;
          }

          // Store paper tazkira extra fields in metadata
          if (tazkiraVolume || tazkiraPage || tazkiraRecord) {
            userMetadata.tazkira = {
              volume: tazkiraVolume,
              page: tazkiraPage,
              record: tazkiraRecord
            };
          }

          // Store relatives information in user metadata if provided
          if (relatives) {
            console.log('🔍 Updating relatives in user metadata:', relatives);
            userMetadata.relatives = relatives;
          }

          // Filter out undefined/null values (except dariName)
          const filteredUserData = {};
          Object.keys(userDataWithoutSpecialFields).forEach(key => {
            if (userDataWithoutSpecialFields[key] !== undefined && userDataWithoutSpecialFields[key] !== null) {
              filteredUserData[key] = userDataWithoutSpecialFields[key];
            } else if (key === 'dariName') {
              filteredUserData[key] = userDataWithoutSpecialFields[key];
            }
          });

          console.log('🔍 DEBUG: filteredUserData after filtering:', JSON.stringify(filteredUserData, null, 2));

          userUpdateData = {
            ...filteredUserData,
            // Map dateOfBirth to birthDate and convert to Date
            ...(dateOfBirth && { birthDate: new Date(dateOfBirth) }),
            // Store address and tazkira details in metadata
            metadata: Object.keys(userMetadata).length > 0 ? JSON.stringify(userMetadata) : null,
            updatedBy: req.user.id,
            updatedAt: new Date()
          };

          console.log('🔍 Processed user update data:', JSON.stringify(convertBigInts(userUpdateData), null, 2));
        } catch (userDataError) {
          console.error('❌ Error processing user data:', userDataError);
          return createErrorResponse(res, 500, `Failed to process user data: ${userDataError.message}`);
        }
      }

      // Update student
      let updatedStudent;
      try {
        console.log('🔍 ========== FINAL PRISMA UPDATE DATA ==========');
        console.log('🔍 prismaUpdateData.expectedFees:', prismaUpdateData.expectedFees);
        console.log('🔍 prismaUpdateData keys:', Object.keys(prismaUpdateData));
        console.log('🔍 Full prismaUpdateData:', JSON.stringify(convertBigInts(prismaUpdateData), null, 2));

        updatedStudent = await prisma.student.update({
          where: { id: parseInt(id) },
          data: {
            ...prismaUpdateData,
            // Handle user updates if provided
            ...(userUpdateData && {
              user: {
                update: userUpdateData
              }
            })
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
            },
            class: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
            section: {
              select: {
                id: true,
                name: true
              }
            },
            parent: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        });

        console.log('🔍 ========== STUDENT UPDATE RESULT ==========');
        console.log('🔍 updatedStudent.expectedFees:', updatedStudent.expectedFees);
        console.log('🔍 updatedStudent.expectedFees type:', typeof updatedStudent.expectedFees);
        console.log('🔍 updatedStudent keys:', Object.keys(updatedStudent));

        setAuditContext(req, {
          after: convertBigInts(updatedStudent)
        });

        // Auto-sync user status when classId changes
        if (Object.prototype.hasOwnProperty.call(filteredUpdateData, 'classId')) {
          const newClassId = filteredUpdateData.classId;
          const oldClassId = existingStudent.classId;

          if (newClassId !== oldClassId) {
            const newStatus = newClassId ? 'ACTIVE' : 'INACTIVE';
            console.log(`🔄 ClassId changed (${oldClassId} → ${newClassId}). Updating user status to: ${newStatus}`);

            try {
              await prisma.user.update({
                where: { id: existingStudent.userId },
                data: { status: newStatus }
              });
              console.log('✅ User status synced successfully');
            } catch (statusError) {
              console.error('❌ Failed to sync user status:', statusError);
              // Non-critical error, continue with response
            }
          }
        }

      } catch (updateError) {
        console.error('❌ Error updating student:', updateError);
        return createErrorResponse(res, 500, `Failed to update student: ${updateError.message}`);
      }

      // Invalidate cache IMMEDIATELY after update
      await invalidateStudentCacheOnUpdate(updatedStudent, existingStudent);

      // Re-fetch the student to ensure we have the latest data including all fields
      const refreshedStudent = await prisma.student.findUnique({
        where: { id: parseInt(id) },
        include: {
          user: {
            select: {
              id: true,
              uuid: true,
              firstName: true,
              lastName: true,
              middleName: true,
              dariName: true,
              displayName: true,
              phone: true,
              gender: true,
              birthDate: true,
              avatar: true,
              status: true
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              code: true,
              expectedFees: true
            }
          },
          section: {
            select: {
              id: true,
              name: true
            }
          },
          parent: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  middleName: true,
                  dariName: true,
                  phone: true,
                  gender: true
                }
              }
            }
          }
        }
      });

      console.log('🔍 ========== REFRESHED STUDENT DATA ==========');
      console.log('🔍 refreshedStudent.expectedFees:', refreshedStudent?.expectedFees);
      console.log('🔍 refreshedStudent.expectedFees type:', typeof refreshedStudent?.expectedFees);

      // Update the event with the final student data (store as string in metadata)
      await prisma.studentEvent.update({
        where: { id: event.id },
        data: {
          metadata: {
            set: JSON.stringify({
              ...event.metadata,
              updatedStudentData: convertBigInts(refreshedStudent || updatedStudent),
              updatedFields: Object.keys(filteredUpdateData)
            })
          }
        }
      });

      // Audit log is handled by route middleware

      // Use refreshed student data for notifications and response
      const finalStudent = refreshedStudent || updatedStudent;

      // ===== COMPREHENSIVE UPDATE NOTIFICATIONS =====
      try {
        const classInfo = finalStudent.classId ? await prisma.class.findUnique({
          where: { id: finalStudent.classId },
          select: { name: true, code: true }
        }) : null;

        const className = classInfo ? `${classInfo.name}${classInfo.code ? '-' + classInfo.code : ''}` : 'Unknown Class';
        const studentName = notificationHelpers.formatStudentName(finalStudent);

        const changedFields = Object.keys(filteredUpdateData);
        const importantChanges = changedFields.filter(f => !['updatedBy', 'updatedAt', 'metadata'].includes(f));
        const changeList = importantChanges.slice(0, 3).join(', ');
        const moreChanges = importantChanges.length > 3 ? ` and ${importantChanges.length - 3} more` : '';
        const changeSummary = `${changeList}${moreChanges}`;

        await createStudentNotification(
          'updated',
          finalStudent,
          req.user.id,
          req.user.schoolId,
          req.user.createdByOwnerId,
          {
            className,
            updatedFields: importantChanges,
            changeSummary
          }
        );

        if (importantChanges.includes('classId')) {
          const newClassTeacher = await notificationHelpers.getClassTeacher(finalStudent.classId);
          const oldClassTeacher = existingStudent.classId ? await notificationHelpers.getClassTeacher(existingStudent.classId) : null;

          if (oldClassTeacher?.userId && oldClassTeacher.userId !== newClassTeacher?.userId) {
            const oldClassName = existingStudent.class?.name || 'Previous Class';
            await createNotification({
              type: 'CLASS_CHANGED',
              title: '📤 Student Transferred from Your Class',
              message: `${studentName} has been transferred from your class (${oldClassName}) to Class ${className}.`,
              recipients: [oldClassTeacher.userId],
              priority: 'LOW',
              schoolId: BigInt(finalStudent.schoolId),
              senderId: req.user.id,
              channels: ['IN_APP'],
              entityType: 'student',
              entityId: finalStudent.id,
              metadata: JSON.stringify({
                studentId: finalStudent.id.toString(),
                studentName,
                oldClassName,
                newClassName: className
              })
            });
          }
        }

        console.log('✅ Student update notifications dispatched via blueprint service');
      } catch (notifError) {
        console.error('❌ Failed to send update notifications:', notifError);
      }

      // Convert BigInt values for response
      const convertedStudent = convertBigInts(finalStudent);
      const convertedEvent = convertBigInts(event);

      console.log('🔍 ========== CONVERTED STUDENT RESPONSE ==========');
      console.log('🔍 convertedStudent.expectedFees:', convertedStudent.expectedFees);
      console.log('🔍 convertedStudent.expectedFees type:', typeof convertedStudent.expectedFees);
      console.log('🔍 convertedStudent.rollNo:', convertedStudent.rollNo);
      console.log('🔍 convertedStudent.cardNo:', convertedStudent.cardNo);
      console.log('🔍 Full convertedStudent:', JSON.stringify(convertedStudent, null, 2));

      return createSuccessResponse(res, 200, 'Student updated successfully', {
        student: convertedStudent,
        event: convertedEvent
      });
    } catch (error) {
      return handlePrismaError(res, error, 'updateStudent');
    }
  }

  /**
   * Delete student (soft delete)
   */
  async deleteStudent(req, res) {
    try {
      const { id } = req.params;

      const existingStudent = await prisma.student.findFirst({
        where: {
          id: parseInt(id),
          schoolId: req.user.schoolId,
          deletedAt: null
        }
      });

      if (!existingStudent) {
        return createErrorResponse(res, 404, 'Student not found');
      }

      // EVENT-FIRST WORKFLOW: Log event before deleting student
      const studentEventService = new StudentEventService();
      const eventData = {
        studentId: existingStudent.id,
        studentData: existingStudent,
        deletedBy: req.user.id,
        schoolId: req.user.schoolId,
        deletionReason: req.body.deletionReason || 'Manual deletion'
      };

      // Log the student deletion event FIRST
      const event = await studentEventService.createStudentDeletionEvent(
        eventData,
        req.user.id,
        req.user.schoolId
      );

      // Soft delete student
      const deletedStudent = await prisma.student.update({
        where: { id: parseInt(id) },
        data: {
          deletedAt: new Date(),
          updatedBy: req.user.id
        }
      });

      // Update the event with deletion confirmation
      await prisma.studentEvent.update({
        where: { id: event.id },
        data: {
          metadata: JSON.stringify({
            ...event.metadata,
            deletionConfirmed: true,
            deletedAt: new Date()
          })
        }
      });

      // Invalidate cache
      await invalidateStudentCacheOnDelete(existingStudent);

      // Audit log is handled by route middleware

      return createSuccessResponse(res, 200, 'Student deleted successfully', {
        student: deletedStudent,
        event
      });
    } catch (error) {
      return handlePrismaError(res, error, 'deleteStudent');
    }
  }

  /**
   * Restore deleted student
   */
  async restoreStudent(req, res) {
    try {
      const { id } = req.params;

      const existingStudent = await prisma.student.findFirst({
        where: {
          id: parseInt(id),
          schoolId: req.user.schoolId,
          deletedAt: { not: null }
        }
      });

      if (!existingStudent) {
        return createErrorResponse(res, 404, 'Student not found or not deleted');
      }

      // Restore student
      const restoredStudent = await prisma.student.update({
        where: { id: parseInt(id) },
        data: {
          deletedAt: null,
          updatedBy: req.user.id
        }
      });

      // Invalidate cache
      await invalidateStudentCacheOnCreate(restoredStudent);

      // Create audit log
      await createAuditLog(
        req,
        'RESTORE',
        'Student',
        {
          studentId: restoredStudent.id.toString(),
          admissionNo: restoredStudent.admissionNo
        }
      );

      return createSuccessResponse(res, 200, 'Student restored successfully');
    } catch (error) {
      return handlePrismaError(res, error, 'restoreStudent');
    }
  }

  // ======================
  // SEARCH & FILTER
  // ======================

  /**
   * Search students with advanced filters
   */
  async searchStudents(req, res) {
    try {
      const result = await this.getStudents(req, res);
      return result;
    } catch (error) {
      return handlePrismaError(res, error, 'searchStudents');
    }
  }

  // ======================
  // STATISTICS & ANALYTICS
  // ======================

  /**
   * Get student statistics
   */
  async getStudentStats(req, res) {
    try {
      const { id } = req.params;

      const scope = await resolveManagedScope(req);
      const cacheKey = {
        studentId: id,
        scope: {
          schoolId: scope?.schoolId?.toString() ?? null,
          branchId: scope?.branchId?.toString() ?? null,
          courseId: scope?.courseId?.toString() ?? null
        }
      };

      // Check cache first
      const cachedStats = await getStudentStatsFromCache('individual', cacheKey);
      if (cachedStats) {
        const inScope = await verifyStudentInScope(BigInt(id), scope);
        if (!inScope) {
          return createErrorResponse(res, 404, 'Student not found');
        }
        return createSuccessResponse(res, 200, 'Student stats fetched from cache', cachedStats, {
          source: 'cache'
        });
      }

      const inScope = await verifyStudentInScope(BigInt(id), scope);
      if (!inScope) {
        return createErrorResponse(res, 404, 'Student not found');
      }

      const stats = await generateStudentStats(parseInt(id));

      // Cache the stats
      await setStudentStatsInCache('individual', cacheKey, stats);

      return createSuccessResponse(res, 200, 'Student stats fetched successfully', stats, {
        source: 'database'
      });
    } catch (error) {
      return handlePrismaError(res, error, 'getStudentStats');
    }
  }

  /**
   * Get student analytics
   */
  async getStudentAnalytics(req, res) {
    try {
      const { id } = req.params;
      const { period = '30d' } = req.query;

      const scope = await resolveManagedScope(req);
      const cacheKey = {
        studentId: id,
        period,
        scope: {
          schoolId: scope?.schoolId?.toString() ?? null,
          branchId: scope?.branchId?.toString() ?? null,
          courseId: scope?.courseId?.toString() ?? null
        }
      };

      // Check cache first
      const cachedAnalytics = await getStudentAnalyticsFromCache('individual', cacheKey);
      if (cachedAnalytics) {
        const inScope = await verifyStudentInScope(BigInt(id), scope);
        if (!inScope) {
          return createErrorResponse(res, 404, 'Student not found');
        }
        return createSuccessResponse(res, 200, 'Student analytics fetched from cache', cachedAnalytics, {
          source: 'cache'
        });
      }

      const inScope = await verifyStudentInScope(BigInt(id), scope);
      if (!inScope) {
        return createErrorResponse(res, 404, 'Student not found');
      }

      const analytics = await generateStudentAnalytics(parseInt(id), period);

      // Cache the analytics
      await setStudentAnalyticsInCache('individual', cacheKey, analytics);

      return createSuccessResponse(res, 200, 'Student analytics fetched successfully', analytics, {
        source: 'database'
      });
    } catch (error) {
      return handlePrismaError(res, error, 'getStudentAnalytics');
    }
  }

  /**
   * Get student performance metrics
   */
  async getStudentPerformance(req, res) {
    try {
      const { id } = req.params;

      const scope = await resolveManagedScope(req);
      const cacheKey = {
        studentId: id,
        scope: {
          schoolId: scope?.schoolId?.toString() ?? null,
          branchId: scope?.branchId?.toString() ?? null,
          courseId: scope?.courseId?.toString() ?? null
        }
      };

      // Check cache first
      const cachedPerformance = await getStudentPerformanceFromCache(id, cacheKey);
      if (cachedPerformance) {
        const inScope = await verifyStudentInScope(BigInt(id), scope);
        if (!inScope) {
          return createErrorResponse(res, 404, 'Student not found');
        }
        return createSuccessResponse(res, 200, 'Student performance fetched from cache', cachedPerformance, {
          source: 'cache'
        });
      }

      const inScope = await verifyStudentInScope(BigInt(id), scope);
      if (!inScope) {
        return createErrorResponse(res, 404, 'Student not found');
      }

      const performance = await calculateStudentPerformance(parseInt(id));

      // Cache the performance
      await setStudentPerformanceInCache(id, cacheKey, performance);

      return createSuccessResponse(res, 200, 'Student performance fetched successfully', performance, {
        source: 'database'
      });
    } catch (error) {
      return handlePrismaError(res, error, 'getStudentPerformance');
    }
  }

  // ======================
  // BULK OPERATIONS
  // ======================

  /**
   * Bulk create students
   */
  async bulkCreateStudents(req, res) {
    try {
      const { students } = req.body;

      if (!Array.isArray(students) || students.length === 0) {
        return createErrorResponse(res, 400, 'Students array is required');
      }

      const results = [];
      const errors = [];

      for (const studentData of students) {
        try {
          const result = await this.createStudent({ body: studentData, user: req.user }, res);
          results.push(result);
        } catch (error) {
          errors.push({
            student: studentData,
            error: error.message
          });
        }
      }

      // Invalidate cache
      await invalidateStudentCacheOnBulkOperation('CREATE', results.map(r => r.id));

      return createSuccessResponse(res, 200, 'Bulk create completed', {
        created: results.length,
        failed: errors.length,
        results,
        errors
      });
    } catch (error) {
      return handlePrismaError(res, error, 'bulkCreateStudents');
    }
  }

  /**
   * Bulk update students
   */
  async bulkUpdateStudents(req, res) {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates) || updates.length === 0) {
        return createErrorResponse(res, 400, 'Updates array is required');
      }

      const results = [];
      const errors = [];

      for (const update of updates) {
        try {
          const result = await this.updateStudent({ params: { id: update.id }, body: update.data, user: req.user }, res);
          results.push(result);
        } catch (error) {
          errors.push({
            studentId: update.id,
            error: error.message
          });
        }
      }

      // Invalidate cache
      await invalidateStudentCacheOnBulkOperation('UPDATE', results.map(r => r.id));

      return createSuccessResponse(res, 200, 'Bulk update completed', {
        updated: results.length,
        failed: errors.length,
        results,
        errors
      });
    } catch (error) {
      return handlePrismaError(res, error, 'bulkUpdateStudents');
    }
  }

  /**
   * Bulk delete students
   */
  async bulkDeleteStudents(req, res) {
    try {
      const { studentIds } = req.body;

      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return createErrorResponse(res, 400, 'Student IDs array is required');
      }

      const results = [];
      const errors = [];

      for (const studentId of studentIds) {
        try {
          const result = await this.deleteStudent({ params: { id: studentId }, user: req.user }, res);
          results.push({ id: studentId, result });
        } catch (error) {
          errors.push({
            studentId,
            error: error.message
          });
        }
      }

      // Invalidate cache
      await invalidateStudentCacheOnBulkOperation('DELETE', studentIds);

      return createSuccessResponse(res, 200, 'Bulk delete completed', {
        deleted: results.length,
        failed: errors.length,
        results,
        errors
      });
    } catch (error) {
      return handlePrismaError(res, error, 'bulkDeleteStudents');
    }
  }

  // ======================
  // EXPORT & IMPORT
  // ======================

  /**
   * Export students
   */
  async exportStudents(req, res) {
    try {
      const { format = 'json', ...filters } = req.query;

      const students = await prisma.student.findMany({
        where: {
          schoolId: req.user.schoolId,
          deletedAt: null
        },
        include: {
          user: true,
          class: true,
          section: true,
          parent: {
            include: {
              user: true
            }
          }
        }
      });

      const exportData = await generateStudentExportData(students, format);

      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=students.${format}`);

      return res.send(exportData);
    } catch (error) {
      return handlePrismaError(res, error, 'exportStudents');
    }
  }

  /**
   * Import students
   */
  async importStudents(req, res) {
    try {
      const { students } = req.body;

      if (!Array.isArray(students) || students.length === 0) {
        return createErrorResponse(res, 400, 'Students array is required');
      }

      // Validate import data
      const validationResult = await validateStudentImportData(students);
      if (!validationResult.isValid) {
        return createErrorResponse(res, 400, 'Invalid import data', validationResult.errors);
      }

      const result = await this.bulkCreateStudents(req, res);
      return result;
    } catch (error) {
      return handlePrismaError(res, error, 'importStudents');
    }
  }

  // ======================
  // UTILITY ENDPOINTS
  // ======================

  /**
   * Generate student code suggestions
   */
  async generateCodeSuggestions(req, res) {
    try {
      const { name, schoolId } = req.query;

      const suggestions = await generateStudentCodeSuggestions(name, schoolId || req.user.schoolId);

      return createSuccessResponse(res, 200, 'Code suggestions generated successfully', suggestions);
    } catch (error) {
      return handlePrismaError(res, error, 'generateCodeSuggestions');
    }
  }

  /**
   * Get student count by class
   */
  async getStudentCountByClass(req, res) {
    try {
      const counts = await getStudentCountByClass(req.user.schoolId);

      return createSuccessResponse(res, 200, 'Student counts by class fetched successfully', counts);
    } catch (error) {
      return handlePrismaError(res, error, 'getStudentCountByClass');
    }
  }

  /**
   * Get student count by status
   */
  async getStudentCountByStatus(req, res) {
    try {
      const counts = await getStudentCountByStatus(req.user.schoolId);

      return createSuccessResponse(res, 200, 'Student counts by status fetched successfully', counts);
    } catch (error) {
      return handlePrismaError(res, error, 'getStudentCountByStatus');
    }
  }

  /**
   * Get students by class
   */
  async getStudentsByClass(req, res) {
    console.log('=== getStudentsByClass START ===');
    console.log('Params:', req.params);
    console.log('Query:', req.query);
    console.log('User:', req.user);

    try {
      const { classId } = req.params;
      const { include = [] } = req.query;

      const scope = await resolveManagedScope(req);

      console.log('Building include query...');
      const includeQuery = buildStudentIncludeQuery(include);
      console.log('Include query:', includeQuery);

      const baseWhere = {
        classId: BigInt(classId),
        deletedAt: null
      };

      const { where: scopedWhere, empty } = await ensureScopedStudentWhere(scope, baseWhere);
      if (empty) {
        console.log('No students available for this class in the current managed context.');
        return createSuccessResponse(res, 200, 'Students by class fetched successfully', []);
      }

      console.log('Executing Prisma query...');
      const students = await prisma.student.findMany({
        where: scopedWhere,
        include: includeQuery
      });

      console.log('Query completed. Found students:', students.length);
      console.log('=== getStudentsByClass END ===');
      return createSuccessResponse(res, 200, 'Students by class fetched successfully', students);
    } catch (error) {
      console.error('=== getStudentsByClass ERROR ===', error);
      return handlePrismaError(res, error, 'getStudentsByClass');
    }
  }

  /**
   * Get students by school
   */
  async getStudentsBySchool(req, res) {
    try {
      const { schoolId } = req.params;
      const { include = [] } = req.query;

      const scope = await resolveManagedScope(req);

      const includeQuery = buildStudentIncludeQuery(include);

      const baseWhere = {
        schoolId: BigInt(schoolId),
        deletedAt: null
      };

      const { where: scopedWhere, empty } = await ensureScopedStudentWhere(scope, baseWhere);
      if (empty) {
        return createSuccessResponse(res, 200, 'Students by school fetched successfully', []);
      }

      const students = await prisma.student.findMany({
        where: scopedWhere,
        include: includeQuery
      });

      return createSuccessResponse(res, 200, 'Students by school fetched successfully', students);
    } catch (error) {
      return handlePrismaError(res, error, 'getStudentsBySchool');
    }
  }

  // ======================
  // CACHE MANAGEMENT
  // ======================

  /**
   * Get cache statistics
   */
  async getCacheStats(req, res) {
    try {
      const stats = await getStudentCacheStats();
      return createSuccessResponse(res, 200, 'Cache stats fetched successfully', stats);
    } catch (error) {
      return handlePrismaError(res, error, 'getCacheStats');
    }
  }

  /**
   * Warm cache
   */
  async warmCache(req, res) {
    try {
      const { studentId, schoolId } = req.body;
      const result = await warmStudentCache(studentId, schoolId);
      return createSuccessResponse(res, 200, 'Cache warmed successfully', result);
    } catch (error) {
      return handlePrismaError(res, error, 'warmCache');
    }
  }

  // ======================
  // ADDITIONAL FEATURES
  // ======================

  /**
   * Get student dashboard data
   */
  async getStudentDashboard(req, res) {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);

      // Get student with all related data
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              status: true
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          section: {
            select: {
              id: true,
              name: true
            }
          },
          parent: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  phone: true
                }
              }
            }
          },
          school: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          attendances: {
            take: 30,
            orderBy: { date: 'desc' },
            select: {
              id: true,
              date: true,
              status: true,
              remarks: true
            }
          },
          grades: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              subject: true,
              grade: true,
              score: true,
              createdAt: true
            }
          },
          payments: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              amount: true,
              method: true,
              status: true,
              createdAt: true
            }
          },
          documents: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
              createdAt: true
            }
          }
        }
      });

      if (!student) {
        return createErrorResponse(res, 404, 'Student not found');
      }

      // Calculate quick stats
      const totalAttendance = student.attendances.length;
      const presentDays = student.attendances.filter(a => a.status === 'PRESENT').length;
      const attendanceRate = totalAttendance > 0 ? (presentDays / totalAttendance) * 100 : 0;

      const totalGrades = student.grades.length;
      const averageGrade = totalGrades > 0
        ? student.grades.reduce((sum, grade) => sum + (grade.score || 0), 0) / totalGrades
        : 0;

      const totalPayments = student.payments.length;
      const paidAmount = student.payments
        .filter(p => p.status === 'PAID')
        .reduce((sum, payment) => sum + payment.amount, 0);

      const dashboard = {
        studentId: student.id,
        quickStats: {
          attendanceRate: Math.round(attendanceRate),
          gpa: Math.round(averageGrade * 100) / 100,
          conductScore: 85, // Placeholder - would need behavior data
          feePaymentRate: totalPayments > 0 ? Math.round((paidAmount / totalPayments) * 100) : 0,
          extracurricularParticipation: 75 // Placeholder
        },
        recentActivity: [
          {
            type: 'ATTENDANCE',
            title: 'Attendance Recorded',
            description: `${student.user.firstName} was present today`,
            date: new Date().toISOString(),
            impact: 'POSITIVE'
          },
          {
            type: 'GRADE',
            title: 'Grade Updated',
            description: 'New grade recorded for Mathematics',
            date: new Date().toISOString(),
            impact: 'POSITIVE'
          }
        ],
        upcomingEvents: [
          {
            type: 'EXAM',
            title: 'Final Exams',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            importance: 'HIGH'
          },
          {
            type: 'PAYMENT',
            title: 'Tuition Fee Due',
            date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            importance: 'MEDIUM'
          }
        ],
        academicProgress: {
          subjects: [
            { name: 'Mathematics', grade: 'A', score: 92, trend: 'UP' },
            { name: 'Science', grade: 'B+', score: 87, trend: 'STABLE' },
            { name: 'English', grade: 'A-', score: 89, trend: 'UP' }
          ],
          overallProgress: 88,
          targetGPA: 3.5,
          currentGPA: 3.2
        },
        attendanceHistory: student.attendances.slice(0, 10).map(attendance => ({
          date: attendance.date,
          status: attendance.status,
          remarks: attendance.remarks
        })),
        behaviorLog: [
          {
            date: new Date().toISOString(),
            type: 'POSITIVE',
            description: 'Excellent participation in class discussion',
            points: 5
          }
        ],
        financialStatus: {
          totalFees: 5000,
          paidAmount: paidAmount,
          outstandingAmount: 5000 - paidAmount,
          nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          paymentHistory: student.payments.map(payment => ({
            date: payment.createdAt,
            amount: payment.amount,
            method: payment.method,
            status: payment.status
          }))
        },
        healthRecords: [
          {
            date: new Date().toISOString(),
            type: 'CHECKUP',
            description: 'Annual physical examination',
            severity: 'LOW'
          }
        ],
        documents: student.documents.map(doc => ({
          name: doc.name,
          type: doc.type,
          uploadDate: doc.createdAt,
          status: doc.status
        }))
      };

      return createSuccessResponse(res, 200, 'Student dashboard retrieved successfully', dashboard);
    } catch (error) {
      return handlePrismaError(res, error, 'getStudentDashboard');
    }
  }

  /**
   * Get student attendance records
   */
  async getStudentAttendance(req, res) {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);

      const attendances = await prisma.attendance.findMany({
        where: { studentId },
        orderBy: { date: 'desc' },
        take: 100,
        include: {
          student: {
            select: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      return createSuccessResponse(res, 200, 'Student attendance retrieved successfully', attendances);
    } catch (error) {
      return handlePrismaError(res, error, 'getStudentAttendance');
    }
  }

  /**
   * Update student attendance
   */
  async updateStudentAttendance(req, res) {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);
      const attendanceData = req.body;

      const attendance = await prisma.attendance.create({
        data: {
          studentId,
          date: attendanceData.date,
          status: attendanceData.status,
          remarks: attendanceData.remarks,
          createdBy: req.user.id
        }
      });

      return createSuccessResponse(res, 201, 'Attendance updated successfully', attendance);
    } catch (error) {
      return handlePrismaError(res, error, 'updateStudentAttendance');
    }
  }

  /**
   * Get student behavior records
   */
  async getStudentBehavior(req, res) {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);

      // Since we don't have a behavior table, return mock data
      const behaviors = [
        {
          id: 1,
          studentId,
          type: 'POSITIVE',
          description: 'Excellent participation in class discussion',
          points: 5,
          date: new Date().toISOString(),
          createdBy: req.user.id
        },
        {
          id: 2,
          studentId,
          type: 'NEUTRAL',
          description: 'Regular attendance maintained',
          points: 0,
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          createdBy: req.user.id
        }
      ];

      return createSuccessResponse(res, 200, 'Student behavior retrieved successfully', behaviors);
    } catch (error) {
      return handlePrismaError(res, error, 'getStudentBehavior');
    }
  }

  /**
   * Add student behavior record
   */
  async addStudentBehavior(req, res) {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);
      const behaviorData = req.body;

      // Since we don't have a behavior table, return mock response
      const behavior = {
        id: Date.now(),
        studentId,
        type: behaviorData.type,
        description: behaviorData.description,
        points: behaviorData.points || 0,
        date: new Date().toISOString(),
        createdBy: req.user.id
      };

      return createSuccessResponse(res, 201, 'Behavior record added successfully', behavior);
    } catch (error) {
      return handlePrismaError(res, error, 'addStudentBehavior');
    }
  }

  /**
   * Get student documents
   */
  async getStudentDocuments(req, res) {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);

      const documents = await prisma.document.findMany({
        where: {
          studentId,
          entityType: 'STUDENT'
        },
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      return createSuccessResponse(res, 200, 'Student documents retrieved successfully', documents);
    } catch (error) {
      return handlePrismaError(res, error, 'getStudentDocuments');
    }
  }

  /**
   * Upload student document (single file)
   */
  async uploadStudentDocument(req, res) {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);

      // Check if file was uploaded
      if (!req.file) {
        return createErrorResponse(res, 400, 'No file uploaded');
      }

      // Verify student exists
      const student = await prisma.student.findFirst({
        where: {
          id: BigInt(studentId),
          schoolId: req.user.schoolId,
          deletedAt: null
        }
      });

      if (!student) {
        return createErrorResponse(res, 404, 'Student not found');
      }

      // Get document type from body or use default
      const documentType = req.body.documentType || 'OTHER';
      const title = req.body.title || req.file.originalname;
      const description = req.body.description || '';

      // Create document record in database
      const document = await prisma.document.create({
        data: {
          studentId: BigInt(studentId),
          schoolId: req.user.schoolId,
          title: title,
          description: description,
          type: documentType,
          path: req.file.path,
          mimeType: req.file.mimetype,
          size: req.file.size,
          createdBy: req.user.id
        }
      });

      if (req.user?.schoolId) {
        try {
          await updateSubscriptionUsage(req.user.schoolId);
        } catch (usageError) {
          console.warn('Failed to refresh subscription usage after student document upload:', usageError);
        }
      }

      return createSuccessResponse(res, 201, 'Document uploaded successfully', {
        documentId: document.id.toString(),
        title: document.title,
        type: document.type,
        path: document.path,
        size: document.size,
        mimeType: document.mimeType,
        uploadedAt: document.createdAt
      });
    } catch (error) {
      console.error('Error uploading student document:', error);
      return handlePrismaError(res, error, 'uploadStudentDocument');
    }
  }

  /**
   * Upload multiple student documents
   * Handles batch upload of various document types
   */
  async uploadStudentDocuments(req, res) {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);

      // Check if files were uploaded
      if (!req.files || Object.keys(req.files).length === 0) {
        return createErrorResponse(res, 400, 'No files uploaded');
      }

      // Verify student exists
      const student = await prisma.student.findFirst({
        where: {
          id: BigInt(studentId),
          schoolId: req.user.schoolId,
          deletedAt: null
        }
      });

      if (!student) {
        return createErrorResponse(res, 404, 'Student not found');
      }

      // Import the getDocumentTypeEnum function
      const { getDocumentTypeEnum } = await import('../middleware/studentDocumentUpload.js');

      // Process all uploaded files
      const uploadedDocuments = [];
      const errors = [];

      for (const [fieldName, files] of Object.entries(req.files)) {
        const documentType = getDocumentTypeEnum(fieldName);

        for (const file of files) {
          try {
            const document = await prisma.document.create({
              data: {
                studentId: BigInt(studentId),
                schoolId: req.user.schoolId,
                title: `${fieldName} - ${file.originalname}`,
                description: `Student ${fieldName} document`,
                type: documentType,
                path: file.path,
                mimeType: file.mimetype,
                size: file.size,
                createdBy: req.user.id
              }
            });

            uploadedDocuments.push({
              documentId: document.id.toString(),
              fieldName: fieldName,
              title: document.title,
              type: document.type,
              path: document.path,
              size: document.size,
              mimeType: document.mimeType,
              uploadedAt: document.createdAt
            });
          } catch (error) {
            console.error(`Error saving document ${file.originalname}:`, error);
            errors.push({
              filename: file.originalname,
              fieldName: fieldName,
              error: error.message
            });
          }
        }
      }

      if (req.user?.schoolId) {
        try {
          await updateSubscriptionUsage(req.user.schoolId);
        } catch (usageError) {
          console.warn('Failed to refresh subscription usage after bulk student document upload:', usageError);
        }
      }

      const response = {
        totalFiles: uploadedDocuments.length,
        documents: uploadedDocuments,
        studentId: studentId.toString()
      };

      if (errors.length > 0) {
        response.errors = errors;
        response.message = `Uploaded ${uploadedDocuments.length} documents with ${errors.length} errors`;
      }

      return createSuccessResponse(
        res,
        201,
        `Successfully uploaded ${uploadedDocuments.length} document(s)`,
        response
      );
    } catch (error) {
      console.error('Error uploading student documents:', error);
      return handlePrismaError(res, error, 'uploadStudentDocuments');
    }
  }

  /**
   * Get student documents by type
   */
  async getStudentDocumentsByType(req, res) {
    try {
      const { id } = req.params;
      const { type } = req.query;
      const studentId = parseInt(id);

      const whereClause = {
        studentId: BigInt(studentId),
        schoolId: req.user.schoolId,
        deletedAt: null
      };

      if (type) {
        whereClause.type = type;
      }

      const documents = await prisma.document.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          path: true,
          mimeType: true,
          size: true,
          createdAt: true,
          updatedAt: true,
          createdByUser: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Convert BigInt to string for JSON serialization
      const serializedDocuments = documents.map(doc => ({
        ...doc,
        id: doc.id.toString()
      }));

      return createSuccessResponse(
        res,
        200,
        'Documents retrieved successfully',
        {
          count: serializedDocuments.length,
          documents: serializedDocuments
        }
      );
    } catch (error) {
      console.error('Error getting student documents by type:', error);
      return handlePrismaError(res, error, 'getStudentDocumentsByType');
    }
  }

  /**
   * Delete student document
   */
  async deleteStudentDocument(req, res) {
    try {
      const { id, documentId } = req.params;
      const studentId = parseInt(id);
      const docId = BigInt(documentId);

      // Find the document
      const document = await prisma.document.findFirst({
        where: {
          id: docId,
          studentId: BigInt(studentId),
          schoolId: req.user.schoolId,
          deletedAt: null
        }
      });

      if (!document) {
        return createErrorResponse(res, 404, 'Document not found');
      }

      // Soft delete the document
      await prisma.document.update({
        where: { id: docId },
        data: {
          deletedAt: new Date(),
          updatedBy: req.user.id
        }
      });

      // Optionally delete the physical file
      const fs = await import('fs');
      if (fs.existsSync(document.path)) {
        try {
          fs.unlinkSync(document.path);
          console.log(`🗑️  Deleted physical file: ${document.path}`);
        } catch (error) {
          console.error(`Failed to delete physical file: ${document.path}`, error);
        }
      }

      if (req.user?.schoolId) {
        try {
          await updateSubscriptionUsage(req.user.schoolId);
        } catch (usageError) {
          console.warn('Failed to refresh subscription usage after student document deletion:', usageError);
        }
      }

      return createSuccessResponse(res, 200, 'Document deleted successfully', {
        documentId: documentId,
        studentId: studentId.toString()
      });
    } catch (error) {
      console.error('Error deleting student document:', error);
      return handlePrismaError(res, error, 'deleteStudentDocument');
    }
  }

  /**
   * Download student document
   */
  async downloadStudentDocument(req, res) {
    try {
      const { id, documentId } = req.params;
      const studentId = parseInt(id);
      const docId = BigInt(documentId);

      // Find the document
      const document = await prisma.document.findFirst({
        where: {
          id: docId,
          studentId: BigInt(studentId),
          schoolId: req.user.schoolId,
          deletedAt: null
        }
      });

      if (!document) {
        return createErrorResponse(res, 404, 'Document not found');
      }

      // Check if file exists
      const fs = await import('fs');
      if (!fs.existsSync(document.path)) {
        return createErrorResponse(res, 404, 'Physical file not found');
      }

      // Set appropriate headers
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${document.title}"`);
      res.setHeader('Content-Length', document.size);

      // Stream the file
      const fileStream = fs.createReadStream(document.path);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error downloading student document:', error);
      return handlePrismaError(res, error, 'downloadStudentDocument');
    }
  }

  /**
   * Get student financial records
   */
  async getStudentFinancials(req, res) {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);

      const payments = await prisma.payment.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      const totalFees = 5000; // Placeholder - would come from fees table
      const paidAmount = payments
        .filter(p => p.status === 'PAID')
        .reduce((sum, payment) => sum + payment.amount, 0);

      const financials = {
        totalFees,
        paidAmount,
        outstandingAmount: totalFees - paidAmount,
        payments,
        nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      return createSuccessResponse(res, 200, 'Student financials retrieved successfully', financials);
    } catch (error) {
      return handlePrismaError(res, error, 'getStudentFinancials');
    }
  }

  /**
   * Update student financial records
   */
  async updateStudentFinancials(req, res) {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);
      const financialData = req.body;

      // Update student's financial information
      const student = await prisma.student.update({
        where: { id: studentId },
        data: {
          financialInfo: financialData
        }
      });

      return createSuccessResponse(res, 200, 'Student financials updated successfully', student);
    } catch (error) {
      return handlePrismaError(res, error, 'updateStudentFinancials');
    }
  }

  /**
   * Get student health records
   */
  async getStudentHealth(req, res) {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);

      // Since we don't have a health table, return mock data
      const healthRecords = [
        {
          id: 1,
          studentId,
          type: 'CHECKUP',
          description: 'Annual physical examination',
          severity: 'LOW',
          date: new Date().toISOString(),
          createdBy: req.user.id
        },
        {
          id: 2,
          studentId,
          type: 'VACCINATION',
          description: 'Flu shot administered',
          severity: 'LOW',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: req.user.id
        }
      ];

      return createSuccessResponse(res, 200, 'Student health records retrieved successfully', healthRecords);
    } catch (error) {
      return handlePrismaError(res, error, 'getStudentHealth');
    }
  }

  /**
   * Add student health record
   */
  async addStudentHealthRecord(req, res) {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);
      const healthData = req.body;

      // Since we don't have a health table, return mock response
      const healthRecord = {
        id: Date.now(),
        studentId,
        type: healthData.type,
        description: healthData.description,
        severity: healthData.severity || 'LOW',
        date: new Date().toISOString(),
        createdBy: req.user.id
      };

      return createSuccessResponse(res, 201, 'Health record added successfully', healthRecord);
    } catch (error) {
      return handlePrismaError(res, error, 'addStudentHealthRecord');
    }
  }

  /**
   * Get all students that were converted from customers
   */
  async getConvertedStudents(req, res) {
    try {
      const { schoolId } = req.user;
      const { page = 1, limit = 10, search, sortBy = 'conversionDate', sortOrder = 'desc' } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const whereClause = {
        schoolId,
        convertedFromCustomerId: { not: null }
      };

      if (search) {
        const searchTerm = search.trim();
        const isNumeric = !isNaN(searchTerm) && !isNaN(parseFloat(searchTerm));

        whereClause.OR = [
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName: { contains: search, mode: 'insensitive' } } },
          { user: { displayName: { contains: search, mode: 'insensitive' } } },
          { user: { username: { contains: search, mode: 'insensitive' } } },
          { user: { phone: { contains: search, mode: 'insensitive' } } },
          { admissionNo: { contains: search, mode: 'insensitive' } },
          { rollNo: { contains: search, mode: 'insensitive' } }
        ];

        // Add ID search if the search term is numeric
        if (isNumeric) {
          whereClause.OR.push({
            id: parseInt(searchTerm)
          });
        }
      }

      const [students, total] = await Promise.all([
        prisma.student.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                middleName: true,
                lastName: true,
                displayName: true,
                phone: true
              }
            },
            convertedFromCustomer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                createdAt: true
              }
            },
            events: {
              orderBy: { createdAt: 'desc' },
              take: 5
            },
            _count: {
              select: {
                events: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: parseInt(limit)
        }),
        prisma.student.count({ where: whereClause })
      ]);

      res.json({
        success: true,
        data: convertBigInts(students),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching converted students:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch converted students',
        error: error.message
      });
    }
  }

  /**
   * Get analytics for students converted from customers
   */
  async getStudentConversionAnalytics(req, res) {
    try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      if (!scope?.schoolId) {
        return res.status(400).json({
          success: false,
          message: 'Managed school context is required for conversion analytics'
        });
      }
      const { period = '30d' } = req.query; // 7d, 30d, 90d, 1y, all

      const { where: scopedStudentWhere, empty: studentScopeEmpty } =
        await ensureScopedStudentWhere(scope, { deletedAt: null });
      if (studentScopeEmpty) {
        return res.json({
          success: true,
          data: convertBigInts({
            totalStudents: 0,
            convertedStudents: 0,
            conversionRate: 0,
            recentConversions: 0,
            conversionByMonth: [],
            averageConversionTime: 0,
            conversionEvents: [],
            classCount: 0,
            teacherCount: 0,
            subjectCount: 0,
            averageGrade: 0,
            attendanceRate: 0
          })
        });
      }

      let dateFilter = {};
      if (period !== 'all') {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
        dateFilter = {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        };
      }

      // Get conversion statistics for students
      const [
        totalStudents,
        convertedStudents,
        conversionRate,
        recentConversions,
        conversionByMonth,
        averageConversionTime
      ] = await Promise.all([
        // Total ACTIVE students only
        (async () => {
          const activeStudentsWhere = combineStudentWhere(scopedStudentWhere, {
            user: { status: 'ACTIVE' }
          });
          return prisma.student.count({ where: activeStudentsWhere });
        })(),

        // Students converted from customers (ACTIVE only)
        (async () => {
          const convertedStudentsWhere = combineStudentWhere(scopedStudentWhere, {
            convertedFromCustomerId: { not: null },
            user: { status: 'ACTIVE' }
          });
          return prisma.student.count({ where: convertedStudentsWhere });
        })(),

        // Conversion rate calculation (ACTIVE students only)
        (async () => {
          const activeStudentsWhere = combineStudentWhere(scopedStudentWhere, {
            user: { status: 'ACTIVE' }
          });
          const [total, converted] = await Promise.all([
            prisma.student.count({ where: activeStudentsWhere }),
            prisma.student.count({
              where: combineStudentWhere(activeStudentsWhere, {
                convertedFromCustomerId: { not: null }
              })
            })
          ]);
          return total > 0 ? (converted / total) * 100 : 0;
        })(),

        // Recent conversions (last 30 days)
        (async () => {
          return prisma.student.count({
            where: combineStudentWhere(scopedStudentWhere, {
              convertedFromCustomerId: { not: null },
              conversionDate: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              },
              user: { status: 'ACTIVE' }
            })
          });
        })(),

        // Conversion by month (last 6 months)
        (async () => {
          return prisma.student.groupBy({
            by: ['conversionDate'],
            where: combineStudentWhere(scopedStudentWhere, {
              convertedFromCustomerId: { not: null },
              conversionDate: {
                gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
              },
              user: { status: 'ACTIVE' }
            }),
            _count: {
              id: true
            }
          });
        })(),

        // Average time from customer creation to conversion
        (async () => {
          const students = await prisma.student.findMany({
            where: combineStudentWhere(scopedStudentWhere, {
              convertedFromCustomerId: { not: null },
              conversionDate: dateFilter
            }),
            include: {
              convertedFromCustomer: {
                select: { createdAt: true }
              }
            }
          });
          if (students.length === 0) return 0;
          const totalDays = students.reduce((sum, student) => {
            const customerCreated = new Date(student.convertedFromCustomer.createdAt);
            const converted = new Date(student.conversionDate);
            return sum + (converted - customerCreated) / (1000 * 60 * 60 * 24);
          }, 0);
          return totalDays / students.length;
        })()
      ]);

      // Get conversion events for the period
      const conversionEvents = await prisma.studentEvent.findMany({
        where: {
          student: combineStudentWhere(scopedStudentWhere, {}),
          eventType: 'CONVERTED_FROM_CUSTOMER',
          createdAt: dateFilter
        },
        include: {
          student: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true, dariName: true, displayName: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      // Fetch additional metrics for dashboard
      const [classCount, teacherCount, subjectCount, gradeStats, attendanceStats] = await Promise.all([
        // Count unique classes
        prisma.class.count({
          where: applyScopeToWhere({}, scope, { useBranch: true, useCourse: true })
        }),

        // Count teachers (users with TEACHER role)
        prisma.user.count({
          where: applyScopeToWhere(
            {
              role: 'TEACHER',
              status: 'ACTIVE'
            },
            scope,
            { useBranch: true, useCourse: false }
          )
        }),

        // Count subjects
        prisma.subject.count({
          where: applyScopeToWhere({}, scope, { useBranch: true, useCourse: true })
        }),

        // Calculate average grade (ACTIVE students only)
        prisma.grade.aggregate({
          where: {
            student: combineStudentWhere(scopedStudentWhere, {
              user: { status: 'ACTIVE' }
            }),
            ...(period !== 'all' ? { createdAt: dateFilter } : {})
          },
          _avg: {
            marks: true
          },
          _count: true
        }).then(result => {
          // Return average marks or 0 if no grades
          return result._avg.marks || 0;
        }),

        // Calculate attendance rate (ACTIVE students only)
        prisma.attendance.groupBy({
          by: ['status'],
          where: {
            student: combineStudentWhere(scopedStudentWhere, {
              user: { status: 'ACTIVE' }
            }),
            ...(period !== 'all' ? { createdAt: dateFilter } : {})
          },
          _count: true
        }).then(results => {
          const total = results.reduce((sum, r) => sum + r._count, 0);
          const present = results.find(r => r.status === 'PRESENT')?._count || 0;
          return total > 0 ? (present / total * 100) : 0;
        })
      ]);

      res.json({
        success: true,
        data: convertBigInts({
          totalStudents,
          convertedStudents,
          conversionRate: Math.round(conversionRate * 100) / 100,
          recentConversions,
          conversionByMonth,
          averageConversionTime: Math.round(averageConversionTime * 100) / 100,
          conversionEvents,
          // Additional dashboard metrics
          classCount,
          teacherCount,
          subjectCount,
          averageGrade: Math.round(gradeStats * 100) / 100,
          attendanceRate: Math.round(attendanceStats * 100) / 100
        })
      });
    } catch (error) {
      console.error('Error fetching student conversion analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student conversion analytics',
        error: error.message
      });
    }
  }

  /**
   * Get detailed statistics about student conversions
   */
  async getStudentConversionStats(req, res) {
    try {
      const { schoolId } = req.user;
      const { studentId } = req.params;

      if (studentId) {
        // Get stats for specific student
        const student = await prisma.student.findFirst({
          where: {
            id: BigInt(studentId),
            schoolId,
            convertedFromCustomerId: { not: null }
          },
          include: {
            convertedFromCustomer: {
              select: {
                id: true,
                name: true,
                phone: true,
                createdAt: true,
                customerEvents: {
                  orderBy: { createdAt: 'desc' },
                  take: 10
                }
              }
            },
            events: {
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        });

        if (!student) {
          return res.status(404).json({
            success: false,
            message: 'Converted student not found'
          });
        }

        const customerCreated = new Date(student.convertedFromCustomer.createdAt);
        const converted = new Date(student.conversionDate);
        const daysToConvert = (converted - customerCreated) / (1000 * 60 * 60 * 24);

        res.json({
          success: true,
          data: convertBigInts({
            student,
            conversionStats: {
              daysToConvert: Math.round(daysToConvert * 100) / 100,
              customerEventsCount: student.convertedFromCustomer.customerEvents.length,
              studentEventsCount: student.events.length
            }
          })
        });
      } else {
        // Get overall stats
        const [
          totalConverted,
          averageConversionTime,
          conversionTrend,
          topConvertingCustomers
        ] = await Promise.all([
          prisma.student.count({
            where: {
              schoolId,
              convertedFromCustomerId: { not: null }
            }
          }),

          prisma.student.findMany({
            where: {
              schoolId,
              convertedFromCustomerId: { not: null }
            },
            include: {
              convertedFromCustomer: {
                select: { createdAt: true }
              }
            }
          }).then(students => {
            if (students.length === 0) return 0;
            const totalDays = students.reduce((sum, student) => {
              const customerCreated = new Date(student.convertedFromCustomer.createdAt);
              const converted = new Date(student.conversionDate);
              return sum + (converted - customerCreated) / (1000 * 60 * 60 * 24);
            }, 0);
            return totalDays / students.length;
          }),

          prisma.student.groupBy({
            by: ['conversionDate'],
            where: {
              schoolId,
              convertedFromCustomerId: { not: null },
              conversionDate: {
                gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
              }
            },
            _count: { id: true }
          }),

          prisma.customer.findMany({
            where: {
              schoolId,
              convertedStudents: { some: {} }
            },
            include: {
              _count: {
                select: { convertedStudents: true }
              }
            },
            orderBy: {
              convertedStudents: { _count: 'desc' }
            },
            take: 10
          })
        ]);

        res.json({
          success: true,
          data: convertBigInts({
            totalConverted,
            averageConversionTime: Math.round(averageConversionTime * 100) / 100,
            conversionTrend,
            topConvertingCustomers
          })
        });
      }
    } catch (error) {
      console.error('Error fetching student conversion stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student conversion stats',
        error: error.message
      });
    }
  }

  /**
   * Generate student card
   */
  async generateStudentCard(req, res) {
    try {
      const { studentId } = req.params;

      // Validate ID format (can be student ID or user ID)
      if (!/^[0-9]+$/.test(studentId)) {
        return createErrorResponse(res, 400, 'Invalid ID format');
      }

      // Import the card generation service
      const CardGenerationService = (await import('../services/cardGenerationService.js')).default;

      // Initialize the service
      await CardGenerationService.initialize();

      // Check if the ID is a student ID or user ID
      let actualStudentId = studentId;

      // First, try to find student by student ID
      let student = await prisma.student.findFirst({
        where: {
          id: BigInt(studentId),
          schoolId: req.user.schoolId,
          deletedAt: null
        }
      });

      // If not found by student ID, try to find by user ID
      if (!student) {
        student = await prisma.student.findFirst({
          where: {
            userId: BigInt(studentId),
            schoolId: req.user.schoolId,
            deletedAt: null
          }
        });

        if (student) {
          actualStudentId = student.id.toString();
        }
      }

      if (!student) {
        return createErrorResponse(res, 404, 'Student not found');
      }

      // Generate the card using the student ID
      const result = await CardGenerationService.generateStudentCard(actualStudentId);

      if (result.success) {
        // Always download the file directly
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

        // Send the file
        return res.sendFile(path.resolve(result.filePath), (err) => {
          if (err) {
            console.error('Error sending file:', err);
            return createErrorResponse(res, 500, 'Failed to send card file');
          }
        });
      } else {
        return createErrorResponse(res, 500, `Failed to generate student card: ${result.error}`);
      }
    } catch (error) {
      console.error('Error in generateStudentCard:', error);
      return createErrorResponse(res, 500, `Failed to generate student card: ${error.message}`);
    }
  }

  /**
   * Download student card as file
   */
  async downloadStudentCard(req, res) {
    try {
      const { studentId } = req.params;

      // Validate ID format (can be student ID or user ID)
      if (!/^[0-9]+$/.test(studentId)) {
        return createErrorResponse(res, 400, 'Invalid ID format');
      }

      // Import the card generation service
      const CardGenerationService = (await import('../services/cardGenerationService.js')).default;

      // Initialize the service
      await CardGenerationService.initialize();

      // Check if the ID is a student ID or user ID
      let actualStudentId = studentId;

      // First, try to find student by student ID
      let student = await prisma.student.findFirst({
        where: {
          id: BigInt(studentId),
          schoolId: req.user.schoolId,
          deletedAt: null
        }
      });

      // If not found by student ID, try to find by user ID
      if (!student) {
        student = await prisma.student.findFirst({
          where: {
            userId: BigInt(studentId),
            schoolId: req.user.schoolId,
            deletedAt: null
          }
        });

        if (student) {
          actualStudentId = student.id.toString();
        }
      }

      if (!student) {
        return createErrorResponse(res, 404, 'Student not found');
      }

      // Generate the card using the student ID
      const result = await CardGenerationService.generateStudentCard(actualStudentId);

      if (result.success) {
        // Set headers for file download
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

        // Send the file
        return res.sendFile(path.resolve(result.filePath), (err) => {
          if (err) {
            console.error('Error sending file:', err);
            return createErrorResponse(res, 500, 'Failed to send card file');
          }
        });
      } else {
        return createErrorResponse(res, 500, `Failed to generate student card: ${result.error}`);
      }
    } catch (error) {
      console.error('Error in downloadStudentCard:', error);
      return createErrorResponse(res, 500, `Failed to generate student card: ${error.message}`);
    }
  }

  /**
   * Generate student card as base64 (alternative endpoint)
   */
  async generateStudentCardBase64(req, res) {
    try {
      const { studentId } = req.params;

      // Validate ID format (can be student ID or user ID)
      if (!/^[0-9]+$/.test(studentId)) {
        return createErrorResponse(res, 400, 'Invalid ID format');
      }

      // Import the card generation service
      const CardGenerationService = (await import('../services/cardGenerationService.js')).default;

      // Initialize the service
      await CardGenerationService.initialize();

      // Check if the ID is a student ID or user ID
      let actualStudentId = studentId;

      // First, try to find student by student ID
      let student = await prisma.student.findFirst({
        where: {
          id: BigInt(studentId),
          schoolId: req.user.schoolId,
          deletedAt: null
        }
      });

      // If not found by student ID, try to find by user ID
      if (!student) {
        student = await prisma.student.findFirst({
          where: {
            userId: BigInt(studentId),
            schoolId: req.user.schoolId,
            deletedAt: null
          }
        });

        if (student) {
          actualStudentId = student.id.toString();
        }
      }

      if (!student) {
        return createErrorResponse(res, 404, 'Student not found');
      }

      // Generate the card using the student ID
      const result = await CardGenerationService.generateStudentCard(actualStudentId);

      if (result.success) {
        // Read the file and convert to base64
        const fs = await import('fs-extra');
        const fileBuffer = await fs.readFile(result.filePath);
        const base64Image = fileBuffer.toString('base64');

        return createSuccessResponse(res, 200, 'Student card generated successfully', {
          filename: result.filename,
          imageData: `data:image/jpeg;base64,${base64Image}`,
          student: result.student
        });
      } else {
        return createErrorResponse(res, 500, `Failed to generate student card: ${result.error}`);
      }
    } catch (error) {
      console.error('Error in generateStudentCardBase64:', error);
      return createErrorResponse(res, 500, `Failed to generate student card: ${error.message}`);
    }
  }

  /**
   * Get student card print count
   */
  async getStudentCardPrintCount(req, res) {
    try {
      const { studentId } = req.params;

      // Validate ID format
      if (!/^[0-9]+$/.test(studentId)) {
        return createErrorResponse(res, 400, 'Invalid ID format');
      }

      // Import the card generation service
      const CardGenerationService = (await import('../services/cardGenerationService.js')).default;

      // Get the print count
      const printCount = await CardGenerationService.getCardPrintCount(studentId);

      return createSuccessResponse(res, 200, 'Card print count retrieved successfully', {
        studentId: studentId,
        printCount: printCount
      });
    } catch (error) {
      console.error('Error in getStudentCardPrintCount:', error);
      return createErrorResponse(res, 500, `Failed to get card print count: ${error.message}`);
    }
  }

  /**
   * Upload student avatar
   */
  async uploadStudentAvatar(req, res) {
    try {
      const { studentId } = req.params;

      // Validate ID format
      if (!/^[0-9]+$/.test(studentId)) {
        return createErrorResponse(res, 400, 'Invalid ID format');
      }

      // Check if file was uploaded
      if (!req.file) {
        return createErrorResponse(res, 400, 'No file uploaded');
      }

      // Get student data
      const student = await prisma.student.findFirst({
        where: {
          id: BigInt(studentId),
          schoolId: req.user.schoolId,
          deletedAt: null
        },
        include: {
          user: true
        }
      });

      if (!student) {
        return createErrorResponse(res, 404, 'Student not found');
      }

      // Update user avatar
      await prisma.user.update({
        where: { id: student.userId },
        data: {
          avatar: req.file.path,
          updatedBy: req.user.id,
          updatedAt: new Date()
        }
      });

      return createSuccessResponse(res, 200, 'Avatar uploaded successfully', {
        studentId: studentId,
        avatarPath: req.file.path,
        filename: req.file.filename
      });
    } catch (error) {
      console.error('Error in uploadStudentAvatar:', error);
      return createErrorResponse(res, 500, `Failed to upload avatar: ${error.message}`);
    }
  }

  /**
   * Get student avatar
   */
  async getStudentAvatar(req, res) {
    try {
      const { studentId } = req.params;

      if (!/^[0-9]+$/.test(studentId)) {
        return createErrorResponse(res, 400, 'Invalid ID format');
      }

      // Get student with user data
      const student = await prisma.student.findUnique({
        where: {
          id: BigInt(studentId),
          deletedAt: null
        },
        include: {
          user: {
            select: {
              avatar: true
            }
          }
        }
      });

      if (!student) {
        return createErrorResponse(res, 404, 'Student not found');
      }

      if (!student.user?.avatar) {
        return createErrorResponse(res, 404, 'Student avatar not found');
      }

      // Handle different avatar formats
      if (student.user.avatar.startsWith('data:')) {
        // Base64 data URL - convert to buffer and send
        const base64Data = student.user.avatar.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(buffer);
      } else {
        // File path - serve the file
        const fs = await import('fs');
        const path = await import('path');

        let imagePath = student.user.avatar;

        // Handle different path formats
        if (imagePath.startsWith('/uploads/')) {
          imagePath = path.join(process.cwd(), imagePath);
        } else if (!imagePath.startsWith('/')) {
          imagePath = path.join(process.cwd(), 'uploads', imagePath);
        }

        if (fs.existsSync(imagePath)) {
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.sendFile(path.resolve(imagePath));
        } else {
          return createErrorResponse(res, 404, 'Avatar file not found');
        }
      }
    } catch (error) {
      console.error('Error getting student avatar:', error);
      return createErrorResponse(res, 500, `Failed to get avatar: ${error.message}`);
    }
  }

  /**
   * Delete student avatar
   */
  async deleteStudentAvatar(req, res) {
    try {
      const { studentId } = req.params;

      // Validate ID format
      if (!/^[0-9]+$/.test(studentId)) {
        return createErrorResponse(res, 400, 'Invalid ID format');
      }

      // Get student data
      const student = await prisma.student.findFirst({
        where: {
          id: BigInt(studentId),
          schoolId: req.user.schoolId,
          deletedAt: null
        },
        include: {
          user: true
        }
      });

      if (!student) {
        return createErrorResponse(res, 404, 'Student not found');
      }

      // Update user avatar to null
      await prisma.user.update({
        where: { id: student.userId },
        data: {
          avatar: null,
          updatedBy: req.user.id,
          updatedAt: new Date()
        }
      });

      return createSuccessResponse(res, 200, 'Avatar deleted successfully', {
        studentId: studentId
      });
    } catch (error) {
      console.error('Error in deleteStudentAvatar:', error);
      return createErrorResponse(res, 500, `Failed to delete avatar: ${error.message}`);
    }
  }

  /**
   * Bulk sync student status based on class assignment
   * Students with classId → ACTIVE
   * Students without classId → INACTIVE
   */
  async syncStudentStatus(req, res) {
    try {
      console.log('🔄 ===== BULK STUDENT STATUS SYNC STARTED =====');

      const schoolId = req.user.schoolId;

      if (!schoolId) {
        return createErrorResponse(res, 400, 'School ID is required');
      }

      // Get all students for the school
      const allStudents = await prisma.student.findMany({
        where: {
          schoolId: BigInt(schoolId),
          deletedAt: null
        },
        select: {
          id: true,
          userId: true,
          classId: true,
          user: {
            select: {
              id: true,
              status: true
            }
          }
        }
      });

      console.log(`📊 Found ${allStudents.length} students in school ${schoolId}`);

      let activated = 0;
      let deactivated = 0;
      let unchanged = 0;

      // Process each student
      for (const student of allStudents) {
        const shouldBeActive = student.classId !== null;
        const currentStatus = student.user.status;
        const newStatus = shouldBeActive ? 'ACTIVE' : 'INACTIVE';

        if (currentStatus !== newStatus) {
          await prisma.user.update({
            where: { id: student.userId },
            data: { status: newStatus }
          });

          if (newStatus === 'ACTIVE') {
            activated++;
          } else {
            deactivated++;
          }
        } else {
          unchanged++;
        }
      }

      console.log('✅ Status sync completed:', { activated, deactivated, unchanged });

      return res.json({
        success: true,
        message: 'Student status synced successfully',
        data: {
          total: allStudents.length,
          activated,
          deactivated,
          unchanged
        }
      });

    } catch (error) {
      console.error('❌ Error syncing student status:', error);
      return createErrorResponse(res, 500, `Failed to sync student status: ${error.message}`);
    }
  }

  /**
   * Transfer student - Mark student as transferred (no longer active in school)
   */
  async transferStudent(req, res) {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);
      const { transferDate, transferReason, transferredToSchool, remarks } = req.body;

      console.log('🔄 Transferring student:', studentId);

      // Get student first to check if exists
      const student = await prisma.student.findFirst({
        where: {
          id: studentId,
          schoolId: req.user.schoolId,
          deletedAt: null
        },
        include: {
          user: true
        }
      });

      if (!student) {
        return createErrorResponse(res, 404, 'Student not found');
      }

      // Check if already transferred
      if (student.user.status === 'TRANSFERRED') {
        return createErrorResponse(res, 400, 'Student is already transferred');
      }

      // Update student status to TRANSFERRED
      await prisma.user.update({
        where: { id: student.userId },
        data: {
          status: 'TRANSFERRED',
          metadata: JSON.stringify({
            ...JSON.parse(student.user.metadata || '{}'),
            transferDate: transferDate || new Date().toISOString(),
            transferReason: transferReason || 'School Transfer',
            transferredToSchool: transferredToSchool || null,
            transferRemarks: remarks || null,
            transferredBy: req.user.id.toString(),
            transferredAt: new Date().toISOString()
          })
        }
      });

      // Audit log is handled by middleware

      console.log('✅ Student transferred successfully');

      return createSuccessResponse(
        res,
        200,
        'Student transferred successfully',
        {
          studentId: studentId,
          userId: student.userId,
          newStatus: 'TRANSFERRED',
          transferDate: transferDate || new Date().toISOString()
        }
      );

    } catch (error) {
      console.error('❌ Error transferring student:', error);
      return handlePrismaError(res, error, 'transferStudent');
    }
  }

  /**
   * Get student transfer certificate data
   * Returns comprehensive student information for school leaving certificate
   */
  async getStudentTransferCertificate(req, res) {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);

      console.log('📄 Fetching transfer certificate data for student:', studentId);

      // Fetch comprehensive student data
      const student = await prisma.student.findFirst({
        where: {
          id: studentId,
          schoolId: req.user.schoolId,
          deletedAt: null
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              dariName: true,
              birthDate: true,
              gender: true,
              phone: true,
              avatar: true,
              status: true
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              code: true,
              level: true
            }
          },
          section: {
            select: {
              id: true,
              name: true
            }
          },
          parent: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  dariName: true,
                  phone: true
                }
              }
            }
          },
          school: {
            select: {
              id: true,
              name: true,
              shortName: true,
              code: true,
              address: true,
              city: true,
              state: true,
              country: true,
              phone: true,
              logo: true,
              principal: true,
              establishedDate: true
            }
          },
          // Academic records
          grades: {
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
              subject: {
                select: {
                  name: true,
                  code: true
                }
              },
              exam: {
                select: {
                  name: true,
                  startDate: true,
                  endDate: true,
                  type: true
                }
              }
            }
          },
          // Attendance records
          attendances: {
            orderBy: { date: 'desc' },
            take: 365,
            select: {
              id: true,
              date: true,
              status: true,
              remarks: true,
              createdBy: true,
              inTime: true,
              outTime: true
            }
          },
          // Documents
          documents: {
            where: {
              deletedAt: null
            },
            select: {
              id: true,
              type: true,
              title: true,
              path: true,
              size: true,
              mimeType: true,
              createdAt: true
            }
          }
        }
      });

      if (!student) {
        return createErrorResponse(res, 404, 'Student not found');
      }

      // Calculate attendance statistics
      const totalDays = student.attendances?.length || 0;
      const presentDays = student.attendances?.filter(a => a.status === 'PRESENT')?.length || 0;
      const absentDays = student.attendances?.filter(a => a.status === 'ABSENT')?.length || 0;
      const excusedDays = student.attendances?.filter(a => a.status === 'EXCUSED')?.length || 0;
      const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

      // Calculate academic performance
      const gradesBySubject = {};
      student.grades?.forEach(grade => {
        const subjectName = grade.subject?.name || 'Unknown';
        if (!gradesBySubject[subjectName]) {
          gradesBySubject[subjectName] = [];
        }
        gradesBySubject[subjectName].push({
          grade: grade.grade,
          score: grade.score,
          maxScore: grade.maxScore,
          examName: grade.exam?.name,
          examStartDate: grade.exam?.startDate,
          examEndDate: grade.exam?.endDate,
          examType: grade.exam?.type
        });
      });

      // Calculate overall performance
      const totalGrades = student.grades?.length || 0;
      const averageScore = totalGrades > 0
        ? (student.grades.reduce((sum, g) => sum + (g.score || 0), 0) / totalGrades).toFixed(2)
        : 0;

      // Group documents by type
      const documentsByType = {};
      student.documents?.forEach(doc => {
        const type = doc.type || 'OTHER';
        if (!documentsByType[type]) {
          documentsByType[type] = [];
        }
        documentsByType[type].push(doc);
      });

      // Prepare transfer certificate data
      const transferCertificateData = {
        // Student Information
        student: {
          id: student.id,
          userId: student.userId,
          admissionNo: student.admissionNo,
          rollNo: student.rollNo,
          cardNo: student.cardNo,
          firstName: student.user?.firstName,
          lastName: student.user?.lastName,
          dariName: student.user?.dariName,
          dateOfBirth: student.user?.birthDate,
          gender: student.user?.gender,
          phone: student.user?.phone,
          photo: student.user?.avatar,
          bloodGroup: student.bloodGroup,
          nationality: student.nationality,
          religion: student.religion,
          admissionDate: student.admissionDate,
          status: student.user?.status
        },

        // School Information
        school: {
          name: student.school?.name,
          shortName: student.school?.shortName,
          code: student.school?.code,
          address: student.school?.address,
          city: student.school?.city,
          state: student.school?.state,
          country: student.school?.country,
          phone: student.school?.phone,
          logo: student.school?.logo,
          principal: student.school?.principal,
          establishedDate: student.school?.establishedDate
        },

        // Class Information
        class: {
          name: student.class?.name,
          code: student.class?.code,
          grade: student.class?.level
        },

        section: {
          name: student.section?.name
        },

        // Parent Information
        parent: {
          name: student.parent?.user?.dariName ||
            `${student.parent?.user?.firstName || ''} ${student.parent?.user?.lastName || ''}`.trim(),
          phone: student.parent?.user?.phone
        },

        // Academic Performance
        academics: {
          totalGrades: totalGrades,
          averageScore: averageScore,
          gradesBySubject: gradesBySubject,
          recentGrades: student.grades?.slice(0, 10) || []
        },

        // Attendance Record
        attendance: {
          totalDays: totalDays,
          presentDays: presentDays,
          absentDays: absentDays,
          excusedDays: excusedDays,
          attendancePercentage: attendancePercentage
        },

        // Documents
        documents: {
          byType: documentsByType,
          total: student.documents?.length || 0
        },

        // Metadata
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: req.user.id,
          certificateNumber: `TC-${student.admissionNo}-${Date.now()}`
        }
      };

      console.log('✅ Transfer certificate data fetched successfully');

      return createSuccessResponse(
        res,
        200,
        'Transfer certificate data fetched successfully',
        transferCertificateData
      );

    } catch (error) {
      console.error('❌ Error fetching transfer certificate:', error);
      return handlePrismaError(res, error, 'getStudentTransferCertificate');
    }
  }

  /**
   * Retrieve student quota (usage vs limits) for the authenticated school
   */
  async getStudentQuota(req, res) {
    try {
      const schoolId = req.user?.schoolId || req.query?.schoolId;

      if (!schoolId) {
        return createErrorResponse(
          res,
          400,
          'School context is required to fetch student quota',
        );
      }

      const usageSnapshot = await calculateUsageSnapshot(schoolId);

      if (!usageSnapshot) {
        return createErrorResponse(
          res,
          404,
          'Unable to determine student quota for this school',
        );
      }

      const limit = usageSnapshot?.limits?.students ?? null;
      const used = usageSnapshot?.students ?? 0;
      const remaining = limit === null ? null : Math.max(Number(limit) - Number(used), 0);

      return createSuccessResponse(res, 200, 'Student quota fetched successfully', {
        limit,
        used,
        remaining,
        overLimit: limit !== null && Number(used) >= Number(limit),
        limits: usageSnapshot.limits,
        usage: usageSnapshot,
      });
    } catch (error) {
      console.error('Error fetching student quota:', error);
      return createErrorResponse(res, 500, error.message || 'Failed to fetch student quota');
    }
  }

  /**
   * Get student schedule/timetable
   * GET /api/students/:id/schedule
   */
  async getStudentSchedule(req, res) {
    try {
      const { id } = req.params;
      const { date } = req.query;
      const studentId = parseInt(id);

      if (!studentId || isNaN(studentId)) {
        return createErrorResponse(res, 400, 'Invalid student ID');
      }

      // Get student with class information
      const student = await prisma.student.findUnique({
        where: { id: BigInt(studentId) },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!student) {
        return createErrorResponse(res, 404, 'Student not found');
      }

      if (!student.classId) {
        return createSuccessResponse(res, {
          studentId: student.id.toString(),
          studentName: `${student.user.firstName} ${student.user.lastName}`,
          className: null,
          schedule: [],
          message: 'Student is not assigned to a class'
        });
      }

      // Get schedule for the student's class
      // If date is provided, filter by that date; otherwise get current week
      const targetDate = date ? new Date(date) : new Date();
      const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Adjust for Afghanistan week (Saturday = 0, Sunday = 1, ..., Thursday = 5)
      const afghanDay = dayOfWeek === 6 ? 0 : dayOfWeek + 1; // Saturday becomes 0

      // Get timetable entries for the class
      const timetableEntries = await prisma.timetable.findMany({
        where: {
          classId: student.classId,
          schoolId: student.schoolId,
          deletedAt: null
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        },
        orderBy: [
          { day: 'asc' },
          { startTime: 'asc' }
        ]
      });

      // Fetch teacher data separately for each timetable entry
      const teacherIds = [...new Set(timetableEntries.map(entry => entry.teacherId))];
      const teachers = await prisma.teacher.findMany({
        where: {
          id: { in: teacherIds },
          deletedAt: null
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      const teacherMap = new Map(teachers.map(t => [t.id.toString(), t]));

      // Filter by day if date is provided
      const filteredSchedule = date
        ? timetableEntries.filter(entry => entry.day === afghanDay)
        : timetableEntries;

      const formattedSchedule = filteredSchedule.map(entry => {
        const teacher = teacherMap.get(entry.teacherId.toString());
        return {
          id: entry.id.toString(),
          dayOfWeek: entry.day,
          dayName: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'][entry.day] || 'Unknown',
          startTime: entry.startTime,
          endTime: entry.endTime,
          subject: {
            id: entry.subjectId?.toString(),
            name: entry.subject?.name,
            code: entry.subject?.code
          },
          teacher: teacher ? {
            id: entry.teacherId?.toString(),
            name: `${teacher.user?.firstName || ''} ${teacher.user?.lastName || ''}`.trim()
          } : null,
          room: entry.roomNumber || null
        };
      });

      return createSuccessResponse(res, {
        studentId: student.id.toString(),
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        className: student.class.name,
        classCode: student.class.code,
        date: date || targetDate.toISOString().split('T')[0],
        schedule: formattedSchedule,
        totalPeriods: formattedSchedule.length
      });

    } catch (error) {
      console.error('Error in getStudentSchedule:', error);
      return handlePrismaError(res, error, 'getStudentSchedule');
    }
  }
}

export default new StudentController(); 