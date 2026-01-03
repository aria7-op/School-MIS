import prisma from '../utils/prismaClient.js';
import { convertBigIntToString } from '../utils/responseUtils.js';

const DEFAULT_LIMIT = 50;

const severityRanges = {
  INFO: { lt: 400 },
  WARNING: { gte: 400, lt: 500 },
  ERROR: { gte: 500 },
};

const toBigInt = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
};

const normalizeNumber = (value, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
};

const buildLogWhere = ({ start, end, filters }) => {
  const where = {
    createdAt: {
      gte: start,
      lte: end,
    },
  };

  if (filters.schoolId) {
    const schoolId = toBigInt(filters.schoolId);
    if (schoolId) where.schoolId = schoolId;
  }

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.entityType) {
    where.entityType = filters.entityType;
  }

  if (filters.userId) {
    const userId = toBigInt(filters.userId);
    if (userId) where.userId = userId;
  }

  if (filters.responseStatusFrom || filters.responseStatusTo) {
    where.responseStatus = {
      ...(filters.responseStatusFrom ? { gte: Number(filters.responseStatusFrom) } : {}),
      ...(filters.responseStatusTo ? { lte: Number(filters.responseStatusTo) } : {}),
    };
  }

  if (filters.isSuccess !== undefined) {
    where.isSuccess = filters.isSuccess;
  }

  if (filters.severity && severityRanges[filters.severity]) {
    where.responseStatus = {
      ...(where.responseStatus || {}),
      ...severityRanges[filters.severity],
    };
  }

  if (filters.search) {
    const contains = filters.search;
    where.OR = [
      { requestPath: { contains } },
      { requestUrl: { contains } },
      { action: { contains } },
      { entityType: { contains } },
    ];
  }

  return where;
};

const fetchSeverityCounts = async (baseWhere) => {
  const [info, warning, error] = await Promise.all([
    prisma.auditLog.count({
      where: {
        ...baseWhere,
        responseStatus: { lt: 400 },
      },
    }),
    prisma.auditLog.count({
      where: {
        ...baseWhere,
        responseStatus: { gte: 400, lt: 500 },
      },
    }),
    prisma.auditLog.count({
      where: {
        ...baseWhere,
        responseStatus: { gte: 500 },
      },
    }),
  ]);

  return {
    info,
    warning,
    error,
  };
};

const fetchSparkline = async ({ start, end, filters }) => {
  const logs = await prisma.auditLog.findMany({
    where: buildLogWhere({ start, end, filters }),
    select: {
      createdAt: true,
      responseStatus: true,
    },
  });

  const buckets = logs.reduce((acc, log) => {
    if (!log.createdAt) return acc;
    const bucket = log.createdAt.toISOString().slice(0, 10);
    if (!acc[bucket]) {
      acc[bucket] = { total: 0, errors: 0, warnings: 0 };
    }
    acc[bucket].total += 1;
    if (log.responseStatus >= 500) {
      acc[bucket].errors += 1;
    } else if (log.responseStatus >= 400) {
      acc[bucket].warnings += 1;
    }
    return acc;
  }, {});

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({
      date,
      total: values.total,
      errors: values.errors,
      warnings: values.warnings,
    }));
};

const extractGroupCount = (group) => {
  if (typeof group._count === 'number') {
    return group._count;
  }
  if (group._count && typeof group._count === 'object') {
    if (typeof group._count._all === 'number') {
      return group._count._all;
    }
  }
  return 0;
};

const mapLogEntry = (log) => convertBigIntToString({
  ...log,
  createdAt: log.createdAt?.toISOString() ?? null,
  user: log.user
    ? {
        ...log.user,
      }
    : null,
  school: log.school
    ? {
        ...log.school,
      }
    : null,
});

const buildPagination = ({ page, limit, total }) => {
  const safeLimit = Math.max(1, Math.min(200, limit || DEFAULT_LIMIT));
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const safePage = Math.max(1, Math.min(page || 1, totalPages));

  return {
    page: safePage,
    limit: safeLimit,
    totalPages,
    offset: (safePage - 1) * safeLimit,
  };
};

const logAnalyticsService = {
  async getSummary({ start, end, filters }) {
    const where = buildLogWhere({ start, end, filters });

    const [totalEvents, aggregate, severityCounts, actionGroups, endpointGroups, actorGroups, sparkline] =
      await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.aggregate({
          where,
          _avg: { responseTimeMs: true },
          _count: { id: true },
        }),
        fetchSeverityCounts(where),
        prisma.auditLog.groupBy({
          where,
          by: ['action'],
          _count: true,
        }),
        prisma.auditLog.groupBy({
          where,
          by: ['requestPath'],
          _count: true,
        }),
        prisma.auditLog.groupBy({
          where,
          by: ['userId'],
          _count: true,
        }),
        fetchSparkline({ start, end, filters }),
      ]);

    const actorIds = actorGroups
      .map((group) => group.userId)
      .filter((id) => id !== null);

    const actors = actorIds.length
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, username: true, firstName: true, lastName: true, role: true },
        })
      : [];

    const actorLookup = actors.reduce((acc, actor) => {
      acc[actor.id] = actor;
      return acc;
    }, {});

    const topActors = actorGroups
      .filter((group) => group.userId !== null)
      .sort((a, b) => extractGroupCount(b) - extractGroupCount(a))
      .slice(0, 5)
      .map((group) => ({
        userId: String(group.userId),
        count: extractGroupCount(group),
        user: actorLookup[group.userId] ?? null,
      }));

    const topActions = actionGroups
      .sort((a, b) => extractGroupCount(b) - extractGroupCount(a))
      .slice(0, 5)
      .map((group) => ({
        action: group.action,
        count: extractGroupCount(group),
      }));

    const topEndpoints = endpointGroups
      .filter((group) => group.requestPath)
      .sort((a, b) => extractGroupCount(b) - extractGroupCount(a))
      .slice(0, 5)
      .map((group) => ({
        path: group.requestPath,
        count: extractGroupCount(group),
      }));

    return {
      totals: {
        totalEvents,
        averageLatencyMs: normalizeNumber(aggregate._avg.responseTimeMs, null),
        infoEvents: severityCounts.info,
        warningEvents: severityCounts.warning,
        errorEvents: severityCounts.error,
      },
      severityCounts,
      topActions,
      topEndpoints,
      topActors,
      sparkline,
    };
  },

  async getTimeline({ start, end, filters, page = 1, limit = DEFAULT_LIMIT }) {
    const where = buildLogWhere({ start, end, filters });
    const total = await prisma.auditLog.count({ where });
    const pagination = buildPagination({ page, limit, total });

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.offset,
      take: pagination.limit,
    });

    return {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
      data: logs.map(mapLogEntry),
    };
  },
};

export default logAnalyticsService;

