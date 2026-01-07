import prisma from '../utils/prismaClient.js';
import userService from './userService.js';
import { getTenantContextForSchool } from './subscriptionService.js';

const toBigInt = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'bigint') {
    return value;
  }
  if (typeof value === 'number') {
    return BigInt(value);
  }
  const trimmed = `${value}`.trim();
  if (!trimmed) {
    return null;
  }
  return BigInt(trimmed);
};

const assertSchool = async (schoolId) => {
  const id = toBigInt(schoolId);
  if (!id) {
    throw new Error('School id is required');
  }

  const school = await prisma.school.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      ownerId: true,
      status: true,
      timezone: true,
      locale: true,
    },
  });

  if (!school || school.status === 'DEACTIVATED') {
    throw new Error('School not found or inactive');
  }

  return school;
};

const resolveLimitContext = async (schoolId) => {
  const tenantContext = await getTenantContextForSchool(schoolId);
  return {
    features: tenantContext.features || {},
    limits: tenantContext.limits || {},
  };
};

const createLimitExceededError = ({ limitKey, maxAllowed, currentValue, errorMessage }) => {
  const normalizedLimit =
    maxAllowed === null || maxAllowed === undefined ? null : Number(maxAllowed);
  const normalizedUsed = Number(currentValue) || 0;
  const err = new Error(errorMessage || 'Usage limit reached for your subscription.');
  err.code = 'LIMIT_EXCEEDED';
  err.meta = {
    limitKey,
    limit: normalizedLimit,
    used: normalizedUsed,
    remaining:
      normalizedLimit === null
        ? null
        : Math.max(0, Number(normalizedLimit) - Number(normalizedUsed)),
  };
  return err;
};

const enforceLimit = async ({ schoolId, limitKey, counter, errorMessage }) => {
  const { limits } = await resolveLimitContext(schoolId);
  const maxAllowed = limits?.[limitKey];

  if (maxAllowed === null || maxAllowed === undefined) {
    return;
  }

  if (Number(maxAllowed) <= 0) {
    throw createLimitExceededError({
      limitKey,
      maxAllowed,
      currentValue: Number(maxAllowed),
      errorMessage: errorMessage || 'Feature not enabled for this subscription.',
    });
  }

  const currentValue = await counter();
  if (Number(currentValue) >= Number(maxAllowed)) {
    throw createLimitExceededError({
      limitKey,
      maxAllowed,
      currentValue,
      errorMessage,
    });
  }
};

const sanitizeAssignmentPayload = (assignment) => {
  if (!assignment) {
    return assignment;
  }

  return {
    ...assignment,
    id: assignment.id?.toString(),
    schoolId: assignment.schoolId?.toString(),
    branchId: assignment.branchId?.toString(),
    courseId: assignment.courseId?.toString(),
    userId: assignment.userId?.toString(),
    assignedBy: assignment.assignedBy?.toString() || null,
    manager: assignment.manager
      ? {
          ...assignment.manager,
          id: assignment.manager.id?.toString(),
          schoolId: assignment.manager.schoolId?.toString(),
        }
      : null,
  };
};

const branchInclude = {
  managerAssignments: {
    where: { revokedAt: null },
    include: {
      manager: {
        select: {
          id: true,
          uuid: true,
          firstName: true,
          lastName: true,
          username: true,
          phone: true,
          role: true,
          status: true,
        },
      },
    },
  },
};

const courseInclude = {
  managerAssignments: {
    where: { revokedAt: null },
    include: {
      manager: {
        select: {
          id: true,
          uuid: true,
          firstName: true,
          lastName: true,
          username: true,
          phone: true,
          role: true,
          status: true,
        },
        required: false,
      },
    },
    orderBy: { assignedAt: 'desc' },
  },
  classes: {
    select: {
      id: true,
      uuid: true,
      name: true,
      code: true,
      level: true,
      isActive: true,
    },
  },
};

const createManagerUser = async ({ school, payload, role, actorId }) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Manager payload is required to create a new user.');
  }

  const {
    username,
    password,
    firstName,
    lastName,
    email,
    phone,
    timezone,
    locale,
    metadata,
  } = payload;

  if (!username || !password || !firstName || !lastName) {
    throw new Error('Username, password, first name, and last name are required to create a manager.');
  }

  const userCreatePayload = {
    username,
    password,
    firstName,
    lastName,
    email,
    phone,
    role,
    status: 'ACTIVE',
    schoolId: Number(school.id),
    createdByOwnerId: Number(school.ownerId),
    timezone: timezone || school.timezone || 'UTC',
    locale: locale || school.locale || 'en-US',
    metadata: metadata || undefined,
  };

  const result = await userService.createUser(userCreatePayload, actorId ? Number(actorId) : null);

  if (!result?.success || !result?.data) {
    throw new Error(result?.error || 'Failed to create manager user.');
  }

  return result.data;
};

const ensureManagerCandidate = async ({ schoolId, userId, expectedRole }) => {
  const id = toBigInt(userId);
  if (!id) {
    throw new Error('User id is required for assignment.');
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      schoolId: true,
      role: true,
      status: true,
    },
  });

  if (!user || user.deletedAt) {
    throw new Error('Manager user not found.');
  }

  if (user.schoolId?.toString() !== toBigInt(schoolId)?.toString()) {
    throw new Error('Manager must belong to the same school.');
  }

  const allowedRoles = Array.isArray(expectedRole) ? expectedRole : [expectedRole];

  if (!allowedRoles.includes(user.role)) {
    const label =
      allowedRoles.length === 1
        ? `${allowedRoles[0]} role`
        : `one of the following roles: ${allowedRoles.join(', ')}`;
    throw new Error(`User must have ${label}.`);
  }

  if (user.status !== 'ACTIVE') {
    throw new Error('Manager user must be active.');
  }

  return user;
};

const manageBranchAssignments = {
  async list(schoolId) {
    await assertSchool(schoolId);
    const branches = await prisma.branch.findMany({
      where: {
        schoolId: toBigInt(schoolId),
        deletedAt: null,
      },
      include: branchInclude,
      orderBy: [{ isMain: 'desc' }, { createdAt: 'desc' }],
    });
    return branches;
  },

  async create({ schoolId, payload, actorId }) {
    const school = await assertSchool(schoolId);

    await enforceLimit({
      schoolId,
      limitKey: 'maxBranchesPerSchool',
      counter: () =>
        prisma.branch.count({
          where: { schoolId: toBigInt(schoolId), deletedAt: null },
        }),
      errorMessage: 'Branch limit reached for this subscription.',
    });

    const now = new Date();
    const created = await prisma.branch.create({
      data: {
        schoolId: school.id,
        name: payload.name,
        code: payload.code,
        shortName: payload.shortName || null,
        type: payload.type || null,
        description: payload.description || null,
        email: payload.email || null,
        phone: payload.phone || null,
        alternatePhone: payload.alternatePhone || null,
        addressLine1: payload.addressLine1 || null,
        addressLine2: payload.addressLine2 || null,
        city: payload.city || null,
        state: payload.state || null,
        country: payload.country || null,
        postalCode: payload.postalCode || null,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        timezone: payload.timezone || school.timezone || 'UTC',
        isMain: Boolean(payload.isMain),
        status: payload.status || 'ACTIVE',
        openedDate: payload.openedDate ? new Date(payload.openedDate) : null,
        metadata: payload.metadata || null,
        createdBy: toBigInt(actorId),
        updatedBy: toBigInt(actorId),
        createdAt: now,
        updatedAt: now,
      },
      include: branchInclude,
    });

    return created;
  },

  async update({ branchId, payload, actorId }) {
    const branch = await prisma.branch.findUnique({
      where: { id: toBigInt(branchId) },
    });

    if (!branch || branch.deletedAt) {
      throw new Error('Branch not found.');
    }

    const updated = await prisma.branch.update({
      where: { id: branch.id },
      data: {
        ...Object.fromEntries(
          Object.entries({
            name: payload.name,
            code: payload.code,
            shortName: payload.shortName,
            type: payload.type,
            description: payload.description,
            email: payload.email,
            phone: payload.phone,
            alternatePhone: payload.alternatePhone,
            addressLine1: payload.addressLine1,
            addressLine2: payload.addressLine2,
            city: payload.city,
            state: payload.state,
            country: payload.country,
            postalCode: payload.postalCode,
            latitude: payload.latitude,
            longitude: payload.longitude,
            timezone: payload.timezone,
            isMain: payload.isMain,
            status: payload.status,
            openedDate: payload.openedDate ? new Date(payload.openedDate) : undefined,
            metadata: payload.metadata,
          }).filter(([, value]) => value !== undefined),
        ),
        updatedBy: toBigInt(actorId),
      },
      include: branchInclude,
    });

    return updated;
  },

  async archive({ branchId, actorId }) {
    const branch = await prisma.branch.findUnique({
      where: { id: toBigInt(branchId) },
    });

    if (!branch || branch.deletedAt) {
      throw new Error('Branch not found.');
    }

    const archived = await prisma.branch.update({
      where: { id: branch.id },
      data: {
        status: 'ARCHIVED',
        deletedAt: new Date(),
        updatedBy: toBigInt(actorId),
      },
      include: branchInclude,
    });

    return archived;
  },

  async assignManager({ branchId, schoolId, managerUserId, managerPayload, actorId }) {
    const branch = await prisma.branch.findFirst({
      where: {
        id: toBigInt(branchId),
        schoolId: toBigInt(schoolId),
        deletedAt: null,
      },
      include: branchInclude,
    });

    if (!branch) {
      throw new Error('Branch not found.');
    }

    await enforceLimit({
      schoolId,
      limitKey: 'maxBranchManagersPerSchool',
      counter: () =>
        prisma.branchManagerAssignment.count({
          where: { schoolId: branch.schoolId, revokedAt: null },
        }),
      errorMessage: 'Branch manager limit reached for this subscription.',
    });

    let managerUser = null;
    if (managerUserId) {
      managerUser = await ensureManagerCandidate({
        schoolId: branch.schoolId,
        userId: managerUserId,
        expectedRole: ['BRANCH_MANAGER', 'TEACHER'],
      });
    } else {
      const school = await assertSchool(branch.schoolId);
      managerUser = await createManagerUser({
        school,
        payload: managerPayload,
        role: 'BRANCH_MANAGER',
        actorId,
      });
    }

    const existingAssignment = await prisma.branchManagerAssignment.findFirst({
      where: {
        branchId: branch.id,
        userId: managerUser.id,
        revokedAt: null,
      },
    });

    if (existingAssignment) {
      throw new Error('Manager already assigned to this branch.');
    }

    const assignment = await prisma.branchManagerAssignment.create({
      data: {
        schoolId: branch.schoolId,
        branchId: branch.id,
        userId: managerUser.id,
        assignedBy: toBigInt(actorId),
      },
      include: {
        manager: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            username: true,
            phone: true,
            role: true,
            status: true,
          },
        },
      },
    });

    return sanitizeAssignmentPayload(assignment);
  },

  async revokeManager({ branchId, userId, actorId }) {
    const branch = await prisma.branch.findUnique({
      where: { id: toBigInt(branchId) },
      select: { id: true, schoolId: true },
    });

    if (!branch) {
      throw new Error('Branch not found.');
    }

    const assignment = await prisma.branchManagerAssignment.findFirst({
      where: {
        branchId: branch.id,
        userId: toBigInt(userId),
        revokedAt: null,
      },
    });

    if (!assignment) {
      throw new Error('Active manager assignment not found.');
    }

    const revoked = await prisma.branchManagerAssignment.update({
      where: { id: assignment.id },
      data: {
        revokedAt: new Date(),
        assignedBy: toBigInt(actorId) || assignment.assignedBy,
      },
      include: {
        manager: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            username: true,
            phone: true,
            role: true,
            status: true,
          },
        },
      },
    });

    return sanitizeAssignmentPayload(revoked);
  },
};

const manageCourseAssignments = {
  async list(schoolId) {
    await assertSchool(schoolId);
    const courses = await prisma.course.findMany({
      where: {
        schoolId: toBigInt(schoolId),
        deletedAt: null,
      },
      include: courseInclude,
      orderBy: [{ createdAt: 'desc' }],
    });
    return courses;
  },

  async create({ schoolId, payload, actorId }) {
    const school = await assertSchool(schoolId);

    await enforceLimit({
      schoolId,
      limitKey: 'maxCoursesPerSchool',
      counter: () =>
        prisma.course.count({
          where: { schoolId: toBigInt(schoolId), deletedAt: null },
        }),
      errorMessage: 'Course limit reached for this subscription.',
    });

    const now = new Date();
    const created = await prisma.course.create({
      data: {
        schoolId: school.id,
        name: payload.name,
        code: payload.code,
        description: payload.description || null,
        summary: payload.summary || null,
        focusArea: payload.focusArea || null,
        centerType: payload.centerType || null,
        targetAudience: payload.targetAudience || null,
        isActive: payload.isActive ?? true,
        isAccredited: payload.isAccredited ?? false,
        enrollmentOpen: payload.enrollmentOpen ?? true,
        branchId: payload.branchId ? toBigInt(payload.branchId) : null,
        centerManagerId: payload.centerManagerId ? toBigInt(payload.centerManagerId) : null,
        operatingHours: payload.operatingHours || null,
        scheduleType: payload.scheduleType || null,
        budget: payload.budget ?? null,
        resources: payload.resources || null,
        policies: payload.policies || null,
        createdBy: toBigInt(actorId),
        updatedBy: toBigInt(actorId),
        createdAt: now,
        updatedAt: now,
      },
      include: courseInclude,
    });

    return created;
  },

  async update({ courseId, payload, actorId }) {
    const course = await prisma.course.findUnique({
      where: { id: toBigInt(courseId) },
    });

    if (!course || course.deletedAt) {
      throw new Error('Course not found.');
    }

    const updated = await prisma.course.update({
      where: { id: course.id },
      data: {
        ...Object.fromEntries(
          Object.entries({
            name: payload.name,
            code: payload.code,
            description: payload.description,
            summary: payload.summary,
            focusArea: payload.focusArea,
            centerType: payload.centerType,
            targetAudience: payload.targetAudience,
            isActive: payload.isActive,
            isAccredited: payload.isAccredited,
            enrollmentOpen: payload.enrollmentOpen,
            branchId: payload.branchId ? toBigInt(payload.branchId) : undefined,
            centerManagerId: payload.centerManagerId ? toBigInt(payload.centerManagerId) : undefined,
            operatingHours: payload.operatingHours,
            scheduleType: payload.scheduleType,
            budget: payload.budget,
            resources: payload.resources,
            policies: payload.policies,
          }).filter(([, value]) => value !== undefined),
        ),
        updatedBy: toBigInt(actorId),
      },
      include: courseInclude,
    });

    return updated;
  },

  async archive({ courseId, actorId }) {
    const course = await prisma.course.findUnique({
      where: { id: toBigInt(courseId) },
    });

    if (!course || course.deletedAt) {
      throw new Error('Course not found.');
    }

    const archived = await prisma.course.update({
      where: { id: course.id },
      data: {
        isActive: false,
        enrollmentOpen: false,
        deletedAt: new Date(),
        updatedBy: toBigInt(actorId),
      },
      include: courseInclude,
    });

    return archived;
  },

  async assignManager({ courseId, schoolId, managerUserId, managerPayload, actorId }) {
    const course = await prisma.course.findFirst({
      where: {
        id: toBigInt(courseId),
        schoolId: toBigInt(schoolId),
        deletedAt: null,
      },
      include: courseInclude,
    });

    if (!course) {
      throw new Error('Course not found.');
    }

    await enforceLimit({
      schoolId,
      limitKey: 'maxCourseManagersPerSchool',
      counter: () =>
        prisma.courseManagerAssignment.count({
          where: { schoolId: course.schoolId, revokedAt: null },
        }),
      errorMessage: 'Course manager limit reached for this subscription.',
    });

    let managerUser = null;
    if (managerUserId) {
      managerUser = await ensureManagerCandidate({
        schoolId: course.schoolId,
        userId: managerUserId,
        expectedRole: ['COURSE_MANAGER', 'TEACHER'],
      });
    } else {
      const school = await assertSchool(course.schoolId);
      managerUser = await createManagerUser({
        school,
        payload: managerPayload,
        role: 'COURSE_MANAGER',
        actorId,
      });
    }

    const existingAssignment = await prisma.courseManagerAssignment.findFirst({
      where: {
        courseId: course.id,
        userId: managerUser.id,
        revokedAt: null,
      },
    });

    if (existingAssignment) {
      throw new Error('Manager already assigned to this course.');
    }

    const assignment = await prisma.courseManagerAssignment.create({
      data: {
        schoolId: course.schoolId,
        courseId: course.id,
        userId: managerUser.id,
        assignedBy: toBigInt(actorId),
      },
      include: {
        manager: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            username: true,
            phone: true,
            role: true,
            status: true,
          },
        },
      },
    });

    return sanitizeAssignmentPayload(assignment);
  },

  async revokeManager({ courseId, userId, actorId }) {
    const course = await prisma.course.findUnique({
      where: { id: toBigInt(courseId) },
      select: { id: true, schoolId: true },
    });

    if (!course) {
      throw new Error('Course not found.');
    }

    const assignment = await prisma.courseManagerAssignment.findFirst({
      where: {
        courseId: course.id,
        userId: toBigInt(userId),
        revokedAt: null,
      },
    });

    if (!assignment) {
      throw new Error('Active manager assignment not found.');
    }

    const revoked = await prisma.courseManagerAssignment.update({
      where: { id: assignment.id },
      data: {
        revokedAt: new Date(),
        assignedBy: toBigInt(actorId) || assignment.assignedBy,
      },
      include: {
        manager: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            username: true,
            phone: true,
            role: true,
            status: true,
          },
        },
      },
    });

    return sanitizeAssignmentPayload(revoked);
  },
};

const formatQuotaSnapshot = (limitValue, usedValue) => {
  const limit = limitValue === null || limitValue === undefined ? null : Number(limitValue);
  const used = Number(usedValue) || 0;
  const remaining = limit === null ? null : Math.max(0, limit - used);
  return {
    limit,
    used,
    remaining,
    overLimit: limit !== null && used >= limit,
  };
};

const getStructureQuota = async (schoolId) => {
  const school = await assertSchool(schoolId);
  const { limits } = await resolveLimitContext(school.id);
  const [branches, courses, branchManagers, courseManagers] = await Promise.all([
    prisma.branch.count({
      where: { schoolId: toBigInt(school.id), deletedAt: null },
    }),
    prisma.course.count({
      where: { schoolId: toBigInt(school.id), deletedAt: null },
    }),
    prisma.branchManagerAssignment.count({
      where: { schoolId: toBigInt(school.id), revokedAt: null },
    }),
    prisma.courseManagerAssignment.count({
      where: { schoolId: toBigInt(school.id), revokedAt: null },
    }),
  ]);

  return {
    schoolId: school.id.toString(),
    branches: formatQuotaSnapshot(limits?.maxBranchesPerSchool, branches),
    courses: formatQuotaSnapshot(limits?.maxCoursesPerSchool, courses),
    branchManagers: formatQuotaSnapshot(limits?.maxBranchManagersPerSchool, branchManagers),
    courseManagers: formatQuotaSnapshot(limits?.maxCourseManagersPerSchool, courseManagers),
  };
};

export default {
  branches: manageBranchAssignments,
  courses: manageCourseAssignments,
  getStructureQuota,
};

