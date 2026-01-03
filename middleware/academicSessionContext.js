import { PrismaClient } from '../generated/prisma/index.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Middleware to inject academic session context into requests
 * This allows filtering of data by academic year throughout the application
 */
export const academicSessionContext = async (req, res, next) => {
  try {
    const { schoolId } = req.user || {};
    
    if (!schoolId) {
      // If no school context, skip (likely public endpoint or auth)
      return next();
    }

    // Check if academicSessionId is provided in query params (override)
    let academicSessionId = req.query.academicSessionId;

    // If not provided, get the current academic session for the school
    if (!academicSessionId) {
      const school = await prisma.school.findUnique({
        where: { id: BigInt(schoolId) },
        select: {
          academicSessionId: true,
          academicSessions: {
            where: { isCurrent: true },
            take: 1,
          },
        },
      });

      // Use school's current session or find the most recent active one
      academicSessionId = school?.academicSessionId || school?.academicSessions?.[0]?.id;

      if (!academicSessionId) {
        logger.warn(`No current academic session found for school ${schoolId}`);
        // Continue without session context rather than failing
        return next();
      }
    }

    // Get session details
    const academicSession = await prisma.academicSession.findUnique({
      where: { id: BigInt(academicSessionId) },
    });

    if (!academicSession) {
      logger.warn(`Academic session ${academicSessionId} not found`);
      return next();
    }

    // Inject session context into request
    req.academicSession = {
      id: academicSession.id,
      name: academicSession.name,
      startDate: academicSession.startDate,
      endDate: academicSession.endDate,
      isCurrent: academicSession.isCurrent,
    };

    next();
  } catch (error) {
    logger.error('Error in academicSessionContext middleware:', error);
    // Don't fail the request, just continue without context
    next();
  }
};

/**
 * Middleware to require academic session context
 * Use this for endpoints that must have a session context
 */
export const requireAcademicSession = (req, res, next) => {
  if (!req.academicSession) {
    return res.status(400).json({
      success: false,
      message: 'Academic session context required. Please provide academicSessionId or ensure a current session is set.',
    });
  }
  next();
};

export default academicSessionContext;










