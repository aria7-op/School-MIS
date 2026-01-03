import prisma from '../utils/prismaClient.js';
import {
  createSuccessResponse,
  createErrorResponse
} from '../utils/responseUtils.js';

const parseJSONSafe = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

const buildActorName = (user) => {
  if (!user) return null;
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length ? parts.join(' ') : user.username ?? null;
};

class AuditController {
  /**
   * Get all audit logs with filtering and pagination
   * GET /api/audit-logs
   */
  async getAuditLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        action,
        entityType,
        entityId,
        userId,
        startDate,
        endDate,
        requestMethod,
        responseStatus,
        isSuccess,
        requestPath,
        requestUrl,
        correlationId,
        ipAddress
      } = req.query;
      
      const where = {
        schoolId: req.user.schoolId
      };
      
      // Apply filters
      if (action) where.action = action;
      if (entityType) where.entityType = entityType;
      if (entityId) where.entityId = BigInt(entityId);
      if (userId) where.userId = BigInt(userId);
      if (requestMethod) where.requestMethod = requestMethod;
      if (responseStatus) where.responseStatus = parseInt(responseStatus);
      if (ipAddress) where.ipAddress = ipAddress;
      if (correlationId) where.correlationId = correlationId;
      if (requestPath) {
        where.requestPath = {
          contains: requestPath
        };
      }
      if (requestUrl) {
        where.requestUrl = {
          contains: requestUrl
        };
      }
      if (isSuccess !== undefined) {
        if (typeof isSuccess === 'string') {
          if (isSuccess.toLowerCase() === 'true') where.isSuccess = true;
          else if (isSuccess.toLowerCase() === 'false') where.isSuccess = false;
        } else if (typeof isSuccess === 'boolean') {
          where.isSuccess = isSuccess;
        }
      }
      
      // Date range filter
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }
      
      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Fetch logs and total count
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          }
        }),
        prisma.auditLog.count({ where })
      ]);
      
      // Convert BigInt to strings
      const convertedLogs = logs.map((log) => {
        const parsedOldData = parseJSONSafe(log.oldData);
        const parsedNewData = parseJSONSafe(log.newData);
        const actor = log.user
          ? {
              ...log.user,
              id: log.user.id.toString(),
              fullName: buildActorName(log.user)
            }
          : null;

        const metadata =
          parsedNewData && typeof parsedNewData === 'object' ? parsedNewData.metadata ?? null : null;
        const changes =
          parsedNewData && typeof parsedNewData === 'object' ? parsedNewData.changes ?? null : null;
        const responsePayload =
          parsedNewData && typeof parsedNewData === 'object' ? parsedNewData.response ?? null : null;
        const summary =
          parsedNewData && typeof parsedNewData === 'object' ? parsedNewData.summary ?? null : null;
        const normalizedNewData =
          parsedNewData && typeof parsedNewData === 'object' && parsedNewData.data !== undefined
            ? parsedNewData.data
            : parsedNewData;

        return {
          id: log.id.toString(),
          uuid: log.uuid,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId?.toString(),
          schoolId: log.schoolId?.toString(),
          branchId: log.branchId?.toString(),
          ownerId: log.ownerId?.toString(),
          userId: log.userId?.toString(),
          customerId: log.customerId?.toString(),
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          requestMethod: log.requestMethod,
          requestPath: log.requestPath,
          requestUrl: log.requestUrl,
          requestHeaders: log.requestHeaders,
          requestQuery: log.requestQuery,
          requestBody: log.requestBody,
          responseStatus: log.responseStatus,
          responseTimeMs: log.responseTimeMs,
          isSuccess: log.isSuccess,
          errorMessage: log.errorMessage,
          correlationId: log.correlationId,
          traceId: log.traceId,
          createdAt: log.createdAt,
          oldData: parsedOldData,
          newData: normalizedNewData,
          rawOldData: log.oldData,
          rawNewData: log.newData,
          metadata,
          changes,
          response: responsePayload,
          summary,
          actor,
          actorName: buildActorName(log.user),
          actorRole: log.user?.role ?? null
        };
      });
      
      return createSuccessResponse(res, 200, 'Audit logs retrieved successfully', {
        logs: convertedLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
          hasNext: skip + parseInt(limit) < total,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return createErrorResponse(res, 500, 'Failed to retrieve audit logs');
    }
  }
  
  /**
   * Get audit history for a specific entity
   * GET /api/audit-logs/entity/:entityType/:entityId
   */
  async getEntityAuditHistory(req, res) {
    try {
      const { entityType, entityId } = req.params;
      
      const logs = await prisma.auditLog.findMany({
        where: {
          entityType,
          entityId: BigInt(entityId),
          schoolId: req.user.schoolId
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        }
      });

      const convertedLogs = logs.map((log) => {
        const parsedOldData = parseJSONSafe(log.oldData);
        const parsedNewData = parseJSONSafe(log.newData);
        const actor = log.user
          ? {
              ...log.user,
              id: log.user.id.toString(),
              fullName: buildActorName(log.user)
            }
          : null;

        const metadata =
          parsedNewData && typeof parsedNewData === 'object' ? parsedNewData.metadata ?? null : null;
        const changes =
          parsedNewData && typeof parsedNewData === 'object' ? parsedNewData.changes ?? null : null;
        const summary =
          parsedNewData && typeof parsedNewData === 'object' ? parsedNewData.summary ?? null : null;
        const responsePayload =
          parsedNewData && typeof parsedNewData === 'object' ? parsedNewData.response ?? null : null;
        const normalizedNewData =
          parsedNewData && typeof parsedNewData === 'object' && parsedNewData.data !== undefined
            ? parsedNewData.data
            : parsedNewData;

        return {
          id: log.id.toString(),
          uuid: log.uuid,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId.toString(),
          schoolId: log.schoolId?.toString(),
          branchId: log.branchId?.toString(),
          ownerId: log.ownerId?.toString(),
          userId: log.userId?.toString(),
          createdAt: log.createdAt,
          ipAddress: log.ipAddress,
          requestMethod: log.requestMethod,
          requestPath: log.requestPath,
          requestUrl: log.requestUrl,
          responseStatus: log.responseStatus,
          responseTimeMs: log.responseTimeMs,
          isSuccess: log.isSuccess,
          errorMessage: log.errorMessage,
          correlationId: log.correlationId,
          traceId: log.traceId,
          oldData: parsedOldData,
          newData: normalizedNewData,
          rawOldData: log.oldData,
          rawNewData: log.newData,
          metadata,
          changes,
          response: responsePayload,
          summary,
          actor,
          actorName: buildActorName(log.user),
          actorRole: log.user?.role ?? null
        };
      });
      
      return createSuccessResponse(res, 200, 'Audit history retrieved successfully', {
        entityType,
        entityId,
        logs: convertedLogs,
        totalChanges: logs.length
      });
    } catch (error) {
      console.error('Error fetching entity audit history:', error);
      return createErrorResponse(res, 500, 'Failed to retrieve audit history');
    }
  }
  
  /**
   * Get audit log statistics
   * GET /api/audit-logs/stats
   */
  async getAuditStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const where = {
        schoolId: req.user.schoolId
      };
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }
      
      // Get statistics
      const [
        totalLogs,
        actionBreakdown,
        entityBreakdown,
        topUsers
      ] = await Promise.all([
        prisma.auditLog.count({ where }),
        
        // Group by action
        prisma.auditLog.groupBy({
          by: ['action'],
          where,
          _count: true,
          orderBy: { _count: { action: 'desc' } }
        }),
        
        // Group by entity type
        prisma.auditLog.groupBy({
          by: ['entityType'],
          where,
          _count: true,
          orderBy: { _count: { entityType: 'desc' } }
        }),
        
        // Top users by activity
        prisma.auditLog.groupBy({
          by: ['userId'],
          where: {
            ...where,
            userId: { not: null }
          },
          _count: true,
          orderBy: { _count: { userId: 'desc' } },
          take: 10
        })
      ]);
      
      return createSuccessResponse(res, 200, 'Audit statistics retrieved', {
        totalLogs,
        actionBreakdown: actionBreakdown.map(item => ({
          action: item.action,
          count: item._count
        })),
        entityBreakdown: entityBreakdown.map(item => ({
          entityType: item.entityType,
          count: item._count
        })),
        topUsers: topUsers.map(item => ({
          userId: item.userId?.toString(),
          count: item._count
        }))
      });
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      return createErrorResponse(res, 500, 'Failed to retrieve audit statistics');
    }
  }

  /**
   * Get advanced audit analytics dashboard
   * GET /api/audit-logs/analytics
   */
  async getAuditAnalytics(req, res) {
    try {
      const { period = '7d' } = req.query;
      const schoolId = req.user.schoolId;
      
      // Calculate date range based on period
      const now = new Date();
      let startDate = new Date();
      
      switch(period) {
        case '24h':
          startDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }
      
      const where = {
        schoolId: BigInt(schoolId),
        createdAt: { gte: startDate }
      };
      
      // Parallel analytics queries
      const [
        totalLogs,
        actionStats,
        entityStats,
        userActivity,
        hourlyDistribution,
        dailyTrend,
        topIPs,
        failedActions,
        recentCritical,
        statusDistribution,
        endpointActivity,
        slowEndpoints,
        responseTimeStats
      ] = await Promise.all([
        // Total logs count
        prisma.auditLog.count({ where }),
        
        // Actions breakdown
        prisma.auditLog.groupBy({
          by: ['action'],
          where,
          _count: true
        }),
        
        // Entity types breakdown
        prisma.auditLog.groupBy({
          by: ['entityType'],
          where,
          _count: true,
          orderBy: { _count: { entityType: 'desc' } }
        }),
        
        // User activity ranking
        prisma.$queryRaw`
          SELECT 
            u.id,
            u.firstName,
            u.lastName,
            u.role,
            COUNT(al.id) as activityCount,
            MAX(al.createdAt) as lastActivity
          FROM audit_logs al
          LEFT JOIN users u ON al.userId = u.id
          WHERE al.schoolId = ${BigInt(schoolId)}
            AND al.createdAt >= ${startDate}
          GROUP BY u.id, u.firstName, u.lastName, u.role
          ORDER BY activityCount DESC
          LIMIT 10
        `,
        
        // Hourly distribution
        prisma.$queryRaw`
          SELECT 
            HOUR(createdAt) as hour,
            COUNT(*) as count
          FROM audit_logs
          WHERE schoolId = ${BigInt(schoolId)}
            AND createdAt >= ${startDate}
          GROUP BY HOUR(createdAt)
          ORDER BY hour
        `,
        
        // Daily trend
        prisma.$queryRaw`
          SELECT 
            DATE(createdAt) as date,
            COUNT(*) as count,
            COUNT(DISTINCT userId) as uniqueUsers,
            COUNT(DISTINCT ipAddress) as uniqueIPs
          FROM audit_logs
          WHERE schoolId = ${BigInt(schoolId)}
            AND createdAt >= ${startDate}
          GROUP BY DATE(createdAt)
          ORDER BY date DESC
        `,
        
        // Top IP addresses
        prisma.auditLog.groupBy({
          by: ['ipAddress'],
          where,
          _count: true,
          orderBy: { _count: { ipAddress: 'desc' } },
          take: 10
        }),
        
        // Failed/suspicious actions (if you have a status field)
        prisma.auditLog.count({
          where: {
            ...where,
            action: { in: ['FAILED_LOGIN', 'UNAUTHORIZED_ACCESS', 'FAILED_UPDATE'] }
          }
        }),
        
        // Recent critical actions
        prisma.auditLog.findMany({
          where: {
            ...where,
            action: { in: ['DELETE', 'BULK_DELETE', 'TRANSFER'] }
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          }
        }),
        
        // HTTP status distribution
        prisma.$queryRaw`
          SELECT 
            responseStatus,
            COUNT(*) as count
          FROM audit_logs
          WHERE schoolId = ${BigInt(schoolId)}
            AND createdAt >= ${startDate}
            AND responseStatus IS NOT NULL
          GROUP BY responseStatus
          ORDER BY responseStatus
        `,
        
        // Top endpoints by request volume
        prisma.$queryRaw`
          SELECT 
            requestPath,
            requestMethod,
            COUNT(*) as count,
            AVG(responseTimeMs) as avgResponseTime
          FROM audit_logs
          WHERE schoolId = ${BigInt(schoolId)}
            AND createdAt >= ${startDate}
            AND requestPath IS NOT NULL
          GROUP BY requestPath, requestMethod
          ORDER BY count DESC
          LIMIT 10
        `,
        
        // Slowest endpoints (average response time)
        prisma.$queryRaw`
          SELECT 
            requestPath,
            requestMethod,
            AVG(responseTimeMs) as avgResponseTime,
            MAX(responseTimeMs) as maxResponseTime,
            MIN(responseTimeMs) as minResponseTime,
            COUNT(*) as count
          FROM audit_logs
          WHERE schoolId = ${BigInt(schoolId)}
            AND createdAt >= ${startDate}
            AND responseTimeMs IS NOT NULL
            AND requestPath IS NOT NULL
          GROUP BY requestPath, requestMethod
          HAVING COUNT(*) >= 5
          ORDER BY avgResponseTime DESC
          LIMIT 10
        `,
        
        // Response time statistics
        prisma.auditLog.aggregate({
          where: {
            ...where,
            responseTimeMs: { not: null }
          },
          _avg: { responseTimeMs: true },
          _max: { responseTimeMs: true },
          _min: { responseTimeMs: true }
        })
      ]);
      
      // Calculate totals by action type
      const actionTotals = {
        creates: 0,
        updates: 0,
        deletes: 0,
        reads: 0,
        other: 0
      };
      
      actionStats.forEach(stat => {
        const action = stat.action.toUpperCase();
        if (action.includes('CREATE')) actionTotals.creates += stat._count;
        else if (action.includes('UPDATE')) actionTotals.updates += stat._count;
        else if (action.includes('DELETE')) actionTotals.deletes += stat._count;
        else if (action.includes('READ') || action.includes('VIEW')) actionTotals.reads += stat._count;
        else actionTotals.other += stat._count;
      });
      
      // Convert BigInt values
      const convertBigInt = (obj) => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(convertBigInt);
        if (typeof obj === 'object') {
          const converted = {};
          for (const key in obj) {
            converted[key] = convertBigInt(obj[key]);
          }
          return converted;
        }
        return obj;
      };
      
      const errorCount = statusDistribution
        .filter((row) => Number(row.responseStatus) >= 400)
        .reduce((sum, row) => sum + Number(row.count ?? row._count ?? 0), 0);
      const errorRate = totalLogs > 0 ? Math.round(((errorCount / totalLogs) * 100 + Number.EPSILON) * 100) / 100 : 0;

      const normalizedStatusDistribution = statusDistribution.map((row) => ({
        responseStatus: Number(row.responseStatus),
        count: Number(row.count ?? row._count ?? 0)
      }));

      const normalizedTopEndpoints = endpointActivity.map((endpoint) => ({
        requestPath: endpoint.requestPath,
        requestMethod: endpoint.requestMethod,
        count: Number(endpoint.count ?? 0),
        avgResponseTime: endpoint.avgResponseTime !== null ? Number(endpoint.avgResponseTime) : null
      }));

      const normalizedSlowEndpoints = slowEndpoints.map((endpoint) => ({
        requestPath: endpoint.requestPath,
        requestMethod: endpoint.requestMethod,
        avgResponseTime: endpoint.avgResponseTime !== null ? Number(endpoint.avgResponseTime) : null,
        maxResponseTime: endpoint.maxResponseTime !== null ? Number(endpoint.maxResponseTime) : null,
        minResponseTime: endpoint.minResponseTime !== null ? Number(endpoint.minResponseTime) : null,
        count: Number(endpoint.count ?? 0)
      }));

      return createSuccessResponse(res, 200, 'Audit analytics retrieved successfully', {
        period,
        summary: {
          totalLogs,
          actionTotals,
          totalUsers: userActivity.length,
          totalIPs: topIPs.length,
          failedActions,
          averageResponseTime: responseTimeStats._avg?.responseTimeMs ? Math.round(Number(responseTimeStats._avg.responseTimeMs)) : null,
          slowestResponseTime: responseTimeStats._max?.responseTimeMs ? Number(responseTimeStats._max.responseTimeMs) : null,
          fastestResponseTime: responseTimeStats._min?.responseTimeMs ? Number(responseTimeStats._min.responseTimeMs) : null,
          errorRate
        },
        actions: convertBigInt(actionStats.map(s => ({ action: s.action, count: s._count }))),
        entities: convertBigInt(entityStats.map(s => ({ type: s.entityType, count: s._count }))),
        topUsers: convertBigInt(userActivity),
        hourlyDistribution: convertBigInt(hourlyDistribution),
        dailyTrend: convertBigInt(dailyTrend),
        topIPs: convertBigInt(topIPs.map(ip => ({ ip: ip.ipAddress, count: ip._count }))),
        recentCritical: convertBigInt(recentCritical.map(log => ({
          id: log.id.toString(),
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId?.toString(),
          createdAt: log.createdAt,
          user: log.user ? {
            id: log.user.id.toString(),
            name: `${log.user.firstName} ${log.user.lastName}`,
            role: log.user.role
          } : null
        }))),
        statusDistribution: normalizedStatusDistribution,
        topEndpoints: normalizedTopEndpoints,
        slowEndpoints: normalizedSlowEndpoints
      });
    } catch (error) {
      console.error('Error fetching audit analytics:', error);
      return createErrorResponse(res, 500, 'Failed to retrieve audit analytics');
    }
  }
}

export default AuditController;

