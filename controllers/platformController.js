import { z } from 'zod';
import { randomUUID } from 'crypto';
import prisma from '../utils/prismaClient.js';
import subscriptionService from '../services/subscriptionService.js';
import superadminService from '../services/superadminService.js';
import logAnalyticsService from '../services/logAnalyticsService.js';
import financeAnalyticsService from '../services/financeAnalyticsService.js';
import { convertBigIntToString, generateSalt, hashPassword, createAuditLog } from '../utils/responseUtils.js';

const packageSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  priceMonthly: z.number().nonnegative(),
  priceYearly: z.number().nonnegative(),
  isActive: z.boolean().optional(),
  features: z.record(z.any()),
  supportLevel: z.string().optional(),
});

const packageUpdateSchema = packageSchema.partial({
  name: true,
  priceMonthly: true,
  priceYearly: true,
  features: true,
});

const renewSchema = z.object({
  extensionDays: z.number().int().positive().max(3650).default(30),
});

const changePackageSchema = z.object({
  packageId: z.union([z.string(), z.number()]),
  autoRenew: z.boolean().optional(),
});

const cancelSubscriptionSchema = z.object({
  effectiveDate: z.string().datetime().optional(),
  reason: z.string().max(500).optional(),
});

const reactivateSubscriptionSchema = z.object({
  startDate: z.string().datetime().optional(),
  durationDays: z.number().int().positive().max(3650).default(365),
  autoRenew: z.boolean().optional(),
});

const ownerInputSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  password: z.string().min(8).max(255).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE').optional(),
  timezone: z.string().max(50).optional(),
  locale: z.string().max(10).optional(),
  metadata: z.record(z.any()).optional(),
}).refine(
  (data) => data.id || (data.name && data.password),
  {
    message: 'Provide an existing owner id or all required fields (name, password) to create a new owner.',
    path: ['owner'],
  },
);

const superAdminInputSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(255),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().max(20).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE').optional(),
  timezone: z.string().max(50).optional(),
  locale: z.string().max(10).optional(),
  metadata: z.record(z.any()).optional(),
});

const schoolInputSchema = z.object({
  name: z.string().min(2).max(255),
  code: z.string().min(2).max(20).regex(/^[A-Z0-9_-]+$/),
  phone: z.string().min(3).max(20),
  country: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  address: z.string().min(5).max(255),
  postalCode: z.string().max(20).optional(),
  timezone: z.string().max(50).optional(),
  locale: z.string().max(10).optional(),
  description: z.string().max(1000).optional(),
  website: z.string().max(255).optional(),
  metadata: z.record(z.any()).optional(),
});

const subscriptionInputSchema = z.object({
  durationDays: z.number().int().positive().max(3650).default(365),
  startDate: z.string().datetime().optional(),
  autoRenew: z.boolean().optional(),
}).optional();

const createPlatformSchoolSchema = z.object({
  owner: ownerInputSchema,
  superAdmin: superAdminInputSchema,
  school: schoolInputSchema,
  packageId: z.union([z.string(), z.number()]),
  subscription: subscriptionInputSchema,
});

const statusUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

const churnAnalyticsSchema = z.object({
  range: z.enum(['7d', '30d', '90d', '1y']).optional(),
});

const serializeMetadata = (payload) => JSON.stringify(convertBigIntToString(payload));

const schoolComparisonSchema = z.object({
  metric: z.enum(['students', 'teachers', 'staff', 'revenue']).default('students'),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

const listSubscriptionsQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED']).optional(),
  packageId: z.union([z.string(), z.number()]).optional(),
  schoolId: z.union([z.string(), z.number()]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

const listSchoolsQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'DEACTIVATED']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

const branchStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']);

const branchPayloadSchema = z.object({
  name: z.string().min(2).max(100),
  code: z
    .string()
    .min(2)
    .max(30)
    .regex(/^[a-z0-9_-]+$/i, 'Code can only include letters, numbers, underscores, and dashes')
    .transform((value) => value.toUpperCase()),
  shortName: z.string().min(2).max(50).optional(),
  type: z.string().max(50).optional(),
  description: z.string().max(1000).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  alternatePhone: z.string().max(20).optional(),
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  latitude: z.number().finite().optional(),
  longitude: z.number().finite().optional(),
  timezone: z.string().max(50).optional(),
  isMain: z.boolean().optional(),
  status: branchStatusEnum.optional(),
  openedDate: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

const branchUpdateSchema = branchPayloadSchema.partial({
  name: true,
  code: true,
});

const courseTypeEnum = z.enum(['CORE', 'ELECTIVE', 'ENRICHMENT', 'REMEDIAL', 'EXTRACURRICULAR', 'ONLINE']);

const coursePayloadSchema = z.object({
  name: z.string().min(2).max(150),
  code: z
    .string()
    .min(2)
    .max(30)
    .regex(/^[a-z0-9_-]+$/i, 'Code can only include letters, numbers, underscores, and dashes')
    .transform((value) => value.toUpperCase()),
  type: courseTypeEnum,
  description: z.string().max(1500).optional(),
  summary: z.string().max(3000).optional(),
  objectives: z.any().optional(),
  creditHours: z.number().int().min(0).max(100).optional(),
  level: z.number().int().min(0).max(50).optional(),
  durationWeeks: z.number().int().min(0).max(520).optional(),
  deliveryMode: z.string().max(30).optional(),
  language: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  enrollmentCap: z.number().int().min(0).max(100000).optional(),
  departmentId: z.union([z.string(), z.number()]).optional(),
  metadata: z.record(z.any()).optional(),
});

const courseUpdateSchema = coursePayloadSchema.partial({
  name: true,
  code: true,
  type: true,
});

const managerUserPayloadSchema = z
  .object({
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
    password: z.string().min(8).max(255),
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
    timezone: z.string().max(50).optional(),
    locale: z.string().max(10).optional(),
    metadata: z.record(z.any()).optional(),
  })
  .strict();

const branchManagerAssignmentSchema = z
  .object({
    managerUserId: z.union([z.string(), z.number()]).optional(),
    manager: managerUserPayloadSchema.optional(),
    branchIds: z.array(z.union([z.string(), z.number()])).optional(),
  })
  .refine(
    (value) => value.managerUserId !== undefined || value.manager !== undefined,
    'Provide either managerUserId or manager payload',
  );

const courseManagerAssignmentSchema = z
  .object({
    managerUserId: z.union([z.string(), z.number()]).optional(),
    manager: managerUserPayloadSchema.optional(),
    courseIds: z.array(z.union([z.string(), z.number()])).optional(),
  })
  .refine(
    (value) => value.managerUserId !== undefined || value.manager !== undefined,
    'Provide either managerUserId or manager payload',
  );

const analyticsFilterSchema = z.object({
  range: z.enum(['7d', '30d', '90d', '1y']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  schoolId: z.union([z.string(), z.number()]).optional(),
  packageId: z.union([z.string(), z.number()]).optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  lifecycle: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

const logAnalyticsFilterSchema = analyticsFilterSchema.extend({
  severity: z.enum(['INFO', 'WARNING', 'ERROR']).optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  userId: z.union([z.string(), z.number()]).optional(),
  search: z.string().optional(),
  responseStatusFrom: z.union([z.string(), z.number()]).optional(),
  responseStatusTo: z.union([z.string(), z.number()]).optional(),
  isSuccess: z
    .union([
      z.boolean(),
      z.string().transform((value) => value === 'true'),
    ])
    .optional(),
});

const logTimelineFilterSchema = logAnalyticsFilterSchema.extend({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

const CUSTOM_REPORT_METRICS = [
  {
    id: 'totalRevenue',
    label: 'Total Revenue',
    description: 'Sum of paid invoice totals within the selected window.',
    type: 'currency',
    source: 'payments',
  },
  {
    id: 'transactionCount',
    label: 'Transactions',
    description: 'Number of paid invoices.',
    type: 'number',
    source: 'payments',
  },
];

const CUSTOM_REPORT_DIMENSIONS = [
  {
    id: 'package',
    label: 'Package',
    description: 'Primary subscription package for the school tied to the payment.',
  },
  {
    id: 'country',
    label: 'Country',
    description: 'School country pulled from school profile.',
  },
  {
    id: 'schoolStatus',
    label: 'School Status',
    description: 'Lifecycle status of the paying school.',
  },
];

const ANALYTICS_RANGE_MAP = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365,
};

const ANALYTICS_CACHE_TTL = 60 * 1000;
const analyticsCache = new Map();

const getCachedResponse = (key) => {
  const entry = analyticsCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    analyticsCache.delete(key);
    return null;
  }
  return entry.payload;
};

const setCachedResponse = (key, payload, ttl = ANALYTICS_CACHE_TTL) => {
  analyticsCache.set(key, { payload, expiry: Date.now() + ttl });
};

const invalidateAnalyticsCache = (prefix = null) => {
  for (const key of analyticsCache.keys()) {
    if (!prefix || key.startsWith(prefix)) {
      analyticsCache.delete(key);
    }
  }
};

const resolveAnalyticsDateRange = (filters) => {
  const now = new Date();
  const end = filters.dateTo ? new Date(filters.dateTo) : now;
  const rangeKey = filters.range || '30d';
  const start = filters.dateFrom
    ? new Date(filters.dateFrom)
    : new Date(end.getTime() - (ANALYTICS_RANGE_MAP[rangeKey] || 30) * 24 * 60 * 60 * 1000);

  return {
    start: Number.isNaN(start.getTime()) ? new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000) : start,
    end: Number.isNaN(end.getTime()) ? now : end,
    range: filters.range || 'custom',
  };
};

const buildSchoolRelationFilter = (filters) => {
  const relation = {};
  if (filters.country) relation.country = filters.country;
  if (filters.state) relation.state = filters.state;
  if (filters.city) relation.city = filters.city;
  if (filters.lifecycle) relation.status = filters.lifecycle;
  if (filters.packageId) {
    relation.subscription = { packageId: BigInt(filters.packageId) };
  }
  return Object.keys(relation).length ? relation : undefined;
};

const buildDateTrend = (records, key, valueSelector = () => 1) =>
  records.reduce((acc, record) => {
    const value = record[key];
    if (!value) return acc;
    const bucket = new Date(value).toISOString().slice(0, 10);
    acc[bucket] = (acc[bucket] || 0) + valueSelector(record);
    return acc;
  }, {});

const buildCustomReportDataset = async ({ metrics, dimensions, filters }) => {
  const resolvedFilters = filters ?? {};
  const { start, end, range } = resolveAnalyticsDateRange(resolvedFilters);

  const paymentWhere = {
    paymentDate: { gte: start, lte: end },
    status: 'PAID',
    deletedAt: null,
    ...(resolvedFilters.schoolId ? { schoolId: BigInt(resolvedFilters.schoolId) } : {}),
    ...(resolvedFilters.packageId
      ? {
          school: {
            subscription: {
              packageId: BigInt(resolvedFilters.packageId),
            },
          },
        }
      : {}),
    ...(resolvedFilters.country ? { school: { country: resolvedFilters.country } } : {}),
    ...(resolvedFilters.state ? { school: { state: resolvedFilters.state } } : {}),
    ...(resolvedFilters.city ? { school: { city: resolvedFilters.city } } : {}),
  };

  const payments = await prisma.payment.findMany({
    where: paymentWhere,
    select: {
      total: true,
      school: {
        select: {
          id: true,
          status: true,
          country: true,
          subscription: {
            select: {
              package: {
                select: { name: true },
              },
            },
          },
        },
      },
    },
  });

  const summary = {
    totalRevenue: 0,
    transactionCount: 0,
  };

  const rowsMap = new Map();

  payments.forEach((payment) => {
    const pkgName = payment.school?.subscription?.package?.name || 'Unassigned';
    const country = payment.school?.country || 'Unknown';
    const schoolStatus = payment.school?.status || 'UNKNOWN';
    const dimensionValues = {
      package: pkgName,
      country,
      schoolStatus,
    };
    const key =
      dimensions.length > 0
        ? dimensions.map((dim) => dimensionValues[dim] || 'N/A').join('||')
        : 'all';
    if (!rowsMap.has(key)) {
      rowsMap.set(key, {
        dimensions: dimensions.reduce((acc, dim) => {
          acc[dim] = dimensionValues[dim] || 'N/A';
          return acc;
        }, {}),
        metrics: {
          totalRevenue: 0,
          transactionCount: 0,
        },
      });
    }
    const entry = rowsMap.get(key);
    const amount = Number(payment.total || 0);
    entry.metrics.totalRevenue += amount;
    entry.metrics.transactionCount += 1;
    summary.totalRevenue += amount;
    summary.transactionCount += 1;
  });

  const rows = Array.from(rowsMap.values()).map((row) => ({
    ...row,
    metrics: {
      totalRevenue: Number(row.metrics.totalRevenue.toFixed(2)),
      transactionCount: row.metrics.transactionCount,
    },
  }));

  return {
    range,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    rows,
    summary: {
      totalRevenue: Number(summary.totalRevenue.toFixed(2)),
      transactionCount: summary.transactionCount,
    },
    dimensionsUsed: dimensions,
    metricsUsed: metrics,
  };
};

const createResponse = (res, status, payload) => res.status(status).json({
  success: true,
  data: convertBigIntToString(payload),
});

const createError = (res, status, message, details = null) => res.status(status).json({
  success: false,
  error: message,
  details,
});

class PlatformController {
  async getDashboardOverview(req, res) {
    try {
      const cacheKey = 'dashboard-overview';
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return res.status(200).json(cached);
      }

      const [
        totalSchools,
        activeSchools,
        totalSubscriptions,
        activeSubscriptions,
        totalRevenue,
        recentSubscriptions,
      ] = await Promise.all([
        prisma.school.count(),
        prisma.school.count({ where: { status: 'ACTIVE' } }),
        prisma.schoolSubscription.count(),
        prisma.schoolSubscription.count({ where: { status: 'ACTIVE' } }),
        prisma.payment.aggregate({ _sum: { total: true } }),
        prisma.schoolSubscription.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            school: { select: { id: true, name: true, code: true } },
            package: { select: { id: true, name: true } },
          },
        }),
      ]);

      const payload = {
        success: true,
        data: {
          totals: {
            schools: totalSchools,
            activeSchools,
            subscriptions: totalSubscriptions,
            activeSubscriptions,
            revenue: Number(totalRevenue._sum.total ?? 0),
          },
          recentSubscriptions: convertBigIntToString(recentSubscriptions),
        },
      };

      setCachedResponse(cacheKey, payload);

      return res.status(200).json(payload);
    } catch (error) {
      console.error('Platform dashboard error:', error);
      return createError(res, 500, 'Failed to load dashboard overview');
    }
  }

  async listPackages(req, res) {
    try {
      const packages = await prisma.package.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return createResponse(res, 200, packages);
    } catch (error) {
      console.error('List packages error:', error);
      return createError(res, 500, 'Failed to fetch packages');
    }
  }

  async getPackageById(req, res) {
    try {
      const { id } = req.params;
      const pkg = await prisma.package.findUnique({
        where: { id: BigInt(id) },
      });
      if (!pkg) {
        return createError(res, 404, 'Package not found');
      }
      return createResponse(res, 200, pkg);
    } catch (error) {
      console.error('Get package error:', error);
      return createError(res, 500, 'Failed to fetch package');
    }
  }

  async createPackage(req, res) {
    try {
      const data = packageSchema.parse(req.body);

      const existing = await prisma.package.findUnique({
        where: { name: data.name },
      });
      if (existing) {
        return createError(res, 400, 'Package name already exists');
      }

      const pkg = await prisma.package.create({
        data: {
          ...data,
          createdBy: req.user?.id ? BigInt(req.user.id) : null,
        },
      });

      await createAuditLog({
        action: 'PACKAGE_CREATED',
        entityType: 'Package',
        entityId: pkg.id,
        userId: req.user?.id ? BigInt(req.user.id) : null,
        metadata: serializeMetadata({ packageId: pkg.id }),
      });

      invalidateAnalyticsCache();

      return createResponse(res, 201, pkg);
    } catch (error) {
      console.error('Create package error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid package payload', error.errors);
      }
      return createError(res, 500, 'Failed to create package');
    }
  }

  async updatePackage(req, res) {
    try {
      const { id } = req.params;
      const data = packageUpdateSchema.parse(req.body);

      const pkg = await prisma.package.update({
        where: { id: BigInt(id) },
        data,
      });

      await createAuditLog({
        action: 'PACKAGE_UPDATED',
        entityType: 'Package',
        entityId: pkg.id,
        userId: req.user?.id ? BigInt(req.user.id) : null,
        metadata: serializeMetadata({ packageId: pkg.id, updates: data }),
      });

      invalidateAnalyticsCache();

      return createResponse(res, 200, pkg);
    } catch (error) {
      console.error('Update package error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid package payload', error.errors);
      }
      if (error.code === 'P2025') {
        return createError(res, 404, 'Package not found');
      }
      return createError(res, 500, 'Failed to update package');
    }
  }

  async togglePackageStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);

      const pkg = await prisma.package.update({
        where: { id: BigInt(id) },
        data: { isActive },
      });

      await createAuditLog({
        action: isActive ? 'PACKAGE_ACTIVATED' : 'PACKAGE_DEACTIVATED',
        entityType: 'Package',
        entityId: pkg.id,
        userId: req.user?.id ? BigInt(req.user.id) : null,
        metadata: serializeMetadata({ packageId: pkg.id, isActive }),
      });

      invalidateAnalyticsCache();

      return createResponse(res, 200, pkg);
    } catch (error) {
      console.error('Toggle package status error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid payload', error.errors);
      }
      if (error.code === 'P2025') {
        return createError(res, 404, 'Package not found');
      }
      return createError(res, 500, 'Failed to update package status');
    }
  }

  async listSubscriptions(req, res) {
    try {
      const params = listSubscriptionsQuerySchema.parse(req.query);
      const { status, packageId, schoolId, page, limit } = params;

      const where = {
        ...(status ? { status } : {}),
        ...(packageId ? { packageId: BigInt(packageId) } : {}),
        ...(schoolId ? { schoolId: BigInt(schoolId) } : {}),
      };

      const skip = (page - 1) * limit;

      const [subscriptions, total] = await Promise.all([
        prisma.schoolSubscription.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            school: {
              select: {
                id: true,
                name: true,
                code: true,
                status: true,
                tenantId: true,
              },
            },
            package: {
              select: { id: true, name: true, priceMonthly: true, priceYearly: true },
            },
          },
          skip,
          take: limit,
        }),
        prisma.schoolSubscription.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        data: convertBigIntToString(subscriptions),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
        },
      });
    } catch (error) {
      console.error('List subscriptions error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid subscription query parameters', error.errors);
      }
      return createError(res, 500, 'Failed to fetch subscriptions');
    }
  }

  async renewSubscription(req, res) {
    try {
      const { id } = req.params;
      const { extensionDays } = renewSchema.parse(req.body);

      const subscription = await prisma.schoolSubscription.update({
        where: { id: BigInt(id) },
        data: {
          status: 'ACTIVE',
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + extensionDays * 24 * 60 * 60 * 1000),
        },
        include: {
          school: { select: { id: true, name: true } },
          package: { select: { id: true, name: true } },
        },
      });

      if (subscription.schoolId) {
        await subscriptionService.updateSubscriptionUsage(subscription.schoolId);
      }

      await createAuditLog({
        action: 'SUBSCRIPTION_RENEWED',
        entityType: 'SchoolSubscription',
        entityId: subscription.id,
        userId: req.user?.id ? BigInt(req.user.id) : null,
        schoolId: subscription.schoolId,
        metadata: serializeMetadata({ extensionDays }),
      });

      invalidateAnalyticsCache();

      return createResponse(res, 200, subscription);
    } catch (error) {
      console.error('Renew subscription error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid payload', error.errors);
      }
      if (error.code === 'P2025') {
        return createError(res, 404, 'Subscription not found');
      }
      return createError(res, 500, 'Failed to renew subscription');
    }
  }

  async changeSubscriptionPackage(req, res) {
    try {
      const { id } = req.params;
      const { packageId, autoRenew } = changePackageSchema.parse(req.body);

      const existingSubscription = await prisma.schoolSubscription.findUnique({
        where: { id: BigInt(id) },
        select: {
          id: true,
          schoolId: true,
          packageId: true,
        },
      });

      if (!existingSubscription) {
        return createError(res, 404, 'Subscription not found');
      }

      const pkg = await prisma.package.findUnique({
        where: { id: BigInt(packageId) },
      });
      if (!pkg) {
        return createError(res, 404, 'Target package not found');
      }

      const subscription = await prisma.schoolSubscription.update({
        where: { id: BigInt(id) },
        data: {
          packageId: BigInt(packageId),
          autoRenew: autoRenew ?? undefined,
        },
        include: {
          school: { select: { id: true, name: true } },
          package: { select: { id: true, name: true } },
        },
      });

      if (subscription.schoolId) {
        await subscriptionService.updateSubscriptionUsage(subscription.schoolId);
      }

      await createAuditLog({
        action: 'SUBSCRIPTION_PACKAGE_CHANGED',
        entityType: 'SchoolSubscription',
        entityId: subscription.id,
        userId: req.user?.id ? BigInt(req.user.id) : null,
        schoolId: subscription.schoolId,
        metadata: serializeMetadata({
          previousPackageId: existingSubscription.packageId?.toString() || null,
          newPackageId: subscription.packageId?.toString() || null,
          autoRenew: subscription.autoRenew,
        }),
      });

      invalidateAnalyticsCache();

      return createResponse(res, 200, subscription);
    } catch (error) {
      console.error('Change subscription package error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid payload', error.errors);
      }
      if (error.code === 'P2025') {
        return createError(res, 404, 'Subscription not found');
      }
      return createError(res, 500, 'Failed to change subscription package');
    }
  }

  async cancelSubscription(req, res) {
    try {
      const { id } = req.params;
      const payload = cancelSubscriptionSchema.parse(req.body ?? {});

      const existing = await prisma.schoolSubscription.findUnique({
        where: { id: BigInt(id) },
        include: {
          school: { select: { id: true, name: true } },
          package: { select: { id: true, name: true } },
        },
      });

      if (!existing) {
        return createError(res, 404, 'Subscription not found');
      }

      if (existing.status === 'CANCELLED') {
        return createResponse(res, 200, existing);
      }

      const effectiveDate = payload.effectiveDate ? new Date(payload.effectiveDate) : new Date();
      const expiresAt =
        existing.expiresAt && existing.expiresAt < effectiveDate ? existing.expiresAt : effectiveDate;

      const updated = await prisma.schoolSubscription.update({
        where: { id: existing.id },
        data: {
          status: 'CANCELLED',
          autoRenew: false,
          expiresAt,
        },
        include: {
          school: { select: { id: true, name: true } },
          package: { select: { id: true, name: true } },
        },
      });

      if (updated.schoolId) {
        await subscriptionService.updateSubscriptionUsage(updated.schoolId);
      }

      await createAuditLog({
        action: 'SUBSCRIPTION_CANCELLED',
        entityType: 'SchoolSubscription',
        entityId: updated.id,
        userId: req.user?.id ? BigInt(req.user.id) : null,
        schoolId: updated.schoolId,
        metadata: serializeMetadata({
          previousStatus: existing.status,
          newStatus: updated.status,
          reason: payload.reason || null,
        }),
      });

      invalidateAnalyticsCache();

      return createResponse(res, 200, updated);
    } catch (error) {
      console.error('Cancel subscription error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid payload', error.errors);
      }
      if (error.code === 'P2025') {
        return createError(res, 404, 'Subscription not found');
      }
      return createError(res, 500, 'Failed to cancel subscription');
    }
  }

  async reactivateSubscription(req, res) {
    try {
      const { id } = req.params;
      const payload = reactivateSubscriptionSchema.parse(req.body ?? {});

      const existing = await prisma.schoolSubscription.findUnique({
        where: { id: BigInt(id) },
        include: {
          school: { select: { id: true, name: true } },
          package: { select: { id: true, name: true } },
        },
      });

      if (!existing) {
        return createError(res, 404, 'Subscription not found');
      }

      const startDate = payload.startDate ? new Date(payload.startDate) : new Date();
      const expiresAt = new Date(startDate.getTime() + payload.durationDays * 24 * 60 * 60 * 1000);

      const updated = await prisma.schoolSubscription.update({
        where: { id: existing.id },
        data: {
          status: 'ACTIVE',
          startedAt: startDate,
          expiresAt,
          autoRenew: payload.autoRenew ?? true,
        },
        include: {
          school: { select: { id: true, name: true } },
          package: { select: { id: true, name: true } },
        },
      });

      if (updated.schoolId) {
        await subscriptionService.updateSubscriptionUsage(updated.schoolId);
      }

      await createAuditLog({
        action: 'SUBSCRIPTION_REACTIVATED',
        entityType: 'SchoolSubscription',
        entityId: updated.id,
        userId: req.user?.id ? BigInt(req.user.id) : null,
        schoolId: updated.schoolId,
        metadata: serializeMetadata({
          previousStatus: existing.status,
          newStatus: updated.status,
          durationDays: payload.durationDays,
        }),
      });

      invalidateAnalyticsCache();

      return createResponse(res, 200, updated);
    } catch (error) {
      console.error('Reactivate subscription error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid payload', error.errors);
      }
      if (error.code === 'P2025') {
        return createError(res, 404, 'Subscription not found');
      }
      return createError(res, 500, 'Failed to reactivate subscription');
    }
  }

  async createSchoolWithOwner(req, res) {
    try {
      const payload = createPlatformSchoolSchema.parse(req.body);

      const {
        owner: ownerInput,
        superAdmin: superAdminInput,
        school: schoolInput,
        packageId,
        subscription: subscriptionInput,
      } = payload;

      const result = await prisma.$transaction(async (tx) => {
        let ownerRecord = null;

        if (ownerInput.id) {
          ownerRecord = await tx.owner.findUnique({
            where: { id: BigInt(ownerInput.id) },
          });
          if (!ownerRecord) {
            throw new Error('Owner not found for provided id.');
          }
          if (ownerInput.status) {
            ownerRecord = await tx.owner.update({
              where: { id: ownerRecord.id },
              data: {
                status: ownerInput.status,
                phone: ownerInput.phone ?? ownerRecord.phone,
                timezone: ownerInput.timezone ?? ownerRecord.timezone,
                locale: ownerInput.locale ?? ownerRecord.locale,
              },
            });
          }
        } else {
          const salt = generateSalt();
          const hashedPassword = await hashPassword(ownerInput.password, salt);
          ownerRecord = await tx.owner.create({
            data: {
              name: ownerInput.name,
              phone: ownerInput.phone ?? null,
              password: hashedPassword,
              salt,
              status: ownerInput.status ?? 'ACTIVE',
              timezone: ownerInput.timezone ?? 'UTC',
              locale: ownerInput.locale ?? 'en-US',
              metadata: ownerInput.metadata ? serializeMetadata(ownerInput.metadata) : null,
            },
          });
        }

        const normalizedCode = schoolInput.code.toUpperCase();
        const tenantId = schoolInput.metadata?.tenantId || randomUUID();

        const existingSchoolWithCode = await tx.school.findUnique({
          where: { code: normalizedCode },
          select: { id: true },
        });
        if (existingSchoolWithCode) {
          throw new Error('School code already exists.');
        }

        const schoolSettings = schoolInput.metadata || undefined;

        const schoolRecord = await tx.school.create({
          data: {
            name: schoolInput.name,
            code: normalizedCode,
            phone: schoolInput.phone,
            country: schoolInput.country,
            state: schoolInput.state,
            city: schoolInput.city,
            address: schoolInput.address,
            postalCode: schoolInput.postalCode ?? null,
            timezone: schoolInput.timezone ?? 'UTC',
            locale: schoolInput.locale ?? 'en-US',
            about: schoolInput.description ?? null,
            website: schoolInput.website ?? null,
            status: 'ACTIVE',
            ownerId: ownerRecord.id,
            tenantId,
            createdBy: req.user?.id ? BigInt(req.user.id) : null,
            settings: schoolSettings ?? undefined,
          },
        });

        const userSalt = generateSalt();
        const userHashedPassword = await hashPassword(superAdminInput.password, userSalt);

        const superAdminUser = await tx.user.create({
          data: {
            username: superAdminInput.username,
            firstName: superAdminInput.firstName,
            lastName: superAdminInput.lastName,
            password: userHashedPassword,
            salt: userSalt,
            phone: superAdminInput.phone ?? null,
            role: 'SUPER_ADMIN',
            status: superAdminInput.status ?? 'ACTIVE',
            schoolId: schoolRecord.id,
            createdByOwnerId: ownerRecord.id,
            createdBy: req.user?.id ? BigInt(req.user.id) : null,
            timezone: superAdminInput.timezone ?? 'UTC',
            locale: superAdminInput.locale ?? 'en-US',
            metadata: superAdminInput.metadata ? serializeMetadata(superAdminInput.metadata) : null,
          },
        });

        const subscriptionStart = subscriptionInput?.startDate
          ? new Date(subscriptionInput.startDate)
          : new Date();
        const durationDays = subscriptionInput?.durationDays ?? 365;
        const expiresAt = new Date(subscriptionStart.getTime() + durationDays * 24 * 60 * 60 * 1000);

        const subscriptionRecord = await tx.schoolSubscription.create({
          data: {
            schoolId: schoolRecord.id,
            packageId: BigInt(packageId),
            status: 'ACTIVE',
            startedAt: subscriptionStart,
            expiresAt,
            autoRenew: subscriptionInput?.autoRenew ?? true,
          },
          include: {
            package: true,
          },
        });

        const updatedSchool = await tx.school.update({
          where: { id: schoolRecord.id },
          data: {
            superAdminUserId: superAdminUser.id,
            subscriptionId: subscriptionRecord.id,
          },
          include: {
            subscription: {
              include: {
                package: true,
              },
            },
            superAdminUser: true,
          },
        });

        return {
          owner: ownerRecord,
          school: updatedSchool,
          superAdmin: superAdminUser,
          subscription: subscriptionRecord,
        };
      });

      await subscriptionService.updateSubscriptionUsage(result.school.id);

      await createAuditLog({
        action: 'PLATFORM_SCHOOL_CREATED',
        entityType: 'School',
        entityId: result.school.id,
        userId: req.user?.id ? BigInt(req.user.id) : null,
        schoolId: result.school.id,
        metadata: serializeMetadata({
          ownerId: Number(result.owner.id),
          subscriptionId: Number(result.subscription.id),
        }),
      });

      invalidateAnalyticsCache();

      return res.status(201).json({
        success: true,
        data: convertBigIntToString({
          owner: result.owner,
          school: result.school,
          superAdmin: result.superAdmin,
          subscription: result.subscription,
        }),
      });
    } catch (error) {
      console.error('Create platform school error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid payload', error.errors);
      }
      if (error.code === 'P2002') {
        return createError(res, 409, 'Unique constraint violated');
      }
      return createError(res, 500, error.message || 'Failed to create school');
    }
  }

  async updateSchoolStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = statusUpdateSchema.parse(req.body);

      const school = await prisma.school.update({
        where: { id: BigInt(id) },
        data: { status },
        include: {
          subscription: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      await createAuditLog({
        action: status === 'ACTIVE' ? 'SCHOOL_ACTIVATED' : 'SCHOOL_DEACTIVATED',
        entityType: 'School',
        entityId: school.id,
        userId: req.user?.id ? BigInt(req.user.id) : null,
        schoolId: school.id,
        metadata: serializeMetadata({ status }),
      });

      if (school.id) {
        await subscriptionService.updateSubscriptionUsage(school.id);
      }

      invalidateAnalyticsCache();

      return createResponse(res, 200, school);
    } catch (error) {
      console.error('Update school status error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid payload', error.errors);
      }
      if (error.code === 'P2025') {
        return createError(res, 404, 'School not found');
      }
      return createError(res, 500, 'Failed to update school status');
    }
  }

  async updateSuperAdminStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = statusUpdateSchema.parse(req.body);

      const user = await prisma.user.update({
        where: {
          id: BigInt(id),
        },
        data: { status },
        select: {
          id: true,
          username: true,
          role: true,
          status: true,
          schoolId: true,
        },
      });

      if (user.role !== 'SUPER_ADMIN') {
        return createError(res, 400, 'Target user is not a SUPER_ADMIN');
      }

      await createAuditLog({
        action: status === 'ACTIVE' ? 'SUPER_ADMIN_ACTIVATED' : 'SUPER_ADMIN_DEACTIVATED',
        entityType: 'User',
        entityId: user.id,
        userId: req.user?.id ? BigInt(req.user.id) : null,
        schoolId: user.schoolId ?? null,
        metadata: serializeMetadata({ status }),
      });

      return createResponse(res, 200, user);
    } catch (error) {
      console.error('Update super admin status error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid payload', error.errors);
      }
      if (error.code === 'P2025') {
        return createError(res, 404, 'User not found');
      }
      return createError(res, 500, 'Failed to update super admin status');
    }
  }


  async getSubscriptionHistory(req, res) {
    try {
      const { id } = req.params;
      const subscription = await prisma.schoolSubscription.findUnique({
        where: { id: BigInt(id) },
        include: {
          school: { select: { id: true, name: true, tenantId: true } },
          package: true,
        },
      });
      if (!subscription) {
        return createError(res, 404, 'Subscription not found');
      }
      return createResponse(res, 200, subscription);
    } catch (error) {
      console.error('Get subscription history error:', error);
      return createError(res, 500, 'Failed to load subscription history');
    }
  }

  async listSchools(req, res) {
    try {
      const params = listSchoolsQuerySchema.parse(req.query);
      const { status, search, page, limit } = params;

      const where = {
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { tenantId: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      };

      const skip = (page - 1) * limit;

      const [schools, total] = await Promise.all([
        prisma.school.findMany({
          where,
          include: {
            subscription: {
              include: { package: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.school.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        data: convertBigIntToString(schools),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
        },
      });
    } catch (error) {
      console.error('List platform schools error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid school query parameters', error.errors);
      }
      return createError(res, 500, 'Failed to fetch schools');
    }
  }

  async getSchoolAnalytics(req, res) {
    try {
      const { id } = req.params;
      const school = await prisma.school.findUnique({
        where: { id: BigInt(id) },
        include: {
          subscription: {
            include: { package: true },
          },
        },
      });
      if (!school) {
        return createError(res, 404, 'School not found');
      }
      const usage = await subscriptionService.calculateUsageSnapshot(id);
      return res.status(200).json({
        success: true,
        data: {
          school: convertBigIntToString(school),
          usage,
        },
      });
    } catch (error) {
      console.error('Get school analytics error:', error);
      return createError(res, 500, 'Failed to load school analytics');
    }
  }

  async listSchoolBranches(req, res) {
    try {
      const { id } = req.params;
      const branches = await superadminService.branches.list(id);
      return createResponse(res, 200, branches);
    } catch (error) {
      console.error('List school branches error:', error);
      return createError(res, error?.message ? 400 : 500, error?.message || 'Failed to fetch school branches');
    }
  }

  async createSchoolBranch(req, res) {
    try {
      const { id } = req.params;
      const payload = branchPayloadSchema.parse(req.body);
      const branch = await superadminService.branches.create({
        schoolId: id,
        payload,
        actorId: req.user?.id,
      });
      return createResponse(res, 201, branch);
    } catch (error) {
      console.error('Create school branch error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid branch payload', error.errors);
      }
      return createError(res, error?.message ? 400 : 500, error?.message || 'Failed to create branch');
    }
  }

  async updateSchoolBranch(req, res) {
    try {
      const { branchId } = req.params;
      const payload = branchUpdateSchema.parse(req.body);
      if (!Object.keys(payload).length) {
        return createError(res, 400, 'No branch fields provided for update');
      }

      const branch = await superadminService.branches.update({
        branchId,
        payload,
        actorId: req.user?.id,
      });

      return createResponse(res, 200, branch);
    } catch (error) {
      console.error('Update school branch error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid branch payload', error.errors);
      }
      return createError(res, error?.message ? 400 : 500, error?.message || 'Failed to update branch');
    }
  }

  async archiveSchoolBranch(req, res) {
    try {
      const { branchId } = req.params;
      const branch = await superadminService.branches.archive({
        branchId,
        actorId: req.user?.id,
      });
      return createResponse(res, 200, branch);
    } catch (error) {
      console.error('Archive school branch error:', error);
      return createError(res, error?.message ? 400 : 500, error?.message || 'Failed to archive branch');
    }
  }

  async assignBranchManager(req, res) {
    try {
      const { id, branchId } = req.params;
      const assignmentPayload = branchManagerAssignmentSchema.parse(req.body);

      const branchIds = Array.from(
        new Set(
          [
            branchId,
            ...(assignmentPayload.branchIds ?? []),
          ]
            .filter((value) => value !== undefined && value !== null && `${value}`.trim() !== '')
            .map((value) => `${value}`),
        ),
      );

      if (!branchIds.length) {
        return createError(res, 400, 'At least one branch id is required for assignment');
      }

      const assignments = [];
      let managerUserId = assignmentPayload.managerUserId
        ? `${assignmentPayload.managerUserId}`
        : null;

      for (let index = 0; index < branchIds.length; index += 1) {
        const currentBranchId = branchIds[index];
        const assignment = await superadminService.branches.assignManager({
          branchId: currentBranchId,
          schoolId: id,
          managerUserId,
          managerPayload: !managerUserId && index === 0 ? assignmentPayload.manager : undefined,
          actorId: req.user?.id,
        });

        assignments.push(assignment);
        if (!managerUserId) {
          managerUserId = assignment?.userId ? `${assignment.userId}` : null;
        }
      }

      const responsePayload = branchIds.length === 1 ? assignments[0] : assignments;
      return createResponse(res, 201, responsePayload);
    } catch (error) {
      console.error('Assign branch manager error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid manager assignment payload', error.errors);
      }
      return createError(res, error?.message ? 400 : 500, error?.message || 'Failed to assign branch manager');
    }
  }

  async revokeBranchManager(req, res) {
    try {
      const { branchId, managerId } = req.params;
      if (!managerId) {
        return createError(res, 400, 'managerId is required');
      }

      const assignment = await superadminService.branches.revokeManager({
        branchId,
        userId: managerId,
        actorId: req.user?.id,
      });

      return createResponse(res, 200, assignment);
    } catch (error) {
      console.error('Revoke branch manager error:', error);
      return createError(res, error?.message ? 400 : 500, error?.message || 'Failed to revoke branch manager');
    }
  }

  async listSchoolCourses(req, res) {
    try {
      const { id } = req.params;
      const courses = await superadminService.courses.list(id);
      return createResponse(res, 200, courses);
    } catch (error) {
      console.error('List school courses error:', error);
      return createError(res, error?.message ? 400 : 500, error?.message || 'Failed to fetch school courses');
    }
  }

  async createSchoolCourse(req, res) {
    try {
      const { id } = req.params;
      const payload = coursePayloadSchema.parse(req.body);
      const course = await superadminService.courses.create({
        schoolId: id,
        payload,
        actorId: req.user?.id,
      });
      return createResponse(res, 201, course);
    } catch (error) {
      console.error('Create school course error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid course payload', error.errors);
      }
      return createError(res, error?.message ? 400 : 500, error?.message || 'Failed to create course');
    }
  }

  async updateSchoolCourse(req, res) {
    try {
      const { courseId } = req.params;
      const payload = courseUpdateSchema.parse(req.body);
      if (!Object.keys(payload).length) {
        return createError(res, 400, 'No course fields provided for update');
      }
      const course = await superadminService.courses.update({
        courseId,
        payload,
        actorId: req.user?.id,
      });
      return createResponse(res, 200, course);
    } catch (error) {
      console.error('Update school course error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid course payload', error.errors);
      }
      return createError(res, error?.message ? 400 : 500, error?.message || 'Failed to update course');
    }
  }

  async archiveSchoolCourse(req, res) {
    try {
      const { courseId } = req.params;
      const course = await superadminService.courses.archive({
        courseId,
        actorId: req.user?.id,
      });
      return createResponse(res, 200, course);
    } catch (error) {
      console.error('Archive school course error:', error);
      return createError(res, error?.message ? 400 : 500, error?.message || 'Failed to archive course');
    }
  }

  async assignCourseManager(req, res) {
    try {
      const { id, courseId } = req.params;
      const assignmentPayload = courseManagerAssignmentSchema.parse(req.body);

      const courseIds = Array.from(
        new Set(
          [
            courseId,
            ...(assignmentPayload.courseIds ?? []),
          ]
            .filter((value) => value !== undefined && value !== null && `${value}`.trim() !== '')
            .map((value) => `${value}`),
        ),
      );

      if (!courseIds.length) {
        return createError(res, 400, 'At least one course id is required for assignment');
      }

      const assignments = [];
      let managerUserId = assignmentPayload.managerUserId ? `${assignmentPayload.managerUserId}` : null;

      for (let index = 0; index < courseIds.length; index += 1) {
        const currentCourseId = courseIds[index];
        const assignment = await superadminService.courses.assignManager({
          courseId: currentCourseId,
          schoolId: id,
          managerUserId,
          managerPayload: !managerUserId && index === 0 ? assignmentPayload.manager : undefined,
          actorId: req.user?.id,
        });

        assignments.push(assignment);
        if (!managerUserId) {
          managerUserId = assignment?.userId ? `${assignment.userId}` : null;
        }
      }

      const responsePayload = courseIds.length === 1 ? assignments[0] : assignments;
      return createResponse(res, 201, responsePayload);
    } catch (error) {
      console.error('Assign course manager error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid manager assignment payload', error.errors);
      }
      return createError(res, error?.message ? 400 : 500, error?.message || 'Failed to assign course manager');
    }
  }

  async revokeCourseManager(req, res) {
    try {
      const { courseId, managerId } = req.params;
      if (!managerId) {
        return createError(res, 400, 'managerId is required');
      }

      const assignment = await superadminService.courses.revokeManager({
        courseId,
        userId: managerId,
        actorId: req.user?.id,
      });

      return createResponse(res, 200, assignment);
    } catch (error) {
      console.error('Revoke course manager error:', error);
      return createError(res, error?.message ? 400 : 500, error?.message || 'Failed to revoke course manager');
    }
  }

  async getFinancialAnalytics(req, res) {
    try {
      const filters = analyticsFilterSchema.parse(req.query ?? {});
      const { start, end, range } = resolveAnalyticsDateRange(filters);
      const cacheKey = `financial:${range}:${JSON.stringify(filters)}`;

      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return res.status(200).json(cached);
      }

      const schoolFilter = buildSchoolRelationFilter(filters);
      const summary = await financeAnalyticsService.getSummary({ start, end, filters, schoolFilter });

      const payload = {
        success: true,
        data: {
          range,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          filters,
          ...summary,
        },
      };

      setCachedResponse(cacheKey, payload, 2 * ANALYTICS_CACHE_TTL);

      return res.status(200).json(payload);
    } catch (error) {
      console.error('Financial analytics error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid financial analytics parameters', error.errors);
      }
      return createError(res, 500, 'Failed to load financial analytics');
    }
  }

  async getRevenueAnalytics(req, res) {
    try {
      const filters = analyticsFilterSchema.parse(req.query ?? {});
      const { start, end, range } = resolveAnalyticsDateRange(filters);
      const cacheKey = `revenue:${range}:${JSON.stringify(filters)}`;
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return res.status(200).json(cached);
      }

      const schoolFilter = buildSchoolRelationFilter(filters);
      const paymentWhere = {
        paymentDate: { gte: start, lte: end },
        deletedAt: null,
        ...(filters.schoolId ? { schoolId: BigInt(filters.schoolId) } : {}),
        ...(schoolFilter ? { school: schoolFilter } : {}),
      };

      const payments = await prisma.payment.findMany({
        where: paymentWhere,
        select: {
          paymentDate: true,
          total: true,
          status: true,
          schoolId: true,
          school: {
            select: {
              id: true,
              subscription: {
                select: {
                    packageId: true,
                    package: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      });

      const paidPayments = payments.filter((payment) => payment.status === 'PAID');
      const totalRevenue = paidPayments.reduce((sum, payment) => sum + Number(payment.total || 0), 0);
      const durationDays = Math.max(1, Math.ceil((end - start) / (24 * 60 * 60 * 1000)));
      const mrr = (totalRevenue / durationDays) * 30;
      const arr = mrr * 12;
      const uniqueSchools = new Set(
        paidPayments
          .map((payment) => (payment.schoolId ? payment.schoolId.toString() : null))
          .filter(Boolean),
      ).size;
      const arpu = uniqueSchools ? totalRevenue / uniqueSchools : 0;
      const avgTransaction = paidPayments.length ? totalRevenue / paidPayments.length : 0;

      const trend = buildDateTrend(paidPayments, 'paymentDate', (record) => Number(record.total || 0));
      const packageBreakdown = paidPayments.reduce((acc, payment) => {
        const pkgName = payment.school?.subscription?.package?.name || 'Unassigned';
        acc[pkgName] = (acc[pkgName] || 0) + Number(payment.total || 0);
        return acc;
      }, {});

      const payload = {
        success: true,
        data: {
          range,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          filters,
          totals: {
            revenue: Number(totalRevenue.toFixed(2)),
            mrr: Number(mrr.toFixed(2)),
            arr: Number(arr.toFixed(2)),
            arpu: Number(arpu.toFixed(2)),
            averageTransactionValue: Number(avgTransaction.toFixed(2)),
            payingSchools: uniqueSchools,
            transactions: paidPayments.length,
          },
          trend,
          packageBreakdown,
        },
      };

      setCachedResponse(cacheKey, payload, ANALYTICS_CACHE_TTL);
      return res.status(200).json(payload);
    } catch (error) {
      console.error('Revenue analytics error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid revenue analytics parameters', error.errors);
      }
      return createError(res, 500, 'Failed to load revenue analytics');
    }
  }

  async getGrowthAnalytics(req, res) {
    try {
      const filters = analyticsFilterSchema.parse(req.query ?? {});
      const { start, end, range } = resolveAnalyticsDateRange(filters);
      const cacheKey = `growth:${range}:${JSON.stringify(filters)}`;
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return res.status(200).json(cached);
      }

      const schoolFilter = buildSchoolRelationFilter(filters);
      const newSchoolWhere = {
        createdAt: { gte: start, lte: end },
        deletedAt: null,
        ...(schoolFilter || {}),
      };

      if (filters.packageId && !schoolFilter?.subscription) {
        newSchoolWhere.subscription = { packageId: BigInt(filters.packageId) };
      }

      const newSchools = await prisma.school.findMany({
        where: newSchoolWhere,
        select: {
          id: true,
          createdAt: true,
        },
      });

      const churnWhere = {
        status: 'CANCELLED',
        updatedAt: { gte: start, lte: end },
        ...(filters.packageId ? { packageId: BigInt(filters.packageId) } : {}),
        ...(filters.country || filters.state || filters.city
          ? {
              school: {
                ...(filters.country ? { country: filters.country } : {}),
                ...(filters.state ? { state: filters.state } : {}),
                ...(filters.city ? { city: filters.city } : {}),
              },
            }
          : {}),
      };

      const churnedSubscriptions = await prisma.schoolSubscription.findMany({
        where: churnWhere,
        select: {
          id: true,
          schoolId: true,
          updatedAt: true,
        },
      });

      const activeSchoolWhere = {
        status: 'ACTIVE',
        deletedAt: null,
        ...(schoolFilter || {}),
      };
      const activeSchools = await prisma.school.count({
        where: activeSchoolWhere,
      });

      const newCount = newSchools.length;
      const churnCount = churnedSubscriptions.length;
      const netGrowth = newCount - churnCount;
      const churnRate = activeSchools ? Number((churnCount / activeSchools).toFixed(4)) : 0;

      const payload = {
        success: true,
        data: {
          range,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          filters,
          totals: {
            newSchools: newCount,
            churnedSchools: churnCount,
            netGrowth,
            activeSchools,
            churnRate,
            retentionRate: Number((1 - churnRate).toFixed(4)),
          },
          trends: {
            newSchools: buildDateTrend(newSchools, 'createdAt'),
            churnedSchools: buildDateTrend(churnedSubscriptions, 'updatedAt'),
          },
        },
      };

      setCachedResponse(cacheKey, payload, ANALYTICS_CACHE_TTL);
      return res.status(200).json(payload);
    } catch (error) {
      console.error('Growth analytics error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid growth analytics parameters', error.errors);
      }
      return createError(res, 500, 'Failed to load growth analytics');
    }
  }

  async getPackagePerformanceAnalytics(req, res) {
    try {
      const filters = analyticsFilterSchema.parse(req.query ?? {});
      const { start, end, range } = resolveAnalyticsDateRange(filters);
      const cacheKey = `packagePerf:${range}:${JSON.stringify(filters)}`;
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return res.status(200).json(cached);
      }

      const schoolFilter = buildSchoolRelationFilter(filters);

      const paymentWhere = {
        paymentDate: { gte: start, lte: end },
        deletedAt: null,
        ...(filters.schoolId ? { schoolId: BigInt(filters.schoolId) } : {}),
        ...(schoolFilter ? { school: schoolFilter } : {}),
      };

      const payments = await prisma.payment.findMany({
        where: paymentWhere,
        select: {
          total: true,
          schoolId: true,
          school: {
            select: {
              id: true,
              subscription: {
                select: {
                  packageId: true,
                  package: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const activeSubscriptions = await prisma.schoolSubscription.findMany({
        where: {
          status: 'ACTIVE',
          ...(filters.packageId ? { packageId: BigInt(filters.packageId) } : {}),
          ...(filters.schoolId ? { schoolId: BigInt(filters.schoolId) } : {}),
          ...(schoolFilter ? { school: schoolFilter } : {}),
        },
        select: {
          packageId: true,
          package: { select: { id: true, name: true } },
          schoolId: true,
          startedAt: true,
        },
      });

      const subscriptionChanges = await prisma.schoolSubscription.findMany({
        where: {
          updatedAt: { gte: start, lte: end },
          ...(filters.packageId ? { packageId: BigInt(filters.packageId) } : {}),
          ...(filters.schoolId ? { schoolId: BigInt(filters.schoolId) } : {}),
          ...(schoolFilter ? { school: schoolFilter } : {}),
        },
        select: {
          status: true,
        },
      });

      const packageStats = new Map();
      const ensurePackage = (pkgId, pkgName) => {
        const key = pkgId ?? 'unassigned';
        if (!packageStats.has(key)) {
          packageStats.set(key, {
            packageId: key,
            packageName: pkgName ?? 'Unassigned',
            revenue: 0,
            transactions: 0,
            activeSchools: 0,
          });
        }
        return packageStats.get(key);
      };

      payments.forEach((payment) => {
        const pkgId = payment.school?.subscription?.packageId
          ? payment.school.subscription.packageId.toString()
          : 'unassigned';
        const pkgName = payment.school?.subscription?.package?.name ?? 'Unassigned';
        const entry = ensurePackage(pkgId, pkgName);
        entry.revenue += Number(payment.total || 0);
        entry.transactions += 1;
      });

      activeSubscriptions.forEach((subscription) => {
        const pkgId = subscription.packageId ? subscription.packageId.toString() : 'unassigned';
        const pkgName = subscription.package?.name ?? 'Unassigned';
        const entry = ensurePackage(pkgId, pkgName);
        entry.activeSchools += 1;
      });

      const adoptionTrendMap = {};
      activeSubscriptions.forEach((subscription) => {
        if (!subscription.startedAt) return;
        if (subscription.startedAt < start || subscription.startedAt > end) return;
        const dateKey = subscription.startedAt.toISOString().slice(0, 10);
        if (!adoptionTrendMap[dateKey]) {
          adoptionTrendMap[dateKey] = {};
        }
        const pkgName = subscription.package?.name ?? 'Unassigned';
        adoptionTrendMap[dateKey][pkgName] = (adoptionTrendMap[dateKey][pkgName] || 0) + 1;
      });

      const adoptionTrend = Object.entries(adoptionTrendMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, entries]) => ({
          date,
          packages: entries,
        }));

      const packageList = Array.from(packageStats.values()).map((entry) => {
        const arpuBase = entry.activeSchools || entry.transactions || 1;
        return {
          ...entry,
          revenue: Number(entry.revenue.toFixed(2)),
          arpu: Number((entry.revenue / arpuBase).toFixed(2)),
        };
      }).sort((a, b) => b.revenue - a.revenue);

      const totalActiveSchools = activeSubscriptions.length;
      const averageArpu =
        packageList.length > 0
          ? Number(
              (
                packageList.reduce((sum, pkg) => sum + pkg.arpu, 0) / packageList.length
              ).toFixed(2),
            )
          : 0;

      const upgradeRequests = subscriptionChanges.filter((item) => item.status === 'ACTIVE').length;
      const downgradeRequests = subscriptionChanges.filter((item) => item.status === 'CANCELLED').length;

      const payload = {
        success: true,
        data: {
          range,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          filters,
          totals: {
            packagesTracked: packageList.length,
            activeSchools: totalActiveSchools,
            averageArpu,
            upgradeRequests,
            downgradeRequests,
          },
          packages: packageList,
          adoptionTrend,
        },
      };

      setCachedResponse(cacheKey, payload, ANALYTICS_CACHE_TTL);
      return res.status(200).json(payload);
    } catch (error) {
      console.error('Package performance analytics error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid package analytics parameters', error.errors);
      }
      return createError(res, 500, 'Failed to load package analytics');
    }
  }

  async getAttendanceAnalytics(req, res) {
    try {
      const filters = analyticsFilterSchema.parse(req.query ?? {});
      const { start, end, range } = resolveAnalyticsDateRange(filters);
      const cacheKey = `attendance:${range}:${JSON.stringify(filters)}`;
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return res.status(200).json(cached);
      }

      const schoolFilter = buildSchoolRelationFilter(filters);
      const attendanceWhere = {
        date: { gte: start, lte: end },
        deletedAt: null,
        studentId: { not: null },
        ...(filters.schoolId ? { schoolId: BigInt(filters.schoolId) } : {}),
        ...(schoolFilter ? { school: schoolFilter } : {}),
      };

      const statusCounts = await prisma.attendance.groupBy({
        by: ['status'],
        where: attendanceWhere,
        _count: { _all: true },
      });

      const totalRecords = statusCounts.reduce((sum, record) => sum + record._count._all, 0);
      const statusMap = statusCounts.reduce((acc, record) => {
        acc[record.status] = record._count._all;
        return acc;
      }, {});

      const classStatsRaw = await prisma.attendance.groupBy({
        by: ['classId', 'status'],
        where: {
          ...attendanceWhere,
          classId: { not: null },
        },
        _count: { _all: true },
      });

      const subjectStatsRaw = await prisma.attendance.groupBy({
        by: ['subjectId', 'status'],
        where: {
          ...attendanceWhere,
          subjectId: { not: null },
        },
        _count: { _all: true },
      });

      const dailyStatsRaw = await prisma.attendance.groupBy({
        by: ['date', 'status'],
        where: attendanceWhere,
        _count: { _all: true },
      });

      const classIds = Array.from(
        new Set(classStatsRaw.map((item) => item.classId).filter((id) => id !== null)),
      );
      const subjectIds = Array.from(
        new Set(subjectStatsRaw.map((item) => item.subjectId).filter((id) => id !== null)),
      );

      const classes = classIds.length
        ? await prisma.class.findMany({
            where: { id: { in: classIds } },
            select: { id: true, name: true, level: true, section: true },
          })
        : [];
      const subjects = subjectIds.length
        ? await prisma.subject.findMany({
            where: { id: { in: subjectIds } },
            select: { id: true, name: true },
          })
        : [];

      const classNameMap = new Map(classes.map((cls) => [cls.id.toString(), cls.name ?? `Class ${cls.id}`]));
      const subjectNameMap = new Map(subjects.map((sub) => [sub.id.toString(), sub.name ?? `Subject ${sub.id}`]));

      const classTotals = new Map();
      classStatsRaw.forEach((record) => {
        if (!record.classId) return;
        const key = record.classId.toString();
        if (!classTotals.has(key)) {
          classTotals.set(key, { present: 0, total: 0 });
        }
        const entry = classTotals.get(key);
        entry.total += record._count._all;
        if (record.status === 'PRESENT') {
          entry.present += record._count._all;
        }
      });

      const subjectTotals = new Map();
      subjectStatsRaw.forEach((record) => {
        if (!record.subjectId) return;
        const key = record.subjectId.toString();
        if (!subjectTotals.has(key)) {
          subjectTotals.set(key, { absences: 0 });
        }
        if (record.status === 'ABSENT' || record.status === 'EXCUSED') {
          subjectTotals.get(key).absences += record._count._all;
        }
      });

      const classLeaders = Array.from(classTotals.entries())
        .map(([classId, stats]) => ({
          classId,
          className: classNameMap.get(classId) ?? `Class ${classId}`,
          attendancePercent: stats.total ? stats.present / stats.total : 0,
        }))
        .sort((a, b) => b.attendancePercent - a.attendancePercent)
        .slice(0, 5);

      const subjectAlerts = Array.from(subjectTotals.entries())
        .map(([subjectId, stats]) => ({
          subjectId,
          subjectName: subjectNameMap.get(subjectId) ?? `Subject ${subjectId}`,
          absenceCount: stats.absences,
        }))
        .sort((a, b) => b.absenceCount - a.absenceCount)
        .slice(0, 5);

      const dailyTrendMap = {};
      dailyStatsRaw.forEach((record) => {
        const dateKey = record.date.toISOString().slice(0, 10);
        if (!dailyTrendMap[dateKey]) {
          dailyTrendMap[dateKey] = { present: 0, absent: 0, late: 0 };
        }
        if (record.status === 'PRESENT') {
          dailyTrendMap[dateKey].present += record._count._all;
        } else if (record.status === 'ABSENT' || record.status === 'EXCUSED') {
          dailyTrendMap[dateKey].absent += record._count._all;
        } else if (record.status === 'LATE') {
          dailyTrendMap[dateKey].late += record._count._all;
        }
      });

      const dailyTrend = Object.entries(dailyTrendMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, values]) => ({
          date,
          ...values,
        }));

      const totals = {
        present: statusMap.PRESENT || 0,
        absent: statusMap.ABSENT || 0,
        late: statusMap.LATE || 0,
        excused: statusMap.EXCUSED || 0,
        halfDay: statusMap.HALF_DAY || 0,
      };

      const avgAttendance = totalRecords ? totals.present / totalRecords : 0;
      const lateRate = totalRecords ? totals.late / totalRecords : 0;

      const payload = {
        success: true,
        data: {
          range,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          totals: {
            ...totals,
            averageAttendance: Number(avgAttendance.toFixed(4)),
            lateRate: Number(lateRate.toFixed(4)),
          },
          dailyTrend,
          classLeaders,
          subjectAlerts,
        },
      };

      setCachedResponse(cacheKey, payload, ANALYTICS_CACHE_TTL);
      return res.status(200).json(payload);
    } catch (error) {
      console.error('Attendance analytics error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid attendance analytics parameters', error.errors);
      }
      return createError(res, 500, 'Failed to load attendance analytics');
    }
  }

  async getReportsSummary(req, res) {
    try {
      const cacheKey = 'reports-summary';
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return res.status(200).json(cached);
      }

      const [studentCount, teacherCount, staffCount, parentCount, schoolCount, activeSchools, revenueSummary] = await Promise.all([
        prisma.student.count({ where: { deletedAt: null } }),
        prisma.teacher.count({ where: { deletedAt: null } }),
        prisma.staff.count({ where: { deletedAt: null } }),
        prisma.parent.count({ where: { deletedAt: null } }),
        prisma.school.count(),
        prisma.school.count({ where: { status: 'ACTIVE' } }),
        prisma.payment.aggregate({ _sum: { total: true }, _count: { id: true } }),
      ]);

      const payload = {
        success: true,
        data: {
          totals: {
            students: studentCount,
            teachers: teacherCount,
            staff: staffCount,
            parents: parentCount,
            schools: schoolCount,
            activeSchools,
          },
          revenue: {
            total: Number(revenueSummary._sum.total || 0),
            transactions: revenueSummary._count.id || 0,
          },
        },
      };

      setCachedResponse(cacheKey, payload, 2 * ANALYTICS_CACHE_TTL);

      return res.status(200).json(payload);
    } catch (error) {
      console.error('Reports summary error:', error);
      return createError(res, 500, 'Failed to load reports summary');
    }
  }

  async getChurnAnalytics(req, res) {
    try {
      const { range } = churnAnalyticsSchema.parse(req.query);
      const rangeKey = range || '30d';
      const cacheKey = `churn:${rangeKey}`;

      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return res.status(200).json(cached);
      }

      const rangeMap = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365,
      };
      const days = rangeMap[rangeKey];
      const now = new Date();
      const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      const [cancellations, activations, totalActive] = await Promise.all([
        prisma.schoolSubscription.findMany({
          where: { status: 'CANCELLED', updatedAt: { gte: start } },
          select: { id: true, schoolId: true, updatedAt: true },
        }),
        prisma.schoolSubscription.findMany({
          where: {
            status: 'ACTIVE',
            startedAt: { gte: start },
          },
          select: { id: true, schoolId: true, startedAt: true },
        }),
        prisma.schoolSubscription.count({
          where: { status: 'ACTIVE' },
        }),
      ]);

      const churnRate = totalActive === 0 ? 0 : cancellations.length / totalActive;

      const buildTrend = (records, dateKey) =>
        records.reduce((acc, record) => {
          const date = new Date(record[dateKey]).toISOString().slice(0, 10);
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

      const payload = {
        success: true,
        data: {
          range: rangeKey,
          totals: {
            active: totalActive,
            cancellations: cancellations.length,
            activations: activations.length,
            churnRate: Number(churnRate.toFixed(4)),
          },
          trends: {
            cancellations: buildTrend(cancellations, 'updatedAt'),
            activations: buildTrend(activations, 'startedAt'),
          },
        },
      };

      setCachedResponse(cacheKey, payload, ANALYTICS_CACHE_TTL);

      return res.status(200).json(payload);
    } catch (error) {
      console.error('Churn analytics error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid churn analytics parameters', error.errors);
      }
      return createError(res, 500, 'Failed to load churn analytics');
    }
  }

  async getSchoolComparison(req, res) {
    try {
      const { metric, limit, status } = schoolComparisonSchema.parse(req.query);

      const cacheKey = `comparison:${metric}:${status ?? 'all'}:${limit ?? 'all'}`;
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return res.status(200).json(cached);
      }

      const schools = await prisma.school.findMany({
        where: status ? { status } : {},
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          subscription: {
            select: {
              status: true,
              expiresAt: true,
              package: { select: { id: true, name: true } },
            },
          },
          _count: {
            select: {
              students: true,
              teachers: true,
              staff: true,
            },
          },
        },
      });

      const revenueBySchool = await prisma.payment.groupBy({
        by: ['schoolId'],
        where: { status: 'PAID' },
        _sum: { total: true },
      });

      const revenueMap = new Map(
        revenueBySchool.map((entry) => [entry.schoolId?.toString() || 'null', Number(entry._sum.total || 0)]),
      );

      const compiled = schools.map((school) => {
        const revenue = revenueMap.get(school.id.toString()) || 0;
        return {
          ...school,
          metrics: {
            students: school._count.students,
            teachers: school._count.teachers,
            staff: school._count.staff,
            revenue,
          },
        };
      });

      const sorted = compiled.sort((a, b) => {
        const left = a.metrics[metric];
        const right = b.metrics[metric];
        return right - left;
      });

      const limited = typeof limit === 'number' ? sorted.slice(0, limit) : sorted;

      const payload = {
        success: true,
        data: convertBigIntToString({
          metric,
          total: compiled.length,
          results: limited,
        }),
      };

      setCachedResponse(cacheKey, payload, ANALYTICS_CACHE_TTL);

      return res.status(200).json(payload);
    } catch (error) {
      console.error('School comparison analytics error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid school comparison parameters', error.errors);
      }
      return createError(res, 500, 'Failed to load school comparison analytics');
    }
  }

  async createReportExport(req, res) {
    try {
      const payload = z.object({
        reportKey: z.string().min(1),
        format: z.enum(['CSV', 'PDF']).default('CSV'),
        filters: z.record(z.any()).default({}),
        scheduleId: z.union([z.string(), z.number()]).optional(),
      }).parse(req.body);

      const exportJob = await prisma.reportExport.create({
        data: {
          reportKey: payload.reportKey,
          filters: payload.filters,
          format: payload.format,
          status: 'QUEUED',
          createdBy: req.user?.id ? BigInt(req.user.id) : null,
          schoolId: req.user?.schoolId ? BigInt(req.user.schoolId) : null,
          scheduleId: payload.scheduleId ? BigInt(payload.scheduleId) : null,
          requestedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return createResponse(res, 201, exportJob);
    } catch (error) {
      console.error('Create report export error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid export payload', error.errors);
      }
      return createError(res, 500, 'Failed to queue report export');
    }
  }

  async listReportExports(req, res) {
    try {
      const params = z.object({
        status: z.enum(['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED']).optional(),
        reportKey: z.string().optional(),
        limit: z.coerce.number().int().positive().max(100).default(20),
        page: z.coerce.number().int().positive().default(1),
      }).parse(req.query);

      const where = {
        ...(params.status ? { status: params.status } : {}),
        ...(params.reportKey ? { reportKey: params.reportKey } : {}),
        ...(req.user?.schoolId ? { schoolId: BigInt(req.user.schoolId) } : {}),
      };

      const [jobs, total] = await Promise.all([
        prisma.reportExport.findMany({
          where,
          orderBy: { requestedAt: 'desc' },
          skip: (params.page - 1) * params.limit,
          take: params.limit,
        }),
        prisma.reportExport.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        data: convertBigIntToString(jobs),
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          pages: Math.ceil(total / params.limit) || 1,
        },
      });
    } catch (error) {
      console.error('List report exports error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid export query parameters', error.errors);
      }
      return createError(res, 500, 'Failed to fetch report exports');
    }
  }

  async createReportSchedule(req, res) {
    try {
      const payload = z.object({
        reportKey: z.string().min(1),
        filters: z.record(z.any()).default({}),
        format: z.enum(['CSV', 'PDF']).default('CSV'),
        frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).default('DAILY'),
        cronExpression: z.string().optional(),
        recipients: z.array(z.string().email()).min(1),
      }).parse(req.body);

      const schedule = await prisma.reportSchedule.create({
        data: {
          reportKey: payload.reportKey,
          filters: payload.filters,
          format: payload.format,
          frequency: payload.frequency,
          cronExpression: payload.cronExpression ?? null,
          recipients: payload.recipients,
          createdBy: req.user?.id ? BigInt(req.user.id) : null,
          schoolId: req.user?.schoolId ? BigInt(req.user.schoolId) : null,
          status: 'ACTIVE',
          nextRunAt: new Date(),
        },
      });

      return createResponse(res, 201, schedule);
    } catch (error) {
      console.error('Create report schedule error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid schedule payload', error.errors);
      }
      return createError(res, 500, 'Failed to create report schedule');
    }
  }

  async listReportSchedules(req, res) {
    try {
      const params = z.object({
        status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED']).optional(),
        reportKey: z.string().optional(),
      }).parse(req.query);

      const where = {
        ...(params.status ? { status: params.status } : {}),
        ...(params.reportKey ? { reportKey: params.reportKey } : {}),
        ...(req.user?.schoolId ? { schoolId: BigInt(req.user.schoolId) } : {}),
      };

      const schedules = await prisma.reportSchedule.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          exports: {
            orderBy: { requestedAt: 'desc' },
            take: 3,
          },
        },
      });

      return createResponse(res, 200, schedules);
    } catch (error) {
      console.error('List report schedules error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid schedule query parameters', error.errors);
      }
      return createError(res, 500, 'Failed to fetch report schedules');
    }
  }

  async updateReportScheduleStatus(req, res) {
    try {
      const { scheduleId } = req.params;
      const { status } = z.object({
        status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED']),
      }).parse(req.body);

      const schedule = await prisma.reportSchedule.update({
        where: { id: BigInt(scheduleId) },
        data: { status },
      });

      return createResponse(res, 200, schedule);
    } catch (error) {
      console.error('Update schedule status error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid status payload', error.errors);
      }
      if (error.code === 'P2025') {
        return createError(res, 404, 'Schedule not found');
      }
      return createError(res, 500, 'Failed to update schedule');
    }
  }

  async getCustomReportMetadata(req, res) {
    try {
      return createResponse(res, 200, {
        metrics: CUSTOM_REPORT_METRICS,
        dimensions: CUSTOM_REPORT_DIMENSIONS,
      });
    } catch (error) {
      console.error('Get custom report metadata error:', error);
      return createError(res, 500, 'Failed to load custom report metadata');
    }
  }

  async listCustomReports(req, res) {
    try {
      const reports = await prisma.customReport.findMany({
        where: {
          OR: [
            { createdBy: req.user?.id ? BigInt(req.user.id) : null },
            { isShared: true },
            req.user?.schoolId ? { schoolId: BigInt(req.user.schoolId) } : undefined,
          ].filter(Boolean),
        },
        orderBy: { updatedAt: 'desc' },
      });

      return createResponse(res, 200, reports.map(convertBigIntToString));
    } catch (error) {
      console.error('List custom reports error:', error);
      return createError(res, 500, 'Failed to fetch custom reports');
    }
  }

  async createCustomReport(req, res) {
    try {
      const payload = z.object({
        name: z.string().min(3).max(120),
        description: z.string().max(255).optional(),
        reportKey: z.string().min(1),
        metrics: z.array(z.string()).min(1),
        dimensions: z.array(z.string()).max(3),
        filters: z.record(z.any()).default({}),
        visualization: z.record(z.any()).default({ type: 'table' }),
        isShared: z.boolean().default(false),
      }).parse(req.body);

      const report = await prisma.customReport.create({
        data: {
          name: payload.name,
          description: payload.description ?? null,
          reportKey: payload.reportKey,
          metrics: payload.metrics,
          dimensions: payload.dimensions,
          filters: payload.filters,
          visualization: payload.visualization,
          isShared: payload.isShared,
          createdBy: req.user?.id ? BigInt(req.user.id) : null,
          schoolId: req.user?.schoolId ? BigInt(req.user.schoolId) : null,
        },
      });

      return createResponse(res, 201, report);
    } catch (error) {
      console.error('Create custom report error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid custom report payload', error.errors);
      }
      return createError(res, 500, 'Failed to create custom report');
    }
  }

  async updateCustomReport(req, res) {
    try {
      const { reportId } = req.params;
      const payload = z.object({
        name: z.string().min(3).max(120).optional(),
        description: z.string().max(255).optional(),
        metrics: z.array(z.string()).min(1).optional(),
        dimensions: z.array(z.string()).max(3).optional(),
        filters: z.record(z.any()).optional(),
        visualization: z.record(z.any()).optional(),
        isShared: z.boolean().optional(),
      }).parse(req.body);

      const report = await prisma.customReport.update({
        where: { id: BigInt(reportId) },
        data: payload,
      });

      return createResponse(res, 200, report);
    } catch (error) {
      console.error('Update custom report error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid custom report payload', error.errors);
      }
      if (error.code === 'P2025') {
        return createError(res, 404, 'Custom report not found');
      }
      return createError(res, 500, 'Failed to update custom report');
    }
  }

  async deleteCustomReport(req, res) {
    try {
      const { reportId } = req.params;
      await prisma.customReport.delete({
        where: { id: BigInt(reportId) },
      });
      return createResponse(res, 200, { id: reportId });
    } catch (error) {
      console.error('Delete custom report error:', error);
      if (error.code === 'P2025') {
        return createError(res, 404, 'Custom report not found');
      }
      return createError(res, 500, 'Failed to delete custom report');
    }
  }

  async runCustomReport(req, res) {
    try {
      const payloadSchema = z.object({
        reportId: z.union([z.string(), z.number()]).optional(),
        configuration: z
          .object({
            metrics: z.array(z.string()).min(1),
            dimensions: z.array(z.string()).max(3),
            filters: analyticsFilterSchema.optional(),
          })
          .optional(),
      }).refine((value) => value.reportId || value.configuration, {
        message: 'Provide either reportId or configuration.',
        path: ['reportId'],
      });

      const payload = payloadSchema.parse(req.body);

      let configuration = payload.configuration;

      if (payload.reportId) {
        const existingReport = await prisma.customReport.findUnique({
          where: { id: BigInt(payload.reportId) },
        });
        if (!existingReport) {
          return createError(res, 404, 'Custom report not found');
        }
        configuration = {
          metrics: existingReport.metrics,
          dimensions: existingReport.dimensions,
          filters: existingReport.filters,
        };
      }

      const dataset = await buildCustomReportDataset({
        metrics: configuration.metrics,
        dimensions: configuration.dimensions,
        filters: configuration.filters,
      });

      return createResponse(res, 200, dataset);
    } catch (error) {
      console.error('Run custom report error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid custom report request', error.errors);
      }
      return createError(res, 500, 'Failed to execute custom report');
    }
  }

  async getBenchmarkingAnalytics(req, res) {
    try {
      const filters = analyticsFilterSchema.parse(req.query ?? {});
      const dataset = await buildCustomReportDataset({
        metrics: ['totalRevenue', 'transactionCount'],
        dimensions: ['package', 'country'],
        filters,
      });

      const packageBenchmark = {};
      const countryBenchmark = {};

      dataset.rows.forEach((row) => {
        const pkg = row.dimensions.package || 'Unassigned';
        const country = row.dimensions.country || 'Unknown';
        packageBenchmark[pkg] = (packageBenchmark[pkg] || 0) + row.metrics.totalRevenue;
        countryBenchmark[country] = (countryBenchmark[country] || 0) + row.metrics.totalRevenue;
      });

      const topPackages = Object.entries(packageBenchmark)
        .map(([name, value]) => ({ name, revenue: Number(value.toFixed(2)) }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const topCountries = Object.entries(countryBenchmark)
        .map(([name, value]) => ({ name, revenue: Number(value.toFixed(2)) }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      return createResponse(res, 200, {
        range: dataset.range,
        startDate: dataset.startDate,
        endDate: dataset.endDate,
        summary: dataset.summary,
        topPackages,
        topCountries,
      });
    } catch (error) {
      console.error('Benchmarking analytics error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid benchmarking filters', error.errors);
      }
      return createError(res, 500, 'Failed to load benchmarking analytics');
    }
  }

  async getLogSummaryAnalytics(req, res) {
    try {
      const filters = logAnalyticsFilterSchema.parse(req.query ?? {});
      const { start, end, range } = resolveAnalyticsDateRange(filters);
      const cacheKey = `logs:summary:${range}:${JSON.stringify(filters)}`;
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return res.status(200).json(cached);
      }

      const summary = await logAnalyticsService.getSummary({ start, end, filters });
      const payload = {
        range,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        ...summary,
      };

      const safePayload = convertBigIntToString(payload);
      setCachedResponse(cacheKey, safePayload);
      return res.status(200).json(safePayload);
    } catch (error) {
      console.error('Log summary analytics error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid log analytics filters', error.errors);
      }
      return createError(res, 500, 'Failed to load log analytics');
    }
  }

  async getLogTimeline(req, res) {
    try {
      const parsed = logTimelineFilterSchema.parse(req.query ?? {});
      const { page, limit, ...filterPayload } = parsed;
      const { start, end, range } = resolveAnalyticsDateRange(filterPayload);

      const timeline = await logAnalyticsService.getTimeline({
        start,
        end,
        filters: filterPayload,
        page,
        limit,
      });

      const payload = {
        range,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        ...timeline,
      };

      return res.status(200).json(convertBigIntToString(payload));
    } catch (error) {
      console.error('Log timeline analytics error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid log timeline filters', error.errors);
      }
      return createError(res, 500, 'Failed to load log timeline');
    }
  }

  async getSystemSettings(req, res) {
    try {
      const settings = await prisma.systemSetting.findMany();
      const mapped = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});
      return res.status(200).json({ success: true, data: mapped });
    } catch (error) {
      console.error('Get system settings error:', error);
      return createError(res, 500, 'Failed to load system settings');
    }
  }

  async updateSystemSettings(req, res) {
    try {
      const body = z.object({ settings: z.record(z.any()) }).parse(req.body);
      const entries = Object.entries(body.settings || {});

      await Promise.all(entries.map(([key, value]) =>
        prisma.systemSetting.upsert({
          where: { key },
          update: { value: JSON.stringify(value) },
          create: { key, value: JSON.stringify(value) },
        })
      ));

      return res.status(200).json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
      console.error('Update system settings error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid settings payload', error.errors);
      }
      return createError(res, 500, 'Failed to update system settings');
    }
  }

  async getAuditLogs(req, res) {
    try {
      const querySchema = z.object({
        tenantId: z.string().optional(),
        entityType: z.string().optional(),
        action: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        limit: z.coerce.number().min(1).max(500).optional(),
      });
      const params = querySchema.parse(req.query);
      const where = {
        ...(params.entityType && { entityType: params.entityType }),
        ...(params.action && { action: params.action }),
        ...((params.from || params.to) && {
          createdAt: {
            ...(params.from ? { gte: new Date(params.from) } : {}),
            ...(params.to ? { lte: new Date(params.to) } : {}),
          },
        }),
        ...(params.tenantId && {
          school: {
            tenantId: params.tenantId,
          },
        }),
      };

      const logs = await prisma.auditLog.findMany({
        where,
        include: {
          school: { select: { id: true, name: true, tenantId: true } },
          user: { select: { id: true, username: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: params.limit ?? 100,
      });

      return createResponse(res, 200, logs);
    } catch (error) {
      console.error('Get audit logs error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid audit log filters', error.errors);
      }
      return createError(res, 500, 'Failed to load audit logs');
    }
  }

  async exportAuditLogs(req, res) {
    try {
      const params = z.object({
        tenantId: z.string().optional(),
        entityType: z.string().optional(),
        action: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
      }).parse(req.query);

      const where = {
        ...(params.entityType && { entityType: params.entityType }),
        ...(params.action && { action: params.action }),
        ...((params.from || params.to) && {
          createdAt: {
            ...(params.from ? { gte: new Date(params.from) } : {}),
            ...(params.to ? { lte: new Date(params.to) } : {}),
          },
        }),
        ...(params.tenantId && {
          school: {
            tenantId: params.tenantId,
          },
        }),
      };

      const logs = await prisma.auditLog.findMany({
        where,
        include: {
          school: { select: { id: true, name: true, tenantId: true } },
          user: { select: { id: true, username: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      });

      return createResponse(res, 200, logs);
    } catch (error) {
      console.error('Export audit logs error:', error);
      if (error instanceof z.ZodError) {
        return createError(res, 400, 'Invalid audit log filters', error.errors);
      }
      return createError(res, 500, 'Failed to export audit logs');
    }
  }
}

export default new PlatformController();

