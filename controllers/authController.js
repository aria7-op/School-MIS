import prisma from '../utils/prismaClient.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import staffStore from '../store/staffStore.js';
import crypto from 'crypto';
import { safeResponse } from '../utils/jsonHelpers.js';
import { CSRF_COOKIE_NAME, rotateCsrfToken } from '../middleware/csrf.js';
import { logger } from '../utils/logger.js';
const JWT_SECRET = (() => {
  const value = process.env.JWT_SECRET;
  if (!value) {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }
  return value;
})();
const ACCESS_TOKEN_COOKIE = 'accessToken';
const isProduction = process.env.NODE_ENV === 'production';
const ACCESS_TOKEN_MAX_AGE_MS = Number(process.env.SESSION_MAX_AGE_MS || 1000 * 60 * 60 * 4); // Default 4 hours

const setAccessTokenCookie = (res, token) => {
  res.cookie(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    path: '/',
  });
};

const clearAccessTokenCookie = (res) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  });
  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  });
};

// ======================
// UTILITY FUNCTIONS
// ======================

/**
 * Generate a secure random token
 */
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a temporary password
 */
function generateTempPassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Hash password with bcrypt
 */
async function hashPassword(password) {
  const saltRounds = 12;
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(password, salt);
  return { hashedPassword, salt };
}

export const register = async (req, res) => {
  const { name, email, password, role, schoolId, created_by_owner_id, relational_id, username } = req.body;
  
  // For SUPER_ADMIN, schoolId and relational_id are optional
  if (role !== 'SUPER_ADMIN') {
    if (!schoolId) return res.status(400).json({ error: 'schoolId is required' });
    if (!relational_id) return res.status(400).json({ error: 'relational_id is required' });
  }

  // Map numeric or string role to enum string
  const roleMap = {
    '1': 'TEACHER',
    '2': 'STUDENT',
    '3': 'STAFF',
    '4': 'SUPER_ADMIN',
    '5': 'SCHOOL_ADMIN',
    TEACHER: 'TEACHER',
    STUDENT: 'STUDENT',
    STAFF: 'STAFF',
    SUPER_ADMIN: 'SUPER_ADMIN',
    SCHOOL_ADMIN: 'SCHOOL_ADMIN'
  };
  const mappedRole = roleMap[role];
  if (!mappedRole) return res.status(400).json({ error: 'Invalid role value' });

  // Check if username already exists (using email as username)
  if (email) {
    try {
      const existingUser = await prisma.user.findFirst({ where: { username: email } });
      if (existingUser) return res.status(400).json({ error: 'Username already in use' });
    } catch (_) {
      // username field not present; skip uniqueness check
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Use provided username or generate from name
  const finalUsername = username || name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  
  // Split name into firstName and lastName
  const nameParts = name.trim().split(' ');
  const firstName = nameParts[0] || 'Admin';
  const lastName = nameParts.slice(1).join(' ') || 'User';
  
  // Prepare user data
  const userData = {
    username: finalUsername,
    firstName,
    lastName,
    password: hashedPassword,
    role: mappedRole,
    status: 'ACTIVE',
    timezone: 'Asia/Kabul',
    locale: 'en-AF',
    createdByOwnerId: BigInt(created_by_owner_id)
  };
  
  // Use email as username if provided
  if (email) {
    userData.username = email;
  }

  // Add optional fields for non-SUPER_ADMIN users
  if (mappedRole !== 'SUPER_ADMIN') {
    userData.schoolId = BigInt(schoolId);
  }

  const user = await prisma.user.create({
    data: userData
  });
  
  res.status(201).json({ id: user.id.toString(), username: user.username });
};

const buildAuthPayload = (user) => ({
  userId: user.id ? user.id.toString() : undefined,
  role: user.role,
  schoolId: user.schoolId ? user.schoolId.toString() : undefined,
});

const buildResponseUser = (user) => safeResponse({
  id: user.id ? user.id.toString() : null,
  username: user.username,
  role: user.role,
  firstName: user.firstName,
  lastName: user.lastName,
  schoolId: user.schoolId ? user.schoolId.toString() : null,
  status: user.status,
  school: user.school ?? null,
});

const performLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { username: email },
      select: {
        id: true,
        username: true,
        password: true,
        salt: true,
        status: true,
        role: true,
        firstName: true,
        lastName: true,
        schoolId: true,
        school: {
          select: {
            id: true,
            name: true,
            shortName: true,
            code: true,
            logo: true,
            themeColor: true,
            timezone: true,
            locale: true,
            currency: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      logger.anomaly('auth.invalid_credentials', { email, ip: req.ip });
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, error: 'User account is not active' });
    }

    let passwordMatch = false;
    if (user.salt) {
      const hashedPassword = await bcrypt.hash(password, user.salt);
      passwordMatch = hashedPassword === user.password;
    } else {
      passwordMatch = await bcrypt.compare(password, user.password);
    }
    
    if (!passwordMatch) {
      logger.anomaly('auth.invalid_credentials', { email, ip: req.ip, userId: user.id });
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const getRealIp = (request) => request.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || request.headers['x-real-ip']
      || request.connection?.remoteAddress
      || request.socket?.remoteAddress
      || request.ip
      || 'unknown';

    const realIp = getRealIp(req);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        lastIp: realIp,
      },
    });

    if (!user.firstName || !user.lastName) {
      logger.error('authController:user-record-incomplete', new Error('Missing name fields'), { userId: user.id });
      return res.status(500).json({ success: false, error: 'User record is incomplete' });
    }

    const token = jwt.sign(buildAuthPayload(user), JWT_SECRET, { expiresIn: '4h' });

    setAccessTokenCookie(res, token);
    const csrfToken = rotateCsrfToken(res);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: buildResponseUser(user),
      csrfToken,
      session: {
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + ACCESS_TOKEN_MAX_AGE_MS).toISOString(),
        ip: realIp,
        userAgent: req.headers['user-agent'] || 'unknown',
      },
    });
  } catch (error) {
      logger.error('authController:login-error', error, {
        email,
        ip: req.ip,
      });
    return res.status(500).json({
      success: false,
      error: 'Login failed',
      message: 'An unexpected error occurred during login. Please try again.',
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
};

export const loginDb = performLogin;
export const login = performLogin;

export const logout = async (req, res) => {
  try {
    clearAccessTokenCookie(res);
    const csrfToken = rotateCsrfToken(res);
    return res.json({
      success: true,
      message: 'Logged out successfully',
      csrfToken,
    });
  } catch (error) {
    logger.error('authController:logout-error', error, { userId: req.user?.id });
    return res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: 'Unable to complete logout. Please try again.',
    });
  }
};

export const loginTest = async (req, res) => {
  if (isProduction) {
    return res.status(404).json({ success: false, error: 'Endpoint not available' });
  }
  const { email } = req.body;
  const user = staffStore.getAllStaff().staff.find(u => u.email === email);
  if (!user || user.status !== 'ACTIVE') {
    return res.status(401).json({ error: 'Invalid credentials or inactive user' });
  }
  // For testing, skip password verification
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  setAccessTokenCookie(res, token);
  const csrfToken = rotateCsrfToken(res);
  res.json({ token, csrfToken });
};

// ======================
// PASSWORD RESET METHODS
// ======================

/**
 * Forgot Password - Request password reset
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by username (using email as username)
    const user = await prisma.user.findUnique({
      where: { username: email.toLowerCase() }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token in user metadata
    const metadata = user.metadata || {};
    metadata.resetToken = resetToken;
    metadata.resetTokenExpiry = resetTokenExpiry.toISOString();

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        metadata: metadata
      }
    });

    // In production, send email here
    // For now, return the token directly
    res.json({
      success: true,
      message: 'Password reset token generated successfully',
      data: {
        resetToken: resetToken,
        expiresAt: resetTokenExpiry,
        username: user.username
      }
    });

  } catch (error) {
    logger.error('authController:forgot-password-error', error, { email: req.body.email });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Reset Password - Use reset token to set new password
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, reset token, and new password are required'
      });
    }

    // Find user by username (using email as username)
    const user = await prisma.user.findUnique({
      where: { username: email.toLowerCase() }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if reset token exists and is valid
    const metadata = user.metadata || {};
    if (!metadata.resetToken || metadata.resetToken !== resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
    }

    // Check if token is expired
    if (new Date(metadata.resetTokenExpiry) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    const updatedMetadata = { ...metadata };
    delete updatedMetadata.resetToken;
    delete updatedMetadata.resetTokenExpiry;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        metadata: updatedMetadata
      }
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    logger.error('authController:reset-password-error', error, { email: req.body.email });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Admin Reset Password - Admin can reset any user's password
 */
export const adminResetPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    const adminUser = req.user; // From auth middleware

    // Check if admin has permission
    if (!adminUser || !['SUPER_ADMIN', 'OWNER'].includes(adminUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    if (!userId || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'User ID and new password are required'
      });
    }

    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword
      }
    });

    res.json({
      success: true,
      message: 'Password reset successfully by admin',
      data: {
        userId: userId,
        username: user.username
      }
    });

  } catch (error) {
    logger.error('authController:admin-reset-password-error', error, { userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Change Password - Authenticated user changes their own password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Find user in database (include salt for password verification)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        password: true,
        salt: true,
        status: true,
        role: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'User account is not active'
      });
    }

    // Verify current password using the same logic as login
    let passwordMatch = false;
    if (user.salt) {
      // Use the stored salt to hash the provided password and compare
      const hashedPassword = await bcrypt.hash(currentPassword, user.salt);
      passwordMatch = hashedPassword === user.password;
    } else {
      // Fallback to bcrypt.compare for backward compatibility
      passwordMatch = await bcrypt.compare(currentPassword, user.password);
    }
    
    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is different from current password
    let isSamePassword = false;
    if (user.salt) {
      const hashedNewPassword = await bcrypt.hash(newPassword, user.salt);
      isSamePassword = hashedNewPassword === user.password;
    } else {
      isSamePassword = await bcrypt.compare(newPassword, user.password);
    }
    
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Hash new password with new salt (following the User model pattern)
    const saltRounds = 12;
    const newSalt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(newPassword, newSalt);

    // Update password and salt
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        salt: newSalt,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('authController:change-password-error', error, { userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get Current User Profile - /me endpoint
 */
export const getCurrentUser = async (req, res) => {
  try {
    // Get user ID from JWT token (should be set by auth middleware)
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Find user in database with all information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            shortName: true,
            code: true,
            logo: true,
            themeColor: true,
            timezone: true,
            locale: true,
            currency: true,
            status: true
          }
        },
        teacher: {
          select: {
            id: true,
            employeeId: true,
            departmentId: true,
            qualification: true,
            specialization: true,
            experience: true,
            isClassTeacher: true
          }
        },
        parent: {
          select: {
            id: true,
            uuid: true,
            occupation: true,
            annualIncome: true,
            education: true
          }
        },
        student: {
          select: {
            id: true,
            admissionNo: true,
            rollNo: true,
            classId: true,
            sectionId: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'User account is not active'
      });
    }

    // Get total sessions count for this user
    const totalSessions = await prisma.session.count({
      where: {
        userId: userId,
        status: 'ACTIVE'
      }
    });

    // Serialize the response to handle BigInt values
    const responseData = safeResponse({
      success: true,
      data: {
        id: user.id.toString(),
        uuid: user.uuid,
        username: user.username,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        displayName: user.displayName,
        dariName: user.dariName,
        gender: user.gender,
        birthDate: user.birthDate,
        avatar: user.avatar,
        coverImage: user.coverImage,
        bio: user.bio,
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin,
        lastIp: user.lastIp,
        timezone: user.timezone,
        locale: user.locale,
        metadata: user.metadata,
        schoolId: user.schoolId ? user.schoolId.toString() : null,
        createdByOwnerId: user.createdByOwnerId ? user.createdByOwnerId.toString() : null,
        createdBy: user.createdBy ? user.createdBy.toString() : null,
        updatedBy: user.updatedBy ? user.updatedBy.toString() : null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: user.deletedAt,
        school: user.school,
        teacher: user.teacher,
        parent: user.parent,
        student: user.student,
        totalSessions: totalSessions
      }
    });

    res.json(responseData);

  } catch (error) {
    logger.error('authController:get-current-user-error', error, { userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};