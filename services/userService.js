import prisma from '../utils/prismaClient.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  UserCreateSchema,
  UserUpdateSchema,
  UserSearchSchema,
  UserAuthSchema,
  UserPasswordChangeSchema,
  UserProfileUpdateSchema,
  generateUsername,
  generateStudentId,
  generateRollNumber,
  formatPhoneNumber,
  validatePasswordStrength,
  generateUserStats,
  generateUserAnalytics,
  buildUserSearchQuery,
  buildUserIncludeQuery,
  generateUserExportData,
  validateUserImportData,
  generateUsernameSuggestions,
  calculateUserPerformance,
} from '../utils/userSchemas.js';
import { UserPatchSchema } from '../utils/userSchemas.js';
import {
  getUserFromCache,
  setUserInCache,
  getUsersFromCache,
  setUsersInCache,
  getUserCountFromCache,
  setUserCountInCache,
  getUserStatsFromCache,
  setUserStatsInCache,
  getUserAnalyticsFromCache,
  setUserAnalyticsInCache,
  getUserPerformanceFromCache,
  setUserPerformanceInCache,
  getUserSearchFromCache,
  setUserSearchFromCache,
  getUserExportFromCache,
  setUserExportFromCache,
  invalidateUserCacheOnCreate,
  invalidateUserCacheOnUpdate,
  invalidateUserCacheOnDelete,
  invalidateUserCacheOnBulkOperation,
} from '../cache/userCache.js';
import { getUserPermissions } from '../middleware/auth.js';

const VALID_USER_ROLES = new Set([
  'SUPER_ADMIN',
  'SUPER_DUPER_ADMIN',
  'SCHOOL_ADMIN',
  'TEACHER',
  'STUDENT',
  'STAFF',
  'HRM',
  'PARENT',
  'ACCOUNTANT',
  'LIBRARIAN',
  'CRM_MANAGER',
  'BRANCH_MANAGER',
  'COURSE_MANAGER',
]);

const FALLBACK_USER_ROLE = 'HRM';

const normalizeUserRole = (role) => {
  if (!role) return null;
  const normalized = role.toString().trim().toUpperCase();
  if (!normalized) return null;
  return VALID_USER_ROLES.has(normalized) ? normalized : null;
};

// ======================
// JWT CONFIGURATION
// ======================

const JWT_SECRET = (() => {
  const value = process.env.JWT_SECRET;
  if (!value) {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }
  return value;
})();

// ======================
// USER SERVICE CLASS
// ======================

class UserService {
  constructor() {
    this.prisma = prisma;
  }

  async repairInvalidUserRoles() {
    try {
      await this.prisma.$executeRaw`
        UPDATE users
        SET role = ${FALLBACK_USER_ROLE}
        WHERE role IS NULL OR role = ''
      `;
    } catch (error) {
      console.warn('Failed to repair invalid user roles:', error?.message || error);
    }
  }

  // ======================
  // CRUD OPERATIONS
  // ======================

  /**
   * Create a new user (supports two-part payload: userData, staffData, teacherData)
   * Enhanced with HR fields and metadata storage
   */
  async createUser(userData, createdBy, staffData = null, teacherData = null) {
    const prisma = this.prisma;
    try {
      // No validation - use raw data directly
      const validatedData = userData;
      validatedData.username = validatedData.username?.trim?.() || validatedData.username;
      
      // Normalize role if provided, but don't require it
      let resolvedRole = validatedData.role;
      if (validatedData.role) {
        const normalized = normalizeUserRole(validatedData.role);
        if (normalized) {
          resolvedRole = normalized;
          validatedData.role = normalized;
        }
      }

      // Check if username already exists using raw SQL to avoid datetime issues
      const existingUsername = await prisma.$queryRaw`
        SELECT id FROM users WHERE username = ${validatedData.username} LIMIT 1
      `;
      if (existingUsername && existingUsername.length > 0) {
        throw new Error('Username already exists');
      }

      // No email validation - skip duplicate check
      // No phone formatting - use as-is

      // Hash password with separate salt
      const passwordToHash = validatedData.password || 'Hr@12345';
      const saltRounds = 12;
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(passwordToHash, salt);
      
      // Generate student ID if needed
      if (validatedData.role === 'STUDENT' && !validatedData.studentId) {
        const school = await prisma.school.findUnique({
          where: { id: BigInt(validatedData.schoolId) },
          select: { code: true }
        });
        if (school) {
          const currentYear = new Date().getFullYear();
          const studentCount = await prisma.user.count({
            where: {
              role: 'STUDENT',
              schoolId: BigInt(validatedData.schoolId),
              createdAt: {
                gte: new Date(currentYear, 0, 1),
                lt: new Date(currentYear + 1, 0, 1)
              }
            }
          });
          validatedData.studentId = generateStudentId(school.code, currentYear, studentCount + 1);
        }
      }
      
      // Generate roll number if needed
      if (validatedData.role === 'STUDENT' && validatedData.classId && !validatedData.rollNumber) {
        const classStudentCount = await prisma.user.count({
          where: {
            role: 'STUDENT',
            classId: BigInt(validatedData.classId)
          }
        });
        validatedData.rollNumber = generateRollNumber(validatedData.classId, classStudentCount + 1);
      }

      // --- Prepare metadata for role-specific data ---
      const metadata = {
        // Branch and Course assignments stored in metadata
        branchId: validatedData.branchId || null,
        courseId: validatedData.courseId || null,
        
        // Teaching-specific data
        subjectsCanTeach: validatedData.subjectsCanTeach || [],
        
        // Contract and salary information
        contractDates: validatedData.contractDates || null,
        salaryStructure: validatedData.salaryStructure || null,
        
        // Professional information
        totalExperience: validatedData.totalExperience || 0,
        relevantExperience: validatedData.relevantExperience || '',
        shift: validatedData.shift || 'morning',
        workTime: validatedData.workTime || 'FullTime',
        
        // Emergency contacts (encrypt phone numbers if possible)
        relativesInfo: Array.isArray(validatedData.relativesInfo)
          ? validatedData.relativesInfo.map(r => {
              try {
                const { encrypt } = require('../utils/encryption.js');
                return { ...r, phone: r.phone ? encrypt(String(r.phone)) : r.phone };
              } catch {
                return r;
              }
            })
          : [],
        
        // Course preferences for teaching roles
        coursePreferences: validatedData.coursePreferences || {},
        
        // Course assignments
        courseAssignments: validatedData.courseAssignments || [],
        
        // Document file references
        documents: {
          profilePicture: validatedData.profilePicture || null,
          cvFile: validatedData.cvFile || null,
          tazkiraFile: validatedData.tazkiraFile || null,
          lastDegreeFile: validatedData.lastDegreeFile || null,
          experienceFile: validatedData.experienceFile || null,
          contractFile: validatedData.contractFile || null,
          bankAccountFile: validatedData.bankAccountFile || null
        }
      };

      // --- Begin Transaction ---
      const result = await prisma.$transaction(async (tx) => {
        // Create a copy of validatedData for user creation (without HR-specific fields)
        const {
          departmentId,
          employeeId,
          designation,
          qualification,
          specialization,
          joiningDate,
          experience,
          salary,
          isClassTeacher,
          accountNumber,
          bankName,
          ifscCode,
          subjectsCanTeach,
          contractDates,
          salaryStructure,
          totalExperience,
          relevantExperience,
          shift,
          workTime,
          relativesInfo,
          courseAssignments,
          coursePreferences,
          profilePicture,
          cvFile,
          tazkiraFile,
          lastDegreeFile,
          experienceFile,
          contractFile,
          bankAccountFile,
          tazkiraNo,
          ...userData
        } = validatedData;

        // 1. Create the user with metadata
        console.log('=== DEBUG: User creation data ===');
        console.log('userData keys:', Object.keys(userData));
        console.log('metadata keys:', Object.keys(metadata));
        console.log('validatedData.schoolId:', validatedData.schoolId);
        console.log('validatedData.createdByOwnerId:', validatedData.createdByOwnerId);
        console.log('createdBy:', createdBy);

        // Remove any timestamp fields from userData
        const { createdAt, updatedAt, lastLogin, ...cleanUserData } = userData;

        const userCreateData = {
          ...cleanUserData,
          password: hashedPassword,
          salt,
          role: resolvedRole,
          schoolId: validatedData.schoolId ? BigInt(validatedData.schoolId) : null,
          branchId: validatedData.branchId ? BigInt(validatedData.branchId) : null,
          createdByOwnerId: validatedData.createdByOwnerId ? BigInt(validatedData.createdByOwnerId) : BigInt(createdBy || 1),
          createdBy: createdBy ? BigInt(createdBy) : null,
          metadata: JSON.stringify(metadata),
        };

        console.log('userCreateData keys:', Object.keys(userCreateData));
        console.log('=== END DEBUG ===');

        console.log('=== DEBUG: About to create user with Prisma ===');
        console.log('No timestamps set - letting Prisma handle them automatically');
        console.log('=== END DEBUG ===');

        console.log('=== DEBUG: Creating user record with direct SQL ===');

        try {
          // Use direct SQL query without Prisma to avoid datetime issues
          const { randomUUID } = await import('crypto');
          const uuid = randomUUID();
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

          const insertResult = await tx.$executeRaw`
            INSERT INTO users (
              uuid, username, firstName, lastName, password, salt, 
              role, status, schoolId, branchId, timezone, locale, createdByOwnerId, createdBy,
              phone, metadata,
              createdAt, updatedAt
            ) VALUES (
              ${uuid}, ${userCreateData.username}, ${userCreateData.firstName}, ${userCreateData.lastName},
              ${userCreateData.password}, ${userCreateData.salt},
              ${userCreateData.role}, ${userCreateData.status}, 
              ${userCreateData.schoolId}, ${userCreateData.branchId || null},
              ${userCreateData.timezone}, ${userCreateData.locale}, ${userCreateData.createdByOwnerId}, 
              ${userCreateData.createdBy || null},
              ${userCreateData.phone || null}, 
              ${userCreateData.metadata || '{}'},
              ${now}, ${now}
            )
          `;

          console.log('=== DEBUG: INSERT completed, rows affected:', insertResult);

          // Get the created user using raw SQL to avoid Prisma datetime issues
          const userResult = await tx.$queryRaw`
            SELECT * FROM users WHERE username = ${userCreateData.username} LIMIT 1
          `;

          if (!userResult || userResult.length === 0) {
            throw new Error('User not found after creation');
          }

          const user = userResult[0];
          console.log('=== DEBUG: User created successfully with direct SQL ===');
          console.log('User ID:', user.id);

          // 2. If role is TEACHER or SCHOOL_ADMIN, create teacher record
          if (user.role === 'TEACHER' || user.role === 'SCHOOL_ADMIN') {
            // Merge teacherData and validatedData for required fields
            const tData = { ...validatedData, ...(teacherData || {}) };

            // Auto-generate departmentId and employeeId if not provided
            tData.departmentId = tData.departmentId || 1;
            tData.schoolId = tData.schoolId || validatedData.schoolId;
            tData.employeeId = tData.employeeId || `${user.role}_${user.id}`;

            // Set default values for SCHOOL_ADMIN if not provided
            if (user.role === 'SCHOOL_ADMIN') {
              tData.qualification = tData.qualification || 'Administrator';
              tData.specialization = tData.specialization || 'School Administration';
              tData.experience = tData.experience || 0;
              tData.isClassTeacher = tData.isClassTeacher || false;
            }

            // Set defaults for TEACHER if not provided
            if (user.role === 'TEACHER') {
              tData.qualification = tData.qualification || '';
              tData.specialization = tData.specialization || '';
              tData.experience = tData.experience || 0;
              tData.isClassTeacher = tData.isClassTeacher || false;
            }

            // Use raw SQL to create teacher record to avoid Prisma relation issues
            const { randomUUID: randomUUID2 } = await import('crypto');
            const teacherUuid = randomUUID2();
            const joiningDate = tData.joiningDate ? new Date(tData.joiningDate).toISOString().slice(0, 19).replace('T', ' ') : now;
            // Use createdBy if available, otherwise use the user's own ID (self-created)
            const teacherCreatedBy = createdBy || user.id;

            await tx.$executeRaw`
              INSERT INTO teachers (
                uuid, userId, employeeId, departmentId, schoolId,
                qualification, specialization, joiningDate, experience,
                salary, isClassTeacher, createdBy, createdAt, updatedAt
              ) VALUES (
                ${teacherUuid}, ${user.id}, ${tData.employeeId}, ${tData.departmentId || null},
                ${tData.schoolId}, ${tData.qualification || ''}, ${tData.specialization || ''},
                ${joiningDate}, ${tData.experience || 0}, ${tData.salary || null},
                ${tData.isClassTeacher || false}, ${teacherCreatedBy}, ${now}, ${now}
              )
            `;

            console.log(`✅ Created teacher record for ${user.role} user:`, {
              userId: user.id,
              employeeId: tData.employeeId,
              role: user.role
            });
          }
          
          // 3. If role is STAFF, HRM, CRM_MANAGER, ACCOUNTANT, LIBRARIAN, create staff record
          if ([
            'STAFF',
            'HRM',
            'CRM_MANAGER',
            'ACCOUNTANT',
            'LIBRARIAN'
          ].includes(user.role)) {
            // Merge staffData and validatedData for required fields
            const sData = { ...validatedData, ...(staffData || {}) };

            // Auto-generate departmentId and employeeId if not provided
            const staffDepartmentId = sData.departmentId ? BigInt(sData.departmentId) : BigInt(1);
            const staffEmployeeId = sData.employeeId || `${user.role}_${user.id}`;
            const staffJoiningDate = sData.joiningDate ? new Date(sData.joiningDate).toISOString().slice(0, 19).replace('T', ' ') : now;
            const staffSalary = sData.salary ?? null;
            const staffDesignation = sData.designation || user.role;
            const { randomUUID: randomUUID3 } = await import('crypto');
            const staffUuid = randomUUID3();
            const staffCreatedBy = createdBy || user.id;

            await tx.$executeRaw`
              INSERT INTO staff (
                uuid, userId, employeeId, departmentId, schoolId,
                designation, joiningDate, salary, accountNumber,
                bankName, ifscCode, createdBy, createdAt, updatedAt
              ) VALUES (
                ${staffUuid}, ${user.id}, ${staffEmployeeId}, ${staffDepartmentId},
                ${BigInt(validatedData.schoolId)}, ${staffDesignation}, ${staffJoiningDate},
                ${staffSalary}, ${sData.accountNumber || null}, ${sData.bankName || null},
                ${sData.ifscCode || null}, ${staffCreatedBy}, ${now}, ${now}
              )
            `;
          }

          // 4. Create course assignments if provided
          if (metadata.courseAssignments && metadata.courseAssignments.length > 0) {
            for (const assignment of metadata.courseAssignments) {
              const { randomUUID: randomUUID4 } = await import('crypto');
              const assignmentUuid = randomUUID4();
              
              await tx.$executeRaw`
                INSERT INTO teacher_course_assignments (
                  uuid, teacherId, courseId, schoolId, branchId,
                  role, salary, schedule, assignedBy, createdAt, updatedAt
                ) VALUES (
                  ${assignmentUuid}, ${user.id}, ${BigInt(assignment.courseId)},
                  ${BigInt(validatedData.schoolId)}, ${userCreateData.branchId || null},
                  ${assignment.role}, ${JSON.stringify(assignment.salary || {})},
                  ${JSON.stringify(assignment.schedule || {})}, ${BigInt(createdBy || user.id)},
                  ${now}, ${now}
                )
              `;
            }
          }

          // Return user object in Prisma format for compatibility
          return {
            id: user.id,
            uuid: user.uuid,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone || null,
            role: user.role,
            status: user.status,
            schoolId: user.schoolId,
            branchId: user.branchId,
            classId: user.classId || null,
            departmentId: user.departmentId || null,
            timezone: user.timezone,
            locale: user.locale,
            tazkiraNo: user.tazkiraNo,
            dateOfBirth: user.dateOfBirth,
            metadata: user.metadata,
            createdByOwnerId: user.createdByOwnerId,
            createdBy: user.createdBy,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            school: null, // Will be populated later if needed
            sessions: []
          };

        } catch (sqlError) {
          console.error('=== DEBUG: SQL INSERT failed ===');
          console.error('SQL Error:', sqlError.message);
          console.error('Full error:', sqlError);
          throw sqlError;
        }
      });

      // Convert BigInt values to strings for JSON serialization
      const convertBigIntToString = (value) => {
        if (value === null || value === undefined) {
          return value;
        }

        if (typeof value === 'bigint') {
          return value.toString();
        }

        if (value instanceof Date) {
          return value.toISOString();
        }

        if (Array.isArray(value)) {
          return value.map(convertBigIntToString);
        }

        if (typeof value === 'object') {
          return Object.fromEntries(
            Object.entries(value).map(([key, val]) => [key, convertBigIntToString(val)])
          );
        }

        return value;
      };

      // Invalidate cache
      invalidateUserCacheOnCreate(validatedData.createdByOwnerId);
      // Set in cache
      setUserInCache(result.id.toString(), result);
      return {
        success: true,
        data: convertBigIntToString(result),
        message: 'User created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.errors || null
      };
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId, include = null) {
    try {
      // Check cache first
      const cachedUser = getUserFromCache(userId);
      if (cachedUser) {
        return {
          success: true,
          data: cachedUser,
          source: 'cache'
        };
      }

      // Build include query
      const includeQuery = buildUserIncludeQuery(include);

      // Get from database
      const user = await this.prisma.user.findUnique({
        where: { id: BigInt(userId) },
        include: includeQuery
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Set in cache
      setUserInCache(userId, user);

      return {
        success: true,
        data: user,
        source: 'database'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get users with pagination and filters
   */
  async getUsers(filters = {}, include = null) {
    try {
      // Validate filters
      const validatedFilters = UserSearchSchema.parse(filters);

      // Check cache first
      const cachedUsers = getUsersFromCache(validatedFilters);
      if (cachedUsers) {
        return {
          success: true,
          data: cachedUsers,
          source: 'cache'
        };
      }

      // Calculate pagination
      const page = validatedFilters.page;
      const limit = validatedFilters.limit;
      const skip = (page - 1) * limit;

      // Use raw SQL to avoid datetime issues
      const users = await this.prisma.$queryRaw`
        SELECT 
          id, uuid, username, firstName, lastName, email, phone,
          role, status, schoolId, classId, departmentId,
          timezone, locale, createdAt, updatedAt
        FROM users 
        WHERE deletedAt IS NULL
        ORDER BY id DESC
        LIMIT ${limit} OFFSET ${skip}
      `;

      const totalResult = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count FROM users WHERE deletedAt IS NULL
      `;
      const total = Number(totalResult[0]?.count || 0);

      const result = {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        }
      };

      // Set in cache
      setUsersInCache(validatedFilters, result);

      return {
        success: true,
        data: result,
        source: 'database'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.errors || null
      };
    }
  }

  /**
   * Update user
   */
  async updateUser(userId, updateData, updatedBy) {
    try {
      // Validate input data
      const validatedData = UserUpdateSchema.parse(updateData);

      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id: BigInt(userId) }
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      // Check for unique constraints
      if (validatedData.username) {
        const existingUsername = await this.prisma.user.findFirst({
          where: {
            username: validatedData.username,
            id: { not: BigInt(userId) }
          }
        });

        if (existingUsername) {
          throw new Error('Username already exists');
        }
      }

      if (validatedData.email) {
        const existingEmail = await this.prisma.user.findFirst({
          where: {
            email: validatedData.email,
            id: { not: BigInt(userId) }
          }
        });

        if (existingEmail) {
          throw new Error('Email already exists');
        }
      }

      // Hash password if provided
      let hashedPassword = undefined;
      let salt = undefined;
      if (validatedData.password) {
        const saltRounds = 12;
        salt = await bcrypt.genSalt(saltRounds);
        hashedPassword = await bcrypt.hash(validatedData.password, salt);
      }

      // Format phone number
      if (validatedData.phone) {
        validatedData.phone = formatPhoneNumber(validatedData.phone);
      }

      // Update user
      const user = await this.prisma.user.update({
        where: { id: BigInt(userId) },
        data: {
          ...validatedData,
          password: hashedPassword,
          salt,
          schoolId: validatedData.schoolId ? BigInt(validatedData.schoolId) : undefined,
          departmentId: validatedData.departmentId ? BigInt(validatedData.departmentId) : undefined,
          classId: validatedData.classId ? BigInt(validatedData.classId) : undefined,
          updatedBy: updatedBy ? BigInt(updatedBy) : undefined,
        }
      });

      // Invalidate cache
      invalidateUserCacheOnUpdate(userId, user.createdByOwnerId.toString());

      // Set in cache
      setUserInCache(userId, user);

      // Return simple success response without the full user object to avoid BigInt serialization
      return {
        success: true,
        data: {
          id: user.id.toString(),
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          isActive: user.status === 'ACTIVE'
        },
        message: 'User updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.errors || null
      };
    }
  }

  /**
   * Patch user (partial update)
   */
  async patchUser(userId, updateData, updatedBy) {
    try {
      const validatedData = UserPatchSchema.parse(updateData);
      // Remove relational payloads that don't belong to the User model to avoid Prisma nested update errors
      const { teacher, ...cleanData } = validatedData || {};
      // Keep teacher for nested update; do not include in user data payload
      // Note: cleanData is used for prisma.user.update, teacher is handled separately

      const existingUser = await this.prisma.user.findUnique({ where: { id: BigInt(userId) } });
      if (!existingUser) {
        throw new Error('User not found');
      }

      if (validatedData.username) {
        const existingUsername = await this.prisma.user.findFirst({
          where: { username: validatedData.username, id: { not: BigInt(userId) } }
        });
        if (existingUsername) throw new Error('Username already exists');
      }
      if (validatedData.email) {
        const existingEmail = await this.prisma.user.findFirst({
          where: { email: validatedData.email, id: { not: BigInt(userId) } }
        });
        if (existingEmail) throw new Error('Email already exists');
      }

      let hashedPassword;
      let salt;
      if (validatedData.password) {
        salt = await bcrypt.genSalt(12);
        hashedPassword = await bcrypt.hash(validatedData.password, salt);
      }

      if (cleanData.phone) {
        cleanData.phone = formatPhoneNumber(cleanData.phone);
      }

      const user = await this.prisma.user.update({
        where: { id: BigInt(userId) },
        data: {
          ...cleanData,
          password: hashedPassword,
          salt,
          schoolId: cleanData.schoolId ? BigInt(cleanData.schoolId) : undefined,
          departmentId: cleanData.departmentId ? BigInt(cleanData.departmentId) : undefined,
          classId: cleanData.classId ? BigInt(cleanData.classId) : undefined,
          updatedBy: updatedBy ? BigInt(updatedBy) : undefined,
        }
      });

      // Nested teacher upsert/update if teacher payload provided
      if (teacher && typeof teacher === 'object' && Object.keys(teacher).length > 0) {
        const existingTeacher = await this.prisma.teacher.findUnique({ where: { userId: user.id } });

        const tData = { ...teacher };
        // Coerce numeric ids to BigInt if present
        const teacherUpdateData = {
          employeeId: tData.employeeId,
          qualification: tData.qualification,
          specialization: tData.specialization,
          joiningDate: tData.joiningDate ? new Date(tData.joiningDate) : undefined,
          experience: tData.experience,
          salary: tData.salary,
          isClassTeacher: typeof tData.isClassTeacher === 'boolean' ? tData.isClassTeacher : undefined,
          departmentId: tData.departmentId != null ? BigInt(tData.departmentId) : undefined,
          schoolId: tData.schoolId != null ? BigInt(tData.schoolId) : undefined,
          updatedAt: new Date(),
        };

        if (existingTeacher) {
          await this.prisma.teacher.update({
            where: { userId: user.id },
            data: teacherUpdateData,
          });
        } else {
          // Create teacher record if missing
          await this.prisma.teacher.create({
            data: {
              userId: user.id,
              employeeId: tData.employeeId || `${user.role}_${user.id.toString()}`,
              departmentId: teacherUpdateData.departmentId ?? null,
              schoolId: teacherUpdateData.schoolId ?? (user.schoolId ? BigInt(user.schoolId) : null),
              qualification: tData.qualification || '',
              specialization: tData.specialization || '',
              joiningDate: teacherUpdateData.joiningDate || new Date(),
              experience: tData.experience || 0,
              salary: tData.salary ?? null,
              isClassTeacher: teacherUpdateData.isClassTeacher ?? false,
              createdBy: updatedBy ? BigInt(updatedBy) : user.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      }

      invalidateUserCacheOnUpdate(userId, user.createdByOwnerId.toString());
      setUserInCache(userId, user);

      return {
        success: true,
        data: {
          id: user.id.toString(),
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          isActive: user.status === 'ACTIVE'
        },
        message: 'User updated successfully'
      };
    } catch (error) {
      return { success: false, error: error.message, details: error.errors || null };
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(userId, deletedBy) {
    try {
      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id: BigInt(userId) }
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      // Soft delete
      const user = await this.prisma.user.update({
        where: { id: BigInt(userId) },
        data: {
          deletedAt: new Date(),
          updatedBy: deletedBy ? BigInt(deletedBy) : undefined,
        }
      });

      // Invalidate cache
      invalidateUserCacheOnDelete(userId, user.createdByOwnerId.toString());

      return {
        success: true,
        data: user,
        message: 'User deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Restore deleted user
   */
  async restoreUser(userId, restoredBy) {
    try {
      // Check if user exists and is deleted
      const existingUser = await this.prisma.user.findUnique({
        where: { id: BigInt(userId) }
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      if (!existingUser.deletedAt) {
        throw new Error('User is not deleted');
      }

      // Restore user
      const user = await this.prisma.user.update({
        where: { id: BigInt(userId) },
        data: {
          deletedAt: null,
          updatedBy: restoredBy ? BigInt(restoredBy) : undefined,
        }
      });

      // Invalidate cache
      invalidateUserCacheOnUpdate(userId, user.createdByOwnerId.toString());

      // Set in cache
      setUserInCache(userId, user);

      // Return simple success response without the full user object to avoid BigInt serialization
      return {
        success: true,
        data: {
          id: user.id.toString(),
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          isActive: user.status === 'ACTIVE'
        },
        message: 'User restored successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ======================
  // AUTHENTICATION OPERATIONS
  // ======================

  /**
   * Universal login for both users and owners
   */
  async loginUser(loginData, deviceInfo = {}) {
    try {
      // Validate login data
      const validatedData = UserAuthSchema.parse(loginData);

      console.log('🔍 Login attempt for username:', validatedData.username);

      const fetchRawUserByUsername = async () => {
        const rows = await this.prisma.$queryRaw`
          SELECT * FROM users WHERE username = ${validatedData.username} LIMIT 1
        `;
        return rows?.[0] ?? null;
      };

      const usernameLookup = validatedData.username.trim();

      const findUserByUsername = async () => {
        const rows = await this.prisma.$queryRaw`
          SELECT * FROM users WHERE LOWER(username) = LOWER(${usernameLookup}) LIMIT 1
        `;
        return rows?.[0] ?? null;
      };

      // First, try to find user by username (case-sensitive, then fallback to case-insensitive)
      let user;
      try {
        user = await this.prisma.user.findUnique({
          where: { username: usernameLookup },
          select: {
            id: true,
            uuid: true,
            username: true,
            phone: true,
            firstName: true,
            lastName: true,
            displayName: true,
            password: true,
            salt: true,
            role: true,
            status: true,
            schoolId: true,
            timezone: true,
            locale: true,
            lastLogin: true,
            lastIp: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
          }
        });
      } catch (error) {
        const errorMessage = String(error?.message || '');
        if (errorMessage.includes("enum 'UserRole'")) {
          console.warn('⚠️ Detected invalid user role value during login. Attempting auto-repair.', {
            username: validatedData.username,
          });

          const rawUser = await findUserByUsername();
          if (rawUser) {
            const repairedRole = normalizeUserRole(rawUser.role) ?? FALLBACK_USER_ROLE;
            console.warn('⚙️ Repairing user role value', {
              userId: rawUser.id,
              previousRole: rawUser.role,
              repairedRole,
            });
            await this.prisma.$executeRaw`
              UPDATE users SET role = ${repairedRole}
              WHERE id = ${rawUser.id}
            `;

            user = await this.prisma.user.findUnique({
              where: { username: usernameLookup },
              select: {
                id: true,
                uuid: true,
                username: true,
                phone: true,
                firstName: true,
                lastName: true,
                displayName: true,
                password: true,
                salt: true,
                role: true,
                status: true,
                schoolId: true,
                timezone: true,
                locale: true,
                lastLogin: true,
                lastIp: true,
                createdAt: true,
                updatedAt: true,
                deletedAt: true,
              }
            });
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }

      if (!user) {
        user = await findUserByUsername();
      }

      if (user && !VALID_USER_ROLES.has(user.role)) {
        const repairedRole = normalizeUserRole(user.role) ?? FALLBACK_USER_ROLE;
        console.warn('⚙️ Normalizing unexpected user role value', {
          userId: user.id,
          previousRole: user.role,
          repairedRole,
        });
        await this.prisma.user.update({
          where: { id: user.id },
          data: { role: repairedRole },
        });
        user.role = repairedRole;
      }

      console.log('👤 User found in user table:', user ? 'YES' : 'NO');

      let isOwner = false;

      // If no user found, check if it's an owner (owners use email, not username)
      // Only check owner table if the username looks like an email (contains @)
      if (!user && validatedData.username.includes('@')) {
        console.log('🔍 Checking owner table for email:', validatedData.username);

        try {
          const owner = await this.prisma.owner.findUnique({
            where: { email: validatedData.username }
          });

          console.log('👑 Owner found:', owner ? 'YES' : 'NO');

          if (owner) {
            console.log('👑 Owner status:', owner.status);

            // Check if owner is active
            if (owner.status !== 'ACTIVE') {
              throw new Error('Account is not active. Please contact administrator.');
            }

            // Verify owner password using stored salt
            let isPasswordValid = false;
            if (owner.salt) {
              // Use the stored salt to hash the provided password and compare
              const hashedPassword = await bcrypt.hash(validatedData.password, owner.salt);
              isPasswordValid = hashedPassword === owner.password;
              console.log('🔐 Password validation (with salt):', isPasswordValid);
            } else {
              // Fallback to bcrypt.compare for backward compatibility
              isPasswordValid = await bcrypt.compare(validatedData.password, owner.password);
              console.log('🔐 Password validation (bcrypt.compare):', isPasswordValid);
            }

            if (!isPasswordValid) {
              throw new Error('Invalid username/email or password');
            }

            // Create a user-like object for owner
            user = {
              id: owner.id,
              email: owner.email,
              role: 'SUPER_ADMIN',
              status: owner.status,
              name: owner.name,
              timezone: owner.timezone,
              locale: owner.locale,
              emailVerified: owner.emailVerified,
              createdAt: owner.createdAt,
              metadata: owner.metadata,
              school: null,
              department: null,
              class: null,
            };

            isOwner = true;
            console.log('✅ Owner login successful');
          }
        } catch (error) {
          console.log('❌ Error checking owner table:', error.message);
          // Continue with user authentication if owner check fails
        }
      }

      // If still no user found, throw error
      if (!user) {
        console.log('❌ No user found with username:', validatedData.username);
        throw new Error('Invalid username or password');
      }

      if (user) {
        console.log('👤 User status:', user.status);

        // Check if user is active
        if (user.status !== 'ACTIVE') {
          throw new Error('Account is not active. Please contact administrator.');
        }

        // Verify user password using stored salt (if available)
        let isPasswordValid = false;
        if (user.salt) {
          // Use the stored salt to hash the provided password and compare
          const hashedPassword = await bcrypt.hash(validatedData.password, user.salt);
          isPasswordValid = hashedPassword === user.password;
          console.log('🔐 User password validation (with salt):', isPasswordValid);
        } else {
          // Fallback to bcrypt.compare for backward compatibility
          isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
          console.log('🔐 User password validation (bcrypt.compare):', isPasswordValid);
        }

        if (!isPasswordValid) {
          throw new Error('Invalid username/email or password');
        }

        console.log('✅ User login successful');
      }

      // Generate JWT token
      const tokenPayload = {
        userId: user.id.toString(),
        role: user.role,
        schoolId: user.schoolId?.toString(),
        name: `${user.firstName} ${user.lastName}`.trim(),
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: validatedData.rememberMe ? '30d' : '24h',
      });

      // NOTE: We intentionally skip writing session/last-login fields here
      // because the live database schema is older and missing some Prisma
      // columns (e.g. subjectsCanTeach). Any write via Prisma.user.update()
      // would fail; for now we only read from users and let login succeed
      // without touching those audit fields.

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      // Convert BigInt values to strings for JSON serialization
      const convertBigIntToString = (obj) => {
        if (Array.isArray(obj)) {
          return obj.map(convertBigIntToString);
        } else if (obj && typeof obj === 'object') {
          return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k, convertBigIntToString(v)])
          );
        } else if (typeof obj === 'bigint') {
          return obj.toString();
        }
        return obj;
      };

      // Fetch teacher details if role is SCHOOL_ADMIN
      let teacherDetails = null;
      if (!isOwner && user.role === 'SCHOOL_ADMIN') {
        try {
          const teacher = await this.prisma.teacher.findUnique({
            where: { userId: user.id },
            select: {
              id: true,
              uuid: true,
              employeeId: true,
              departmentId: true,
              qualification: true,
              specialization: true,
              joiningDate: true,
              experience: true,
              isClassTeacher: true,
              schoolId: true,
              department: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                }
              }
            }
          });

          if (teacher) {
            teacherDetails = convertBigIntToString(teacher);
          }
        } catch (error) {
          console.log('⚠️ Error fetching teacher details:', error.message);
          // Continue without teacher details
        }
      }

      // Determine managed entities (branches, courses, schools) for applicable roles
      let managedEntities = {
        branches: [],
        courses: [],
        schools: [],
      };

      // Check if user is super admin based on schools table
      // Note: ownerId references owners table, not users table, so we only check superAdminUserId
      let isSuperAdminOrOwner = false;
      if ((user.role || '').toUpperCase() === 'SUPER_ADMIN') {
        isSuperAdminOrOwner = true;
        console.log('✅ User role is SUPER_ADMIN');
      } else {
        // Check if user is superAdminUserId in any school
        try {
          // user.id is already BigInt from Prisma, so use it directly
          const userId = typeof user.id === 'bigint' ? user.id : BigInt(user.id);
          console.log('🔍 Checking if user is superAdminUserId in schools table. User ID:', userId.toString(), 'Type:', typeof userId);
          
          const schoolAsSuperAdmin = await this.prisma.school.findFirst({
            where: {
              superAdminUserId: userId,
            },
            select: { 
              id: true,
              superAdminUserId: true,
            },
          });
          
          console.log('🔍 School query result:', schoolAsSuperAdmin ? { 
            id: schoolAsSuperAdmin.id.toString(), 
            superAdminUserId: schoolAsSuperAdmin.superAdminUserId?.toString() 
          } : 'null');
          
          if (schoolAsSuperAdmin) {
            isSuperAdminOrOwner = true;
            console.log('✅ User is superAdminUserId for school:', schoolAsSuperAdmin.id.toString());
          } else {
            console.log('❌ User is not superAdminUserId for any school');
            // Debug: Let's also check what schools exist with superAdminUserId
            const allSchoolsWithSuperAdmin = await this.prisma.school.findMany({
              where: {
                superAdminUserId: { not: null },
              },
              select: {
                id: true,
                superAdminUserId: true,
              },
            });
            console.log('🔍 All schools with superAdminUserId:', allSchoolsWithSuperAdmin.map(s => ({
              id: s.id.toString(),
              superAdminUserId: s.superAdminUserId?.toString()
            })));
          }
        } catch (error) {
          console.log('⚠️ Error checking super admin status:', error.message);
          console.error('Error stack:', error.stack);
        }
      }

      if (
        !isOwner &&
        !isSuperAdminOrOwner &&
        ['TEACHER', 'SCHOOL_ADMIN', 'BRANCH_MANAGER', 'COURSE_MANAGER'].includes(
          (user.role || '').toUpperCase(),
        )
      ) {
        try {
          const [branchAssignmentsRaw, courseAssignmentsRaw] = await Promise.all([
            this.prisma.branchManagerAssignment.findMany({
              where: {
                userId: user.id,
                revokedAt: null,
              },
              select: {
                id: true,
                assignedAt: true,
                branch: {
                  select: {
                    id: true,
                    uuid: true,
                    name: true,
                    code: true,
                    status: true,
                    schoolId: true,
                    isMain: true,
                    timezone: true,
                    city: true,
                    country: true,
                    school: {
                      select: {
                        id: true,
                        uuid: true,
                        name: true,
                        code: true,
                        status: true,
                      },
                    },
                  },
                },
                school: {
                  select: {
                    id: true,
                    uuid: true,
                    name: true,
                    code: true,
                    status: true,
                  },
                },
              },
            }),
            this.prisma.courseManagerAssignment.findMany({
              where: {
                userId: user.id,
                revokedAt: null,
              },
              select: {
                id: true,
                assignedAt: true,
                course: {
                  select: {
                    id: true,
                    uuid: true,
                    name: true,
                    code: true,
                    level: true,
                    type: true,
                    isActive: true,
                    schoolId: true,
                    school: {
                      select: {
                        id: true,
                        uuid: true,
                        name: true,
                        code: true,
                        status: true,
                      },
                    },
                  },
                },
                school: {
                  select: {
                    id: true,
                    uuid: true,
                    name: true,
                    code: true,
                    status: true,
                  },
                },
              },
            }),
          ]);

          const schoolsMap = new Map();

          const managedBranches = branchAssignmentsRaw.map((assignment) => {
            const school = assignment.school || assignment.branch?.school || null;
            if (school) {
              const key = school.id?.toString() ?? school.uuid ?? school.code ?? JSON.stringify(school);
              if (!schoolsMap.has(key)) {
                schoolsMap.set(key, school);
              }
            }

            return {
              id: assignment.id,
              assignedAt: assignment.assignedAt,
              branch: assignment.branch,
              school,
            };
          });

          const managedCourses = courseAssignmentsRaw.map((assignment) => {
            const school = assignment.school || assignment.course?.school || null;
            if (school) {
              const key = school.id?.toString() ?? school.uuid ?? school.code ?? JSON.stringify(school);
              if (!schoolsMap.has(key)) {
                schoolsMap.set(key, school);
              }
            }

            return {
              id: assignment.id,
              assignedAt: assignment.assignedAt,
              course: assignment.course,
              school,
            };
          });

          managedEntities = {
            branches: managedBranches,
            courses: managedCourses,
            schools: Array.from(schoolsMap.values()),
          };
        } catch (error) {
          console.log('⚠️ Error fetching managed entities:', error.message);
        }
      }

     // Ensure SUPER_ADMIN or school super admin/owner gets all schools and branches in managedEntities
     console.log('🔍 About to check managed entities. isSuperAdminOrOwner:', isSuperAdminOrOwner);
     try {
       if (isSuperAdminOrOwner) {
         console.log('✅ isSuperAdminOrOwner is TRUE - fetching all schools, branches, and courses');
         const [allSchools, allBranches, allCourses] = await Promise.all([
           // Do not filter by deletedAt to avoid schema mismatch across deployments
           this.prisma.school.findMany({
             select: {
               id: true,
               uuid: true,
               name: true,
               code: true,
               status: true,
             },
             orderBy: { id: 'asc' },
           }),
           this.prisma.branch.findMany({
             select: {
               id: true,
               uuid: true,
               name: true,
               code: true,
               status: true,
               schoolId: true,
               school: {
                 select: {
                   id: true,
                   uuid: true,
                   name: true,
                   code: true,
                   status: true,
                 },
               },
             },
             orderBy: { id: 'asc' },
           }),
           this.prisma.course.findMany({
             select: {
               id: true,
               uuid: true,
               name: true,
               code: true,
               level: true,
               type: true,
               isActive: true,
               schoolId: true,
               school: {
                 select: {
                   id: true,
                   uuid: true,
                   name: true,
                   code: true,
                   status: true,
                 },
               },
             },
             orderBy: { id: 'asc' },
           }),
         ]);

        if (Array.isArray(allSchools) && allSchools.length > 0) {
          managedEntities.schools = allSchools;
        } else {
          // Last resort: synthesize one school from user's schoolId or default to '1'
          const fallbackId = String(user.schoolId || '1');
          managedEntities.schools = [
            {
              id: fallbackId,
              uuid: null,
              name: 'Kawish Private High School',
              code: null,
              status: 'ACTIVE',
            },
          ];
        }

         if (Array.isArray(allBranches) && allBranches.length > 0) {
           managedEntities.branches = allBranches.map((b) => ({
             id: b.id,
             assignedAt: null,
             branch: {
               id: b.id,
               uuid: b.uuid,
               name: b.name,
               code: b.code,
               status: b.status,
               schoolId: b.schoolId,
               school: b.school || null,
             },
             school: b.school || null,
           }));
         }

         if (Array.isArray(allCourses) && allCourses.length > 0) {
           managedEntities.courses = allCourses.map((c) => ({
             id: c.id,
             assignedAt: null,
             course: {
               id: c.id,
               uuid: c.uuid,
               name: c.name,
               code: c.code,
               level: c.level,
               type: c.type,
               isActive: c.isActive,
               schoolId: c.schoolId,
               school: c.school || null,
             },
             school: c.school || null,
           }));
         }
       }
     } catch (e) {
       console.log('⚠️ Error fetching schools/branches for SUPER_ADMIN:', e.message);
     }

      // Hardcoded managed scope override for legacy DB:
      // always ensure at least schoolId 1 and courseId 1 are present.
     const hardcodedManagedEntities = {
       branches: [],
       schools: [
         {
           id: '1',
           uuid: null,
           name: 'Kawish Private High School',
           code: 'SCH-1',
           status: 'ACTIVE',
         },
       ],
       courses: [
         {
           id: '1',
           assignedAt: null,
           course: {
             id: '1',
             uuid: null,
             name: 'Kawish Educational Center',
             code: 'COURSE-1',
             level: null,
             type: null,
             isActive: true,
             schoolId: '1',
             school: null,
           },
           school: null,
         },
       ],
     };

      const safeManagedEntities = convertBigIntToString(
        hardcodedManagedEntities,
      );
      
      console.log('📊 Final managedEntities:', {
        schoolsCount: safeManagedEntities.schools?.length || 0,
        branchesCount: safeManagedEntities.branches?.length || 0,
        coursesCount: safeManagedEntities.courses?.length || 0,
        isSuperAdminOrOwner,
        userRole: user.role
      });

      // Get permissions for the user's role
      const userPermissions = getUserPermissions(user.role);

      return {
        success: true,
        data: {
          user: convertBigIntToString({
            ...userWithoutPassword,
            managedEntities: safeManagedEntities,
          }),
          teacher: teacherDetails,
          managedEntities: safeManagedEntities,
          token,
          // Session management is disabled for this legacy DB schema;
          // frontend should rely on JWT expiry instead of sessionId/expiresAt.
          sessionId: null,
          expiresAt: null,
          permissions: userPermissions,
        },
        message: isOwner ? 'Owner login successful' : 'Login successful',
      };
    } catch (error) {
      console.error('❌ Login error:', error.message);
      console.error('❌ Error stack:', error.stack);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * User logout
   */
  async logoutUser(userId, sessionId) {
    try {
      // Invalidate session
      await this.prisma.session.update({
        where: { id: BigInt(sessionId) },
        data: {
          status: 'INACTIVE',
          updatedAt: new Date(),
        }
      });

      return {
        success: true,
        message: 'Logout successful'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId, passwordData) {
    try {
      // Validate password data
      const validatedData = UserPasswordChangeSchema.parse(passwordData);

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: BigInt(userId) }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password using stored salt
      let isCurrentPasswordValid = false;
      if (user.salt) {
        // Use the stored salt to hash the provided password and compare
        const hashedPassword = await bcrypt.hash(validatedData.currentPassword, user.salt);
        isCurrentPasswordValid = hashedPassword === user.password;
      } else {
        // Fallback to bcrypt.compare for backward compatibility
        isCurrentPasswordValid = await bcrypt.compare(validatedData.currentPassword, user.password);
      }

      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password strength
      const passwordStrength = validatePasswordStrength(validatedData.newPassword);

      if (!passwordStrength.isValid) {
        throw new Error('Password does not meet strength requirements');
      }

      // Hash new password with separate salt
      const saltRounds = 12;
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(validatedData.newPassword, salt);

      // Update password
      await this.prisma.user.update({
        where: { id: BigInt(userId) },
        data: {
          password: hashedPassword,
          salt,
          updatedAt: new Date(),
        }
      });

      // Invalidate all user sessions
      await this.prisma.session.updateMany({
        where: { userId: BigInt(userId), status: 'ACTIVE' },
        data: {
          status: 'INACTIVE',
          updatedAt: new Date(),
        }
      });

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ======================
  // BULK OPERATIONS
  // ======================

  /**
   * Bulk create users
   */
  async bulkCreateUsers(usersData, createdBy) {
    try {
      const results = [];
      const errors = [];

      for (let i = 0; i < usersData.length; i++) {
        const userData = usersData[i];
        const result = await this.createUser(userData, createdBy);

        if (result.success) {
          results.push(result.data);
        } else {
          errors.push({
            index: i,
            data: userData,
            error: result.error
          });
        }
      }

      // Invalidate cache for all affected owners
      const ownerIds = [...new Set(usersData.map(u => u.createdByOwnerId))];
      invalidateUserCacheOnBulkOperation(ownerIds);

      return {
        success: true,
        data: {
          created: results,
          errors,
          summary: {
            total: usersData.length,
            successful: results.length,
            failed: errors.length
          }
        },
        message: `Bulk operation completed. ${results.length} users created, ${errors.length} failed.`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Bulk update users
   */
  async bulkUpdateUsers(updates, updatedBy) {
    try {
      const results = [];
      const errors = [];

      for (const update of updates) {
        const { id, ...updateData } = update;
        const result = await this.updateUser(id, updateData, updatedBy);

        if (result.success) {
          results.push(result.data);
        } else {
          errors.push({
            id,
            data: updateData,
            error: result.error
          });
        }
      }

      return {
        success: true,
        data: {
          updated: results,
          errors,
          summary: {
            total: updates.length,
            successful: results.length,
            failed: errors.length
          }
        },
        message: `Bulk operation completed. ${results.length} users updated, ${errors.length} failed.`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Bulk delete users
   */
  async bulkDeleteUsers(userIds, deletedBy) {
    try {
      const results = [];
      const errors = [];

      for (const userId of userIds) {
        const result = await this.deleteUser(userId, deletedBy);

        if (result.success) {
          results.push(result.data);
        } else {
          errors.push({
            id: userId,
            error: result.error
          });
        }
      }

      return {
        success: true,
        data: {
          deleted: results,
          errors,
          summary: {
            total: userIds.length,
            successful: results.length,
            failed: errors.length
          }
        },
        message: `Bulk operation completed. ${results.length} users deleted, ${errors.length} failed.`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ======================
  // STATISTICS & ANALYTICS
  // ======================

  /**
   * Get user statistics
   */
  async getUserStats(userId) {
    try {
      // Check cache first
      const cachedStats = getUserStatsFromCache(userId);
      if (cachedStats) {
        return {
          success: true,
          data: cachedStats,
          source: 'cache'
        };
      }

      // Get user with relations
      const user = await this.prisma.user.findUnique({
        where: { id: BigInt(userId) },
        include: {
          sessions: true,
          documents: true,
          sentMessages: true,
          receivedMessages: true,
          payments: true,
          attendance: true,
          grades: true,
          assignments: true,
          submissions: true,
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate stats
      const stats = generateUserStats(user);

      // Set in cache
      setUserStatsInCache(userId, stats);

      return {
        success: true,
        data: stats,
        source: 'database'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId, period = '30d') {
    try {
      // Check cache first
      const cachedAnalytics = getUserAnalyticsFromCache(userId, period);
      if (cachedAnalytics) {
        return {
          success: true,
          data: cachedAnalytics,
          source: 'cache'
        };
      }

      // Get user with relations
      const user = await this.prisma.user.findUnique({
        where: { id: BigInt(userId) },
        include: {
          sessions: true,
          payments: true,
          attendance: true,
          grades: true,
          submissions: true,
          sentMessages: true,
          receivedMessages: true,
          documents: true,
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate analytics
      const analytics = generateUserAnalytics(user, period);

      // Set in cache
      setUserAnalyticsInCache(userId, period, analytics);

      return {
        success: true,
        data: analytics,
        source: 'database'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user performance metrics
   */
  async getUserPerformance(userId) {
    try {
      // Check cache first
      const cachedPerformance = getUserPerformanceFromCache(userId);
      if (cachedPerformance) {
        return {
          success: true,
          data: cachedPerformance,
          source: 'cache'
        };
      }

      // Get user with relations
      const user = await this.prisma.user.findUnique({
        where: { id: BigInt(userId) },
        include: {
          attendance: true,
          grades: true,
          payments: true,
          sessions: true,
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate performance
      const performance = calculateUserPerformance(user);

      // Set in cache
      setUserPerformanceInCache(userId, performance);

      return {
        success: true,
        data: performance,
        source: 'database'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ======================
  // SEARCH & FILTER
  // ======================

  /**
   * Search users with advanced filters
   */
  async searchUsers(searchParams) {
    try {
      // Check cache first
      const cachedResults = getUserSearchFromCache(searchParams);
      if (cachedResults) {
        return {
          success: true,
          data: cachedResults,
          source: 'cache'
        };
      }

      // Validate search parameters
      const validatedParams = UserSearchSchema.parse(searchParams);

      // Build search query
      const where = buildUserSearchQuery(validatedParams);
      const includeQuery = buildUserIncludeQuery(validatedParams.include);

      // Calculate pagination
      const page = validatedParams.page;
      const limit = validatedParams.limit;
      const skip = (page - 1) * limit;

      // Execute search
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          include: includeQuery,
          orderBy: { [validatedParams.sortBy]: validatedParams.sortOrder },
          skip,
          take: limit,
        }),
        this.prisma.user.count({ where })
      ]);

      const result = {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
        filters: validatedParams
      };

      // Set in cache
      setUserSearchFromCache(searchParams, result);

      return {
        success: true,
        data: result,
        source: 'database'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.errors || null
      };
    }
  }

  // ======================
  // EXPORT & IMPORT
  // ======================

  /**
   * Export users data
   */
  async exportUsers(filters = {}, format = 'json', includeSensitiveData = false) {
    try {
      // Check cache first
      const cachedExport = getUserExportFromCache(filters, format);
      if (cachedExport) {
        return {
          success: true,
          data: cachedExport,
          source: 'cache'
        };
      }

      // Get users
      const usersResult = await this.getUsers(filters);

      if (!usersResult.success) {
        throw new Error(usersResult.error);
      }

      // Generate export data
      const exportData = generateUserExportData(usersResult.data.users, format, includeSensitiveData);

      // Set in cache
      setUserExportFromCache(filters, format, exportData);

      return {
        success: true,
        data: exportData,
        format,
        source: 'database'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Import users data
   */
  async importUsers(importData, createdBy) {
    try {
      // Validate import data
      const validation = validateUserImportData(importData);

      if (validation.errors.length > 0) {
        return {
          success: false,
          error: 'Import validation failed',
          details: validation.errors
        };
      }

      // Bulk create users
      const result = await this.bulkCreateUsers(validation.valid, createdBy);

      return {
        success: true,
        data: result.data,
        message: `Import completed. ${result.data.summary.successful} users imported, ${result.data.summary.failed} failed.`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ======================
  // UTILITY METHODS
  // ======================

  /**
   * Generate username suggestions
   */
  async generateUsernameSuggestions(firstName, lastName) {
    try {
      const suggestions = generateUsernameSuggestions(firstName, lastName);

      // Check which suggestions are available
      const existingUsernames = await this.prisma.user.findMany({
        where: { username: { in: suggestions } },
        select: { username: true }
      });

      const existingUsernameSet = new Set(existingUsernames.map(u => u.username));
      const availableSuggestions = suggestions.filter(username => !existingUsernameSet.has(username));

      return {
        success: true,
        data: {
          suggestions: availableSuggestions,
          allSuggestions: suggestions,
          existingUsernames: Array.from(existingUsernameSet)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user count by role
   */
  async getUserCountByRole() {
    try {
      const counts = await this.prisma.user.groupBy({
        by: ['role'],
        where: { deletedAt: null },
        _count: { id: true }
      });

      const result = counts.reduce((acc, item) => {
        acc[item.role] = item._count.id;
        return acc;
      }, {});

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user count by status
   */
  async getUserCountByStatus() {
    try {
      const counts = await this.prisma.user.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true }
      });

      const result = counts.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {});

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get users by school
   */
  async getUsersBySchool(schoolId, include = null) {
    try {
      const includeQuery = buildUserIncludeQuery(include);

      const users = await this.prisma.user.findMany({
        where: {
          schoolId: BigInt(schoolId),
          deletedAt: null
        },
        include: includeQuery,
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        data: users
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role, include = null) {
    try {
      const includeQuery = buildUserIncludeQuery(include);

      const users = await this.prisma.user.findMany({
        where: {
          role,
          deletedAt: null
        },
        include: includeQuery,
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        data: users
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get users by status
   */
  async getUsersByStatus(status, include = null) {
    try {
      const includeQuery = buildUserIncludeQuery(include);

      const users = await this.prisma.user.findMany({
        where: {
          status,
          deletedAt: null
        },
        include: includeQuery,
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        data: users
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ======================
  // VERIFICATION & VALIDATION
  // ======================

  /**
   * Verify user email
   */
  async verifyEmail(userId, verificationToken) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: BigInt(userId) }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.emailVerified) {
        throw new Error('Email already verified');
      }

      // In a real implementation, you'd validate the verification token
      // For now, we'll just mark the email as verified
      const updatedUser = await this.prisma.user.update({
        where: { id: BigInt(userId) },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          updatedAt: new Date(),
        }
      });

      // Invalidate cache
      invalidateUserCacheOnUpdate(userId, user.createdByOwnerId.toString());

      return {
        success: true,
        data: updatedUser,
        message: 'Email verified successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(userId) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: BigInt(userId) }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.emailVerified) {
        throw new Error('Email already verified');
      }

      // In a real implementation, you'd send the verification email
      // For now, we'll just return success
      return {
        success: true,
        message: 'Verification email sent successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Don't reveal if user exists or not for security
        return {
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent'
        };
      }

      // Generate reset token (in real implementation, store this securely)
      const resetToken = jwt.sign(
        { userId: user.id.toString(), type: 'password_reset' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // In a real implementation, you'd send the reset email
      // For now, we'll just return success
      return {
        success: true,
        message: 'Password reset link sent successfully',
        resetToken // In production, don't return this
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reset password with token
   */
  async resetPasswordWithToken(resetToken, newPassword) {
    try {
      // Verify reset token
      const decoded = jwt.verify(resetToken, JWT_SECRET);

      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid reset token');
      }

      const userId = decoded.userId;

      // Validate new password strength
      const passwordStrength = validatePasswordStrength(newPassword);
      if (!passwordStrength.isValid) {
        throw new Error('Password does not meet strength requirements');
      }

      // Hash new password with separate salt
      const saltRounds = 12;
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      const user = await this.prisma.user.update({
        where: { id: BigInt(userId) },
        data: {
          password: hashedPassword,
          salt,
          updatedAt: new Date(),
        }
      });

      // Invalidate all user sessions
      await this.prisma.session.updateMany({
        where: { userId: BigInt(userId), status: 'ACTIVE' },
        data: {
          status: 'INACTIVE',
          updatedAt: new Date(),
        }
      });

      // Invalidate cache
      invalidateUserCacheOnUpdate(userId, user.createdByOwnerId.toString());

      return {
        success: true,
        message: 'Password reset successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ======================
  // SESSION MANAGEMENT
  // ======================

  /**
   * Get user sessions
   */
  async getUserSessions(userId, includeInactive = false) {
    try {
      const where = { userId: BigInt(userId) };

      if (!includeInactive) {
        where.status = 'ACTIVE';
      }

      const sessions = await this.prisma.session.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        data: sessions
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Invalidate all user sessions except current
   */
  async invalidateOtherSessions(userId, currentSessionId) {
    try {
      await this.prisma.session.updateMany({
        where: {
          userId: BigInt(userId),
          id: { not: BigInt(currentSessionId) },
          status: 'ACTIVE'
        },
        data: {
          status: 'INACTIVE',
          updatedAt: new Date(),
        }
      });

      return {
        success: true,
        message: 'Other sessions invalidated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extend session
   */
  async extendSession(sessionId, extensionHours = 24) {
    try {
      const session = await this.prisma.session.findUnique({
        where: { id: BigInt(sessionId) }
      });

      if (!session) {
        throw new Error('Session not found');
      }

      if (session.status !== 'ACTIVE') {
        throw new Error('Session is not active');
      }

      const newExpiry = new Date(Date.now() + extensionHours * 60 * 60 * 1000);

      const updatedSession = await this.prisma.session.update({
        where: { id: BigInt(sessionId) },
        data: {
          expiresAt: newExpiry,
          updatedAt: new Date(),
        }
      });

      return {
        success: true,
        data: updatedSession,
        message: 'Session extended successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ======================
  // ADVANCED ANALYTICS
  // ======================

  /**
   * Get user activity timeline
   */
  async getUserActivityTimeline(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const activities = await this.prisma.session.findMany({
        where: {
          userId: BigInt(userId),
          createdAt: { gte: startDate }
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          ipAddress: true,
          userAgent: true,
          deviceType: true,
          status: true,
        }
      });

      // Group activities by date
      const timeline = activities.reduce((acc, activity) => {
        const date = activity.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(activity);
        return acc;
      }, {});

      return {
        success: true,
        data: {
          timeline,
          totalActivities: activities.length,
          period: `${days} days`
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user device statistics
   */
  async getUserDeviceStats(userId) {
    try {
      const sessions = await this.prisma.session.findMany({
        where: { userId: BigInt(userId) },
        select: {
          deviceType: true,
          userAgent: true,
          ipAddress: true,
          createdAt: true,
        }
      });

      // Count by device type
      const deviceCounts = sessions.reduce((acc, session) => {
        const deviceType = session.deviceType || 'unknown';
        acc[deviceType] = (acc[deviceType] || 0) + 1;
        return acc;
      }, {});

      // Count by IP address (unique locations)
      const uniqueIPs = new Set(sessions.map(s => s.ipAddress)).size;

      // Most recent device
      const mostRecentSession = sessions.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      )[0];

      return {
        success: true,
        data: {
          deviceCounts,
          uniqueLocations: uniqueIPs,
          totalSessions: sessions.length,
          mostRecentDevice: mostRecentSession?.deviceType || 'unknown',
          mostRecentIP: mostRecentSession?.ipAddress || 'unknown'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user login patterns
   */
  async getUserLoginPatterns(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const sessions = await this.prisma.session.findMany({
        where: {
          userId: BigInt(userId),
          createdAt: { gte: startDate }
        },
        select: {
          createdAt: true,
          ipAddress: true,
        }
      });

      // Group by hour of day
      const hourlyPatterns = new Array(24).fill(0);
      sessions.forEach(session => {
        const hour = session.createdAt.getHours();
        hourlyPatterns[hour]++;
      });

      // Group by day of week
      const dailyPatterns = new Array(7).fill(0);
      sessions.forEach(session => {
        const day = session.createdAt.getDay();
        dailyPatterns[day]++;
      });

      // Most common login times
      const peakHour = hourlyPatterns.indexOf(Math.max(...hourlyPatterns));
      const peakDay = dailyPatterns.indexOf(Math.max(...dailyPatterns));

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      return {
        success: true,
        data: {
          hourlyPatterns,
          dailyPatterns,
          peakHour,
          peakDay: dayNames[peakDay],
          totalLogins: sessions.length,
          averageLoginsPerDay: (sessions.length / days).toFixed(2)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ======================
  // SECURITY & COMPLIANCE
  // ======================

  /**
   * Get user security audit log
   */
  async getUserSecurityAudit(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const sessions = await this.prisma.session.findMany({
        where: {
          userId: BigInt(userId),
          createdAt: { gte: startDate }
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          ipAddress: true,
          userAgent: true,
          deviceType: true,
          status: true,
        }
      });

      // Detect suspicious activities
      const suspiciousActivities = [];
      const ipAddresses = new Set();
      const devices = new Set();

      sessions.forEach(session => {
        ipAddresses.add(session.ipAddress);
        devices.add(session.deviceType);

        // Flag multiple logins from different IPs in short time
        if (ipAddresses.size > 3) {
          suspiciousActivities.push({
            type: 'multiple_locations',
            description: 'Multiple login locations detected',
            timestamp: session.createdAt,
            ipAddress: session.ipAddress
          });
        }
      });

      return {
        success: true,
        data: {
          totalSessions: sessions.length,
          uniqueIPs: ipAddresses.size,
          uniqueDevices: devices.size,
          suspiciousActivities,
          riskLevel: suspiciousActivities.length > 0 ? 'medium' : 'low',
          recommendations: suspiciousActivities.length > 0 ? [
            'Consider enabling two-factor authentication',
            'Review recent login locations',
            'Change password if suspicious activity detected'
          ] : [
            'Security profile looks normal',
            'Continue monitoring for unusual activity'
          ]
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Lock user account
   */
  async lockUserAccount(userId, reason = 'Security concern', lockedBy) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: BigInt(userId) }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.status === 'LOCKED') {
        throw new Error('User account is already locked');
      }

      // Lock account
      const updatedUser = await this.prisma.user.update({
        where: { id: BigInt(userId) },
        data: {
          status: 'LOCKED',
          lockedAt: new Date(),
          lockedBy: lockedBy ? BigInt(lockedBy) : null,
          lockReason: reason,
          updatedAt: new Date(),
        }
      });

      // Invalidate all active sessions
      await this.prisma.session.updateMany({
        where: { userId: BigInt(userId), status: 'ACTIVE' },
        data: {
          status: 'INACTIVE',
          updatedAt: new Date(),
        }
      });

      // Invalidate cache
      invalidateUserCacheOnUpdate(userId, user.createdByOwnerId.toString());

      return {
        success: true,
        data: updatedUser,
        message: 'User account locked successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Unlock user account
   */
  async unlockUserAccount(userId, unlockedBy) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: BigInt(userId) }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.status !== 'LOCKED') {
        throw new Error('User account is not locked');
      }

      // Unlock account
      const updatedUser = await this.prisma.user.update({
        where: { id: BigInt(userId) },
        data: {
          status: 'ACTIVE',
          lockedAt: null,
          lockedBy: null,
          lockReason: null,
          unlockedAt: new Date(),
          unlockedBy: unlockedBy ? BigInt(unlockedBy) : null,
          updatedAt: new Date(),
        }
      });

      // Invalidate cache
      invalidateUserCacheOnUpdate(userId, user.createdByOwnerId.toString());

      return {
        success: true,
        data: updatedUser,
        message: 'User account unlocked successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ======================
  // NOTIFICATION & COMMUNICATION
  // ======================

  /**
   * Get user notification preferences
   */
  async getUserNotificationPreferences(userId) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: BigInt(userId) },
        select: {
          id: true,
          email: true,
          phone: true,
          notificationPreferences: true,
          emailNotifications: true,
          smsNotifications: true,
          pushNotifications: true,
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Default preferences if none set
      const defaultPreferences = {
        email: {
          loginAlerts: true,
          securityUpdates: true,
          accountUpdates: true,
          marketing: false
        },
        sms: {
          loginAlerts: true,
          securityUpdates: true,
          accountUpdates: false,
          marketing: false
        },
        push: {
          loginAlerts: true,
          securityUpdates: true,
          accountUpdates: true,
          marketing: false
        }
      };

      const preferences = user.notificationPreferences || defaultPreferences;

      return {
        success: true,
        data: {
          userId: user.id,
          email: user.email,
          phone: user.phone,
          preferences,
          globalSettings: {
            emailNotifications: user.emailNotifications ?? true,
            smsNotifications: user.smsNotifications ?? false,
            pushNotifications: user.pushNotifications ?? true,
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserNotificationPreferences(userId, preferences) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: BigInt(userId) }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Update preferences
      const updatedUser = await this.prisma.user.update({
        where: { id: BigInt(userId) },
        data: {
          notificationPreferences: preferences,
          updatedAt: new Date(),
        }
      });

      // Invalidate cache
      invalidateUserCacheOnUpdate(userId, user.createdByOwnerId.toString());

      return {
        success: true,
        data: updatedUser,
        message: 'Notification preferences updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async tempResetPassword(userId, newPassword, updatedBy) {
    try {
      const numericId = Number(userId);
      if (!Number.isFinite(numericId) || numericId <= 0) {
        return { success: false, error: 'Valid userId is required', statusCode: 400 };
      }

      const user = await this.prisma.user.findUnique({
        where: { id: BigInt(numericId) },
      });

      if (!user) {
        return { success: false, error: 'User not found', statusCode: 404 };
      }

      const saltRounds = 12;
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await this.prisma.user.update({
        where: { id: BigInt(numericId) },
        data: {
          password: hashedPassword,
          salt,
          updatedBy: updatedBy ? BigInt(updatedBy) : null,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Password reset successfully',
        data: {
          id: user.id.toString(),
          username: user.username,
        },
      };
    } catch (error) {
      console.error('tempResetPassword error:', error);
      return {
        success: false,
        error: error.message || 'Failed to reset password',
        statusCode: 500,
      };
    }
  }
}

// ======================
// SERVICE INSTANCE
// ======================

const userService = new UserService();

export default userService; 