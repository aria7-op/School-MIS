import prisma from '../utils/prismaClient.js';
import {
  resolveManagedScope,
  applyScopeToWhere,
  normalizeScopeWithSchool,
  verifyRecordInScope,
  toBigIntSafe,
  toBigIntOrNull
} from '../utils/contextScope.js';

const convertBigInts = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (obj && typeof obj === 'object' && obj.constructor && obj.constructor.name === 'Decimal') {
    return parseFloat(obj.toString());
  }
  if (Array.isArray(obj)) return obj.map(convertBigInts);
  if (typeof obj === 'object') {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigInts(value);
    }
    return converted;
  }
  return obj;
};

const resolveScopeOrReject = (scope, entityName = 'resource') => {
  if (!scope?.schoolId) {
    const error = new Error(`No managed school selected for ${entityName}`);
    error.statusCode = 400;
    throw error;
  }
  return scope;
};

const ensureIncomeInScope = async (incomeId, scope) => {
  if (!incomeId) {
    return false;
  }
  return verifyRecordInScope('incomes', incomeId, scope, {
    branchColumn: 'branchId',
    useCourse: false
  });
};

const ensureScopedIncomeWhere = (scope, baseWhere = {}) => {
  const where = applyScopeToWhere({ ...baseWhere }, scope, { useCourse: false });
  return { where, empty: false };
};

const respondWithScopedError = (res, error, fallbackMessage = 'Operation failed') => {
  const status = error?.statusCode || error?.status || 500;
  const message = error?.message || fallbackMessage;
  if (status >= 500) {
    console.error(message, error);
  }
  return res.status(status).json({
    success: false,
    message
  });
};

export const getAllIncomes = async (req, res) => {
  try {
    const scope = normalizeScopeWithSchool(
      await resolveManagedScope(req),
      toBigIntSafe(req.user?.schoolId)
    );
    resolveScopeOrReject(scope, 'income list');

    const { page = 1, limit = 20, search = '', status = '' } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNumber - 1) * pageSize;

    const baseWhere = { deletedAt: null };

    if (search) {
      baseWhere.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { source: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      baseWhere.status = status;
    }

    const { where } = ensureScopedIncomeWhere(scope, baseWhere);

    const [incomes, total] = await Promise.all([
      prisma.income.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          updatedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.income.count({ where })
    ]);

    res.json({
      success: true,
      data: convertBigInts(incomes),
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      },
      meta: {
        timestamp: new Date().toISOString(),
        count: incomes.length
      }
    });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch incomes');
  }
};

export const getIncomeById = async (req, res) => {
  try {
    const scope = normalizeScopeWithSchool(
      await resolveManagedScope(req),
      toBigIntSafe(req.user?.schoolId)
    );
    resolveScopeOrReject(scope, 'income detail');

    const incomeId = toBigIntOrNull(req.params.id);
    if (!incomeId) {
      return res.status(400).json({ success: false, message: 'Invalid income ID' });
    }

    const accessible = await ensureIncomeInScope(incomeId, scope);
    if (!accessible) {
      return res.status(404).json({ success: false, message: 'Income not found in the selected context' });
    }

    const { where } = ensureScopedIncomeWhere(scope, { id: incomeId, deletedAt: null });

    const income = await prisma.income.findFirst({
      where,
      include: {
        createdByUser: {
          select: { id: true, username: true, firstName: true, lastName: true }
        },
        updatedByUser: {
          select: { id: true, username: true, firstName: true, lastName: true }
        }
      }
    });

    if (!income) {
      return res.status(404).json({ success: false, message: 'Income not found' });
    }

    res.json({
      success: true,
      data: convertBigInts(income)
    });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch income');
  }
};

export const createIncome = async (req, res) => {
  try {
    const scope = normalizeScopeWithSchool(
      await resolveManagedScope(req),
      toBigIntSafe(req.user?.schoolId)
    );
    resolveScopeOrReject(scope, 'income create');

    const { amount, reference_id, added_by, description, source, income_date, branchId: branchInput } = req.body;

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required and must be greater than 0'
      });
    }

    const branchIdInput = toBigIntOrNull(branchInput);
    if (scope.branchId && branchIdInput && scope.branchId !== branchIdInput) {
      return res.status(403).json({ success: false, message: 'Branch does not match selected context' });
    }
    const branchId = scope.branchId ?? branchIdInput ?? null;

    const income = await prisma.income.create({
      data: {
        amount: numericAmount,
        reference_id: reference_id ? toBigIntSafe(reference_id) : null,
        added_by: added_by ? toBigIntSafe(added_by) : null,
        description: description || null,
        source: source || 'other',
        income_date: income_date ? new Date(income_date) : new Date(),
        schoolId: toBigIntSafe(scope.schoolId),
        branchId,
        createdBy: toBigIntSafe(req.user?.id)
      },
      include: {
        createdByUser: {
          select: { id: true, username: true, firstName: true, lastName: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: convertBigInts(income),
      message: 'Income created successfully'
    });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to create income');
  }
};

export const updateIncome = async (req, res) => {
  try {
    const scope = normalizeScopeWithSchool(
      await resolveManagedScope(req),
      toBigIntSafe(req.user?.schoolId)
    );
    resolveScopeOrReject(scope, 'income update');

    const incomeId = toBigIntOrNull(req.params.id);
    if (!incomeId) {
      return res.status(400).json({ success: false, message: 'Invalid income ID' });
    }

    const accessible = await ensureIncomeInScope(incomeId, scope);
    if (!accessible) {
      return res.status(404).json({ success: false, message: 'Income not found in the selected context' });
    }

    const existingIncome = await prisma.income.findFirst({
      where: ensureScopedIncomeWhere(scope, { id: incomeId, deletedAt: null }).where
    });

    if (!existingIncome) {
      return res.status(404).json({ success: false, message: 'Income not found' });
    }

    const { amount, reference_id, added_by, description, source, income_date, status, branchId: branchInput } = req.body;

    const updateData = {};
    if (amount !== undefined) {
      const numericAmount = Number(amount);
      if (Number.isNaN(numericAmount)) {
        return res.status(400).json({ success: false, message: 'Amount must be a valid number' });
      }
      updateData.amount = numericAmount;
    }
    if (reference_id !== undefined) {
      updateData.reference_id = reference_id ? toBigIntSafe(reference_id) : null;
    }
    if (added_by !== undefined) {
      updateData.added_by = added_by ? toBigIntSafe(added_by) : null;
    }
    if (description !== undefined) updateData.description = description;
    if (source !== undefined) updateData.source = source;
    if (income_date !== undefined) {
      const parsedDate = new Date(income_date);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid income date' });
      }
      updateData.income_date = parsedDate;
    }
    if (status !== undefined) updateData.status = status;

    if (branchInput !== undefined) {
      const branchIdInput = toBigIntOrNull(branchInput);
      if (scope.branchId && branchIdInput && scope.branchId !== branchIdInput) {
        return res.status(403).json({ success: false, message: 'Branch does not match selected context' });
      }
      updateData.branchId = scope.branchId ?? branchIdInput ?? null;
    }

    updateData.updatedBy = toBigIntSafe(req.user?.id);

    const income = await prisma.income.update({
      where: { id: incomeId },
      data: updateData,
      include: {
        createdByUser: {
          select: { id: true, username: true, firstName: true, lastName: true }
        },
        updatedByUser: {
          select: { id: true, username: true, firstName: true, lastName: true }
        }
      }
    });

    res.json({
      success: true,
      data: convertBigInts(income),
      message: 'Income updated successfully'
    });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to update income');
  }
};

export const deleteIncome = async (req, res) => {
  try {
    const scope = normalizeScopeWithSchool(
      await resolveManagedScope(req),
      toBigIntSafe(req.user?.schoolId)
    );
    resolveScopeOrReject(scope, 'income delete');

    const incomeId = toBigIntOrNull(req.params.id);
    if (!incomeId) {
      return res.status(400).json({ success: false, message: 'Invalid income ID' });
    }

    const accessible = await ensureIncomeInScope(incomeId, scope);
    if (!accessible) {
      return res.status(404).json({ success: false, message: 'Income not found in the selected context' });
    }

    await prisma.income.update({
      where: { id: incomeId },
      data: {
        deletedAt: new Date(),
        updatedBy: toBigIntSafe(req.user?.id)
      }
    });

    res.json({ success: true, message: 'Income deleted successfully' });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to delete income');
  }
};

export const getTotalRevenue = async (req, res) => {
  try {
    const scope = normalizeScopeWithSchool(
      await resolveManagedScope(req),
      toBigIntSafe(req.user?.schoolId)
    );
    resolveScopeOrReject(scope, 'income totals');

    const { startDate, endDate } = req.query;

    const baseWhere = { deletedAt: null };
    if (startDate || endDate) {
      baseWhere.income_date = {};
      if (startDate) baseWhere.income_date.gte = new Date(startDate);
      if (endDate) baseWhere.income_date.lte = new Date(endDate);
    }

    const { where } = ensureScopedIncomeWhere(scope, baseWhere);

    const totalRevenue = await prisma.income.aggregate({
      where,
      _sum: { amount: true }
    });

    const total = totalRevenue?._sum?.amount ? Number(totalRevenue._sum.amount) : 0;

    res.json({
      success: true,
      data: {
        totalRevenue: total
      }
    });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch total revenue');
  }
}; 