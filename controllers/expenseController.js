import prisma from '../utils/prismaClient.js';
import {
  resolveManagedScope,
  applyScopeToWhere,
  normalizeScopeWithSchool,
  verifyRecordInScope,
  toBigIntSafe,
  toBigIntOrNull
} from '../utils/contextScope.js';
// Helper function to convert BigInt, Decimal, and Date values
const convertBigInts = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  // Handle Date objects - convert to ISO string
  if (obj instanceof Date || Object.prototype.toString.call(obj) === '[object Date]') {
    const d = new Date(obj);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  // Handle Prisma Decimal type
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

const ensureExpenseInScope = async (expenseId, scope) => {
  if (!expenseId) {
    return false;
  }
  return verifyRecordInScope('expenses', expenseId, scope, {
    branchColumn: 'branchId',
    useCourse: false
  });
};

const ensureScopedExpenseWhere = (scope, baseWhere = {}) => {
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

export const getAllExpenses = async (req, res) => {
  try {
    const scope = normalizeScopeWithSchool(
      await resolveManagedScope(req),
      toBigIntSafe(req.user?.schoolId)
    );
    resolveScopeOrReject(scope, 'expense list');

    if (!prisma?.expense) {
      return res.status(501).json({ success: false, message: 'Expense model not configured' });
    }

    const { where } = ensureScopedExpenseWhere(scope, { deletedAt: null });

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    const converted = convertBigInts(expenses).map(expense => {
      // Helper function to safely convert date to ISO string
      const safeToISOString = (dateValue) => {
        if (!dateValue) return null;
        if (typeof dateValue === 'string') {
          const date = new Date(dateValue);
          return isNaN(date.getTime()) ? dateValue : date.toISOString();
        }
        if (dateValue instanceof Date) {
          return isNaN(dateValue.getTime()) ? null : dateValue.toISOString();
        }
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? null : date.toISOString();
      };
      
      // Ensure date fields are properly formatted as ISO strings
      if (expense.date) {
        const formatted = safeToISOString(expense.date);
        if (formatted) expense.date = formatted;
      }
      if (expense.createdAt) {
        const formatted = safeToISOString(expense.createdAt);
        if (formatted) expense.createdAt = formatted;
      }
      if (expense.updatedAt) {
        const formatted = safeToISOString(expense.updatedAt);
        if (formatted) expense.updatedAt = formatted;
      }
      return expense;
    });

    res.json({ success: true, data: converted });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch expenses');
  }
};

export const getExpenseById = async (req, res) => {
  try {
    const scope = normalizeScopeWithSchool(
      await resolveManagedScope(req),
      toBigIntSafe(req.user?.schoolId)
    );
    resolveScopeOrReject(scope, 'expense detail');

    if (!prisma?.expense) {
      return res.status(404).json({ success: false, message: 'Expense model not configured' });
    }

    const expenseId = toBigIntOrNull(req.params.id);
    if (!expenseId) {
      return res.status(400).json({ success: false, message: 'Invalid expense ID' });
    }

    const accessible = await ensureExpenseInScope(expenseId, scope);
    if (!accessible) {
      return res.status(404).json({ success: false, message: 'Expense not found in the selected context' });
    }

    const { where } = ensureScopedExpenseWhere(scope, { id: expenseId, deletedAt: null });

    const expense = await prisma.expense.findFirst({ where });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const converted = convertBigInts(expense);
    
    // Ensure date fields are properly formatted as ISO strings
    if (expense.date) {
      converted.date = expense.date instanceof Date 
        ? expense.date.toISOString() 
        : new Date(expense.date).toISOString();
    }
    if (expense.createdAt) {
      converted.createdAt = expense.createdAt instanceof Date 
        ? expense.createdAt.toISOString() 
        : new Date(expense.createdAt).toISOString();
    }
    if (expense.updatedAt) {
      converted.updatedAt = expense.updatedAt instanceof Date 
        ? expense.updatedAt.toISOString() 
        : new Date(expense.updatedAt).toISOString();
    }

    res.json({ success: true, data: converted });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch expense');
  }
};

export const createExpense = async (req, res) => {
  try {
    const scope = normalizeScopeWithSchool(
      await resolveManagedScope(req),
      toBigIntSafe(req.user?.schoolId)
    );
    resolveScopeOrReject(scope, 'expense create');

    if (!prisma?.expense) {
      return res.status(501).json({ success: false, message: 'Expense model not configured' });
    }

    const { title, description, amount, category, date, status, branchId: branchInput } = req.body;

    if (!title || amount === undefined || amount === null || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, amount, category'
      });
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount)) {
      return res.status(400).json({ success: false, message: 'Amount must be a valid number' });
    }

    const requestBranchId = toBigIntOrNull(branchInput);
    if (scope.branchId && requestBranchId && scope.branchId !== requestBranchId) {
      return res.status(403).json({ success: false, message: 'Branch does not match selected context' });
    }
    const branchId = scope.branchId ?? requestBranchId ?? null;

    const actorId = toBigIntSafe(req.user?.id);

    // Handle missing, null, empty string, or invalid dates - default to current date
    let expenseDate = new Date(); // Default to current date
    
    if (date && date !== '' && date !== null && date !== undefined) {
      if (date instanceof Date) {
        expenseDate = date;
      } else {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          expenseDate = parsedDate;
        }
        // If invalid, use current date (default)
      }
    }
    
    // Ensure we have a valid date
    if (isNaN(expenseDate.getTime())) {
      expenseDate = new Date(); // Fallback to current date
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        description,
        amount: numericAmount,
        category,
        date: expenseDate,
        status: status || 'PENDING',
        schoolId: toBigIntSafe(scope.schoolId),
        branchId,
        createdBy: actorId,
        updatedBy: actorId
      }
    });

    const converted = convertBigInts(expense);
    
    // Ensure date fields are properly formatted as ISO strings
    if (expense.date) {
      converted.date = expense.date instanceof Date 
        ? expense.date.toISOString() 
        : new Date(expense.date).toISOString();
    }
    if (expense.createdAt) {
      converted.createdAt = expense.createdAt instanceof Date 
        ? expense.createdAt.toISOString() 
        : new Date(expense.createdAt).toISOString();
    }
    if (expense.updatedAt) {
      converted.updatedAt = expense.updatedAt instanceof Date 
        ? expense.updatedAt.toISOString() 
        : new Date(expense.updatedAt).toISOString();
    }
    
    res.status(201).json({ success: true, data: converted });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to create expense');
  }
};

export const updateExpense = async (req, res) => {
  try {
    const scope = normalizeScopeWithSchool(
      await resolveManagedScope(req),
      toBigIntSafe(req.user?.schoolId)
    );
    resolveScopeOrReject(scope, 'expense update');

    if (!prisma?.expense) {
      return res.status(501).json({ success: false, message: 'Expense model not configured' });
    }

    const expenseId = toBigIntOrNull(req.params.id);
    if (!expenseId) {
      return res.status(400).json({ success: false, message: 'Invalid expense ID' });
    }

    const accessible = await ensureExpenseInScope(expenseId, scope);
    if (!accessible) {
      return res.status(404).json({ success: false, message: 'Expense not found in the selected context' });
    }

    const { title, description, amount, category, date, status, branchId: branchInput } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;
    if (amount !== undefined) {
      const numericAmount = Number(amount);
      if (Number.isNaN(numericAmount)) {
        return res.status(400).json({ success: false, message: 'Amount must be a valid number' });
      }
      updateData.amount = numericAmount;
    }
    if (date !== undefined) {
      const parsedDate = date instanceof Date ? date : new Date(date);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date value' });
      }
      updateData.date = parsedDate;
    }

    if (branchInput !== undefined) {
      const branchIdInput = toBigIntOrNull(branchInput);
      if (scope.branchId && branchIdInput && scope.branchId !== branchIdInput) {
        return res.status(403).json({ success: false, message: 'Branch does not match selected context' });
      }
      updateData.branchId = scope.branchId ?? branchIdInput ?? null;
    }

    updateData.updatedBy = toBigIntSafe(req.user?.id);

    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: updateData
    });

    const converted = convertBigInts(expense);
    
    // Ensure date fields are properly formatted as ISO strings
    if (expense.date) {
      converted.date = expense.date instanceof Date 
        ? expense.date.toISOString() 
        : new Date(expense.date).toISOString();
    }
    if (expense.createdAt) {
      converted.createdAt = expense.createdAt instanceof Date 
        ? expense.createdAt.toISOString() 
        : new Date(expense.createdAt).toISOString();
    }
    if (expense.updatedAt) {
      converted.updatedAt = expense.updatedAt instanceof Date 
        ? expense.updatedAt.toISOString() 
        : new Date(expense.updatedAt).toISOString();
    }

    res.json({ success: true, data: converted });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to update expense');
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const scope = normalizeScopeWithSchool(
      await resolveManagedScope(req),
      toBigIntSafe(req.user?.schoolId)
    );
    resolveScopeOrReject(scope, 'expense delete');

    if (!prisma?.expense) {
      return res.status(501).json({ success: false, message: 'Expense model not configured' });
    }

    const expenseId = toBigIntOrNull(req.params.id);
    if (!expenseId) {
      return res.status(400).json({ success: false, message: 'Invalid expense ID' });
    }

    const accessible = await ensureExpenseInScope(expenseId, scope);
    if (!accessible) {
      return res.status(404).json({ success: false, message: 'Expense not found in the selected context' });
    }

    await prisma.expense.update({
      where: { id: expenseId },
      data: {
        deletedAt: new Date(),
        updatedBy: toBigIntSafe(req.user?.id)
      }
    });

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to delete expense');
  }
};

export const getTotalExpenses = async (req, res) => {
  try {
    const scope = normalizeScopeWithSchool(
      await resolveManagedScope(req),
      toBigIntSafe(req.user?.schoolId)
    );
    resolveScopeOrReject(scope, 'expense totals');

    if (!prisma?.expense) {
      return res.status(501).json({ success: false, message: 'Expense model not configured' });
    }

    const { startDate, endDate } = req.query;

    const baseWhere = { deletedAt: null };
    if (startDate || endDate) {
      baseWhere.date = {};
      if (startDate) baseWhere.date.gte = new Date(startDate);
      if (endDate) baseWhere.date.lte = new Date(endDate);
    }

    const { where } = ensureScopedExpenseWhere(scope, baseWhere);

    const totalExpenses = await prisma.expense.aggregate({
      where,
      _sum: { amount: true }
    });

    const total = totalExpenses?._sum?.amount ? Number(totalExpenses._sum.amount) : 0;

    res.json({
      success: true,
      data: {
        totalExpenses: total
      }
    });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch total expenses');
  }
};