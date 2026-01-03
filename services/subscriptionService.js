import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../utils/prismaClient.js';

const loadPackageFeatureCatalog = () => {
  try {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const catalogPath = path.resolve(currentDir, '../shared/packageFeatures.json');
    const fileContents = fs.readFileSync(catalogPath, 'utf-8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Failed to load package feature catalog:', error);
    return { boolean: [], numeric: [] };
  }
};

const packageFeatureCatalog = loadPackageFeatureCatalog();

const toBigInt = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return value;
  const parsed = BigInt(value);
  return parsed;
};

const FEATURE_BOOLEAN_KEYS = packageFeatureCatalog.boolean.map((feature) => feature.key);
const FEATURE_NUMERIC_KEYS = packageFeatureCatalog.numeric.map((feature) => feature.key);
const MODULE_FEATURE_KEYS = new Set(
  packageFeatureCatalog.boolean.filter((feature) => feature.kind === 'module').map((feature) => feature.key),
);

const buildFeatureDefaults = () => {
  const defaults = {};
  FEATURE_BOOLEAN_KEYS.forEach((key) => {
    const definition = packageFeatureCatalog.boolean.find((feature) => feature.key === key);
    defaults[key] = definition?.default ?? false;
  });
  FEATURE_NUMERIC_KEYS.forEach((key) => {
    const definition = packageFeatureCatalog.numeric.find((feature) => feature.key === key);
    defaults[key] = definition?.default ?? null;
  });
  defaults.modules_enabled = [];
  return defaults;
};

const coerceBooleanFeature = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  return fallback;
};

const coerceNumericFeature = (value, fallback = null) => {
  if (value === null || value === undefined || value === '') return fallback;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? fallback : numeric;
};

const normalizeFeaturePayload = (features) => {
  const defaults = buildFeatureDefaults();
  const source =
    features && typeof features === 'object' && !Array.isArray(features) ? { ...features } : {};

  const normalized = {
    ...defaults,
    ...source,
  };

  if (Array.isArray(source.modules_enabled)) {
    source.modules_enabled.forEach((moduleKey) => {
      if (MODULE_FEATURE_KEYS.has(moduleKey)) {
        normalized[moduleKey] = true;
      }
    });
  }

  FEATURE_BOOLEAN_KEYS.forEach((key) => {
    normalized[key] = coerceBooleanFeature(normalized[key], defaults[key]);
  });

  FEATURE_NUMERIC_KEYS.forEach((key) => {
    normalized[key] = coerceNumericFeature(normalized[key], defaults[key]);
  });

  normalized.modules_enabled = FEATURE_BOOLEAN_KEYS.filter(
    (key) => MODULE_FEATURE_KEYS.has(key) && normalized[key],
  );

  return normalized;
};

const parseFeatures = (features) => {
  if (!features) {
    return normalizeFeaturePayload({});
  }
  if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features);
      return normalizeFeaturePayload(parsed);
    } catch (err) {
      console.warn('Failed to parse package features JSON string:', err);
      return normalizeFeaturePayload({});
    }
  }
  return normalizeFeaturePayload(features);
};

const getNumericLimit = (features, key) => {
  const value = features?.[key];
  return value === null || value === undefined ? null : Number(value);
};

const buildLimitSnapshot = (featureConfig = {}) => ({
  maxSchools: getNumericLimit(featureConfig, 'max_schools'),
  maxBranchesPerSchool: getNumericLimit(featureConfig, 'max_branches_per_school'),
  maxCoursesPerSchool: getNumericLimit(featureConfig, 'max_courses_per_school'),
  maxBranchManagersPerSchool: getNumericLimit(featureConfig, 'max_branch_managers_per_school'),
  maxCourseManagersPerSchool: getNumericLimit(featureConfig, 'max_course_managers_per_school'),
  maxStudents: getNumericLimit(featureConfig, 'max_students'),
  maxTeachers: getNumericLimit(featureConfig, 'max_teachers'),
  maxStaff: getNumericLimit(featureConfig, 'max_staff'),
  maxStorageGb: getNumericLimit(featureConfig, 'max_storage_gb'),
  reportsRetentionDays: getNumericLimit(featureConfig, 'reports_retention_days'),
});

const BYTES_IN_GB = 1024 ** 3;

export const calculateStorageUsageBytes = async (schoolId) => {
  const id = toBigInt(schoolId);
  if (!id) return 0;

  const resolveModel = (modelName) => {
    if (!modelName || !Reflect.has(prisma, modelName)) {
      return null;
    }
    const model = prisma[modelName];
    return model && typeof model.aggregate === 'function' ? model : null;
  };

  const aggregations = [
    {
      model: 'document',
      args: {
        where: { schoolId: id, deletedAt: null },
        _sum: { size: true },
      },
      picker: (result) => result?._sum?.size,
    },
    {
      model: 'assignmentAttachment',
      args: {
        where: { schoolId: id, deletedAt: null },
        _sum: { size: true },
      },
      picker: (result) => result?._sum?.size,
    },
    {
      model: 'submissionAttachment',
      args: {
        where: { schoolId: id, deletedAt: null },
        _sum: { size: true },
      },
      picker: (result) => result?._sum?.size,
    },
    {
      model: 'messageAttachment',
      args: {
        where: { schoolId: id },
        _sum: { size: true },
      },
      picker: (result) => result?._sum?.size,
      optional: true, // Optional in case column doesn't exist in database
    },
    {
      model: 'documentVersion',
      args: {
        where: { document: { schoolId: id } },
        _sum: { fileSize: true },
      },
      picker: (result) => result?._sum?.fileSize,
    },
    {
      model: 'staffDocument',
      args: {
        where: { staff: { schoolId: id } },
        _sum: { fileSize: true },
      },
      picker: (result) => result?._sum?.fileSize,
    },
    {
      model: 'file',
      args: {
        where: { schoolId: id },
        _sum: { fileSize: true },
      },
      picker: (result) => result?._sum?.fileSize,
    },
  ];

  let totalBytes = 0;

  for (const spec of aggregations) {
    const model = resolveModel(spec.model);
    if (!model) {
      continue;
    }

    try {
      const aggregateResult = await model.aggregate(spec.args);
      const rawValue = typeof spec.picker === 'function' ? spec.picker(aggregateResult) : null;
      totalBytes += Number(rawValue || 0);
    } catch (error) {
      // Silently skip optional aggregations, only log non-optional ones
      if (!spec.optional) {
        console.warn(`Failed to aggregate storage usage for ${spec.model}:`, error?.message || error);
      }
      // For optional aggregations, just skip silently
    }
  }

  return totalBytes;
};

export const getActiveSubscriptionForSchool = async (schoolId) => {
  const id = toBigInt(schoolId);
  if (!id) return null;

  return prisma.schoolSubscription.findFirst({
    where: {
      schoolId: id,
      status: 'ACTIVE',
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      package: true,
    },
  });
};

export const getTenantContextForSchool = async (schoolId) => {
  const id = toBigInt(schoolId);
  if (!id) {
    return {
      tenantId: null,
      subscription: null,
      package: null,
      features: {},
      limits: {},
      ownerId: null,
    };
  }

  const school = await prisma.school.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      tenantId: true,
      ownerId: true,
      subscription: {
        include: {
          package: true,
        },
      },
    },
  });

  const subscription = school?.subscription || null;
  const pkg = subscription?.package || null;
  const features = parseFeatures(pkg?.features);
  const limits = buildLimitSnapshot(features);

  return {
    tenantId: school?.tenantId || null,
    ownerId: school?.ownerId || null,
    subscription,
    package: pkg,
    features,
    limits,
  };
};

export const calculateUsageSnapshot = async (schoolId) => {
  const id = toBigInt(schoolId);
  if (!id) return null;

  const schoolRecord = await prisma.school.findUnique({
    where: { id },
    select: {
      ownerId: true,
      subscription: {
        select: {
          package: {
            select: {
              features: true,
            },
          },
        },
      },
    },
  });

  const ownerId = schoolRecord?.ownerId || null;
  let featureSource = schoolRecord?.subscription?.package?.features;
  if (!featureSource) {
    const activeSubscription = await getActiveSubscriptionForSchool(id);
    featureSource = activeSubscription?.package?.features ?? {};
  }
  const featureConfig = parseFeatures(featureSource);
  const limitSnapshot = buildLimitSnapshot(featureConfig);

  const [schoolsCount, studentsCount, teachersCount, staffCount, storageBytes] = await Promise.all([
    ownerId
      ? prisma.school.count({
          where: {
            ownerId,
            deletedAt: null,
          },
        })
      : Promise.resolve(1),
    prisma.student.count({
      where: {
        schoolId: id,
        deletedAt: null,
      },
    }),
    prisma.teacher.count({
      where: {
        schoolId: id,
        deletedAt: null,
      },
    }),
    prisma.staff.count({
      where: {
        schoolId: id,
        deletedAt: null,
      },
    }),
    calculateStorageUsageBytes(id),
  ]);

  const storageUsedGb = Number((Number(storageBytes || 0) / BYTES_IN_GB).toFixed(3));

  return {
    schools: Number(schoolsCount),
    students: Number(studentsCount),
    teachers: Number(teachersCount),
    staff: Number(staffCount),
    storageGb: storageUsedGb,
    limits: {
      schools: limitSnapshot.maxSchools,
      branches: limitSnapshot.maxBranchesPerSchool,
      students: limitSnapshot.maxStudents,
      teachers: limitSnapshot.maxTeachers,
      staff: limitSnapshot.maxStaff,
      storageGb: limitSnapshot.maxStorageGb,
    },
  };
};

export const updateSubscriptionUsage = async (schoolId, usageOverride = null) => {
  const id = toBigInt(schoolId);
  if (!id) return null;

  const subscription = await getActiveSubscriptionForSchool(id);
  if (!subscription) return null;

  const usage = usageOverride || (await calculateUsageSnapshot(id));

  return prisma.schoolSubscription.update({
    where: { id: subscription.id },
    data: {
      currentUsage: usage,
      updatedAt: new Date(),
    },
  });
};

export const countStudentsForSchool = async (schoolId) => {
  const id = toBigInt(schoolId);
  if (!id) return 0;
  return prisma.student.count({
    where: { schoolId: id, deletedAt: null },
  });
};

export const countTeachersForSchool = async (schoolId) => {
  const id = toBigInt(schoolId);
  if (!id) return 0;
  return prisma.teacher.count({
    where: { schoolId: id, deletedAt: null },
  });
};

export const countStaffForSchool = async (schoolId) => {
  const id = toBigInt(schoolId);
  if (!id) return 0;
  return prisma.staff.count({
    where: { schoolId: id, deletedAt: null },
  });
};

export const getPackageFeatureCatalog = () => packageFeatureCatalog;

export const normalizePackageFeatures = (features) => parseFeatures(features);

export default {
  getActiveSubscriptionForSchool,
  getTenantContextForSchool,
  calculateUsageSnapshot,
  updateSubscriptionUsage,
  countStudentsForSchool,
  countTeachersForSchool,
  countStaffForSchool,
  getPackageFeatureCatalog,
  normalizePackageFeatures,
};

