import prisma from '../utils/prismaClient.js';
import {
  resolveManagedScope,
  normalizeScopeWithSchool,
  verifyRecordInScope,
  applyScopeToWhere,
  toBigIntSafe,
  toBigIntOrNull
} from '../utils/contextScope.js';

const convertBigInts = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
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

const resolveScopeOrReject = async (req, entityName) => {
  const scope = normalizeScopeWithSchool(
    await resolveManagedScope(req),
    toBigIntSafe(req.user?.schoolId)
  );
  if (!scope?.schoolId) {
    const error = new Error(`No managed school selected for ${entityName}`);
    error.statusCode = 400;
    throw error;
  }
  return scope;
};

const ensureCustomerAccessible = async (customerId, scope) => {
  if (!customerId) return false;
  return verifyRecordInScope('customers', customerId, scope, {
    branchColumn: 'branchId',
    useCourse: false
  });
};

const ensureScopedCustomerWhere = (scope, baseWhere = {}) => {
  return applyScopeToWhere({ ...baseWhere }, scope, { useCourse: false });
};

const respondWithScopedError = (res, error, fallbackMessage) => {
  const status = error?.statusCode || error?.status || 500;
  const message = error?.message || fallbackMessage;
  if (status >= 500) {
    console.error(message, error);
  }
  return res.status(status).json({ success: false, message });
};

// Get analytics for a specific customer
export const getCustomerAnalytics = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'customer analytics');
    const customerId = toBigIntOrNull(req.params.id);
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID' });
    }

    const accessible = await ensureCustomerAccessible(customerId, scope);
    if (!accessible) {
      return res.status(404).json({ success: false, message: 'Customer not found in the selected context' });
    }

    const [interactions, tickets] = await Promise.all([
      prisma.customerInteraction.count({ where: { customerId } }),
      prisma.customerTicket.count({ where: { customerId } })
    ]);
    res.json({ success: true, data: { interactions, tickets } });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch customer analytics');
  }
};

// Get customer performance analytics
export const getCustomerPerformance = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'customer performance analytics');
    // Example: mock performance data
    res.json({ success: true, data: { score: 87, rank: 5 } });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch customer performance');
  }
};

// Get engagement analytics
export const getEngagementAnalytics = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'customer engagement analytics');
    // Example: mock engagement data
    res.json({ success: true, data: { engagementRate: 0.72, activeDays: 22 } });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch engagement analytics');
  }
};

// Get conversion analytics
export const getConversionAnalytics = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'customer conversion analytics');
    // Example: mock conversion data
    res.json({ success: true, data: { conversionRate: 0.18, conversions: 9 } });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch conversion analytics');
  }
};

// Get lifetime value analytics
export const getLifetimeValueAnalytics = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'customer lifetime value analytics');
    // Example: mock LTV data
    res.json({ success: true, data: { lifetimeValue: 12000 } });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch lifetime value analytics');
  }
};

// Get analytics dashboard
export const getAnalyticsDashboard = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'customer analytics dashboard');
    // Example: mock dashboard data
    res.json({ success: true, data: { totalCustomers: 100, activeCustomers: 80, churnRate: 0.05 } });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch analytics dashboard');
  }
};

// Get analytics reports
export const getAnalyticsReports = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'customer analytics reports');
    // Example: mock report data
    res.json({ success: true, data: [{ report: 'Monthly', value: 50 }, { report: 'Quarterly', value: 150 }] });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch analytics reports');
  }
};

// Get analytics trends
export const getAnalyticsTrends = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'customer analytics trends');
    // Example: mock trend data
    res.json({ success: true, data: [{ month: 'Jan', value: 10 }, { month: 'Feb', value: 20 }] });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch analytics trends');
  }
};

// Get forecasting analytics
export const getForecastingAnalytics = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'customer forecasting analytics');
    // Example: mock forecast data
    res.json({ success: true, data: { forecast: 200 } });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch forecasting analytics');
  }
};

// Export analytics (mock)
export const exportAnalytics = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'customer analytics export');
    // Example: mock export
    res.json({ success: true, message: 'Analytics export started', jobId: 'mock-job-123' });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to export analytics');
  }
}; 