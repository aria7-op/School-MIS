import CustomerEventService from '../services/customerEventService.js';
import prisma from '../utils/prismaClient.js';
import logger from '../config/logger.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responseUtils.js';
import {
  resolveManagedScope,
  normalizeScopeWithSchool,
  verifyRecordInScope,
  applyScopeToWhere,
  toBigIntSafe,
  toBigIntOrNull
} from '../utils/contextScope.js';

const customerEventService = new CustomerEventService();

const convertBigInts = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(convertBigInts);
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, convertBigInts(val)]));
  }
  return value;
};

const respondWithScopedError = (res, error, fallbackMessage) => {
  const status = error?.statusCode || error?.status || 500;
  const message = error?.message || fallbackMessage;
  logger.error(message, error);
  return createErrorResponse(res, status, message);
};

const resolveEventScope = async (req, entityName) => {
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

const applyCustomerScope = (scope, where = {}) => applyScopeToWhere({ ...where }, scope, { useCourse: false });

class CustomerEventController {
  constructor() {
    this.customerEventService = customerEventService;
  }

  /**
   * Get customer timeline
   */
  async getCustomerTimeline(req, res) {
    try {
      const scope = await resolveEventScope(req, 'customer timeline');
      const customerId = toBigIntOrNull(req.params.customerId);
      if (!customerId) {
        return createErrorResponse(res, 400, 'Invalid customer ID');
      }

      const accessible = await ensureCustomerAccessible(customerId, scope);
      if (!accessible) {
        return createErrorResponse(res, 404, 'Customer not found in the selected context');
      }

      const { startDate, endDate, eventType } = req.query;

      const filters = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (eventType) filters.eventType = eventType;

      const result = await this.customerEventService.getCustomerTimeline(customerId, filters);

      return createSuccessResponse(res, 'Customer timeline retrieved successfully', convertBigInts(result.data));
    } catch (error) {
      logger.error('Error getting customer timeline:', error);
      return respondWithScopedError(res, error, 'Failed to retrieve customer timeline');
    }
  }

  /**
   * Get customer conversion history
   */
  async getCustomerConversionHistory(req, res) {
    try {
      const scope = await resolveEventScope(req, 'customer conversion history');
      const customerId = toBigIntOrNull(req.params.customerId);
      if (!customerId) {
        return createErrorResponse(res, 400, 'Invalid customer ID');
      }

      const accessible = await ensureCustomerAccessible(customerId, scope);
      if (!accessible) {
        return createErrorResponse(res, 404, 'Customer not found in the selected context');
      }

      const result = await this.customerEventService.getCustomerConversionHistory(customerId);

      return createSuccessResponse(res, 'Customer conversion history retrieved successfully', convertBigInts(result.data));
    } catch (error) {
      logger.error('Error getting customer conversion history:', error);
      return respondWithScopedError(res, error, 'Failed to retrieve customer conversion history');
    }
  }

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(req, res) {
    try {
      const scope = await resolveEventScope(req, 'customer analytics');
      const customerId = toBigIntOrNull(req.params.customerId);
      if (!customerId) {
        return createErrorResponse(res, 400, 'Invalid customer ID');
      }

      const accessible = await ensureCustomerAccessible(customerId, scope);
      if (!accessible) {
        return createErrorResponse(res, 404, 'Customer not found in the selected context');
      }

      const result = await this.customerEventService.getCustomerAnalytics(customerId);

      return createSuccessResponse(res, 'Customer analytics retrieved successfully', convertBigInts(result.data));
    } catch (error) {
      logger.error('Error getting customer analytics:', error);
      return respondWithScopedError(res, error, 'Failed to retrieve customer analytics');
    }
  }

  /**
   * Get customer events with filtering
   */
  async getCustomerEvents(req, res) {
    try {
      const scope = await resolveEventScope(req, 'customer events');
      const customerId = toBigIntOrNull(req.params.customerId);
      if (!customerId) {
        return createErrorResponse(res, 400, 'Invalid customer ID');
      }
      const accessible = await ensureCustomerAccessible(customerId, scope);
      if (!accessible) {
        return createErrorResponse(res, 404, 'Customer not found in the selected context');
      }
      const { 
        eventType, 
        startDate, 
        endDate, 
        page = 1, 
        limit = 50,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
 
      const filters = {
        eventType,
        startDate,
        endDate,
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
      };
 
      const result = await this.customerEventService.getCustomerEvents(customerId, filters);
 
      return createSuccessResponse(res, 'Customer events retrieved successfully', convertBigInts(result.data));
    } catch (error) {
      logger.error('Error getting customer events:', error);
      return respondWithScopedError(res, error, 'Failed to retrieve customer events');
    }
  }

  /**
   * Create customer interaction event
   */
  async createCustomerInteraction(req, res) {
    try {
      const scope = await resolveEventScope(req, 'customer interaction event');
      const customerId = toBigIntOrNull(req.params.customerId);
      if (!customerId) {
        return createErrorResponse(res, 400, 'Invalid customer ID');
      }

      const accessible = await ensureCustomerAccessible(customerId, scope);
      if (!accessible) {
        return createErrorResponse(res, 404, 'Customer not found in the selected context');
      }

      const interactionData = req.body;
      const userId = toBigIntSafe(req.user?.id);

      const result = await this.customerEventService.createCustomerInteractionEvent(
        customerId,
        interactionData,
        userId,
        scope.schoolId
      );

      return createSuccessResponse(res, 'Customer interaction event created successfully', convertBigInts(result.data));
    } catch (error) {
      logger.error('Error creating customer interaction event:', error);
      return respondWithScopedError(res, error, 'Failed to create customer interaction event');
    }
  }

  /**
   * Create customer status change event
   */
  async createCustomerStatusChange(req, res) {
    try {
      const scope = await resolveEventScope(req, 'customer status change event');
      const customerId = toBigIntOrNull(req.params.customerId);
      if (!customerId) {
        return createErrorResponse(res, 400, 'Invalid customer ID');
      }

      const accessible = await ensureCustomerAccessible(customerId, scope);
      if (!accessible) {
        return createErrorResponse(res, 404, 'Customer not found in the selected context');
      }

      const statusData = req.body;
      const userId = toBigIntSafe(req.user?.id);

      const result = await this.customerEventService.createCustomerStatusChangeEvent(
        customerId,
        statusData,
        userId,
        scope.schoolId
      );

      return createSuccessResponse(res, 'Customer status change event created successfully', convertBigInts(result.data));
    } catch (error) {
      logger.error('Error creating customer status change event:', error);
      return respondWithScopedError(res, error, 'Failed to create customer status change event');
    }
  }

  /**
   * Create customer pipeline stage change event
   */
  async createCustomerPipelineStageChange(req, res) {
    try {
      const scope = await resolveEventScope(req, 'customer pipeline stage change event');
      const customerId = toBigIntOrNull(req.params.customerId);
      if (!customerId) {
        return createErrorResponse(res, 400, 'Invalid customer ID');
      }

      const accessible = await ensureCustomerAccessible(customerId, scope);
      if (!accessible) {
        return createErrorResponse(res, 404, 'Customer not found in the selected context');
      }

      const pipelineData = req.body;
      const userId = toBigIntSafe(req.user?.id);

      const result = await this.customerEventService.createCustomerPipelineStageChangeEvent(
        customerId,
        pipelineData,
        userId,
        scope.schoolId
      );

      return createSuccessResponse(res, 'Customer pipeline stage change event created successfully', convertBigInts(result.data));
    } catch (error) {
      logger.error('Error creating customer pipeline stage change event:', error);
      return respondWithScopedError(res, error, 'Failed to create customer pipeline stage change event');
    }
  }

  /**
   * Export customer events
   */
  async exportCustomerEvents(req, res) {
    try {
      const scope = await resolveEventScope(req, 'customer events export');
      const customerId = toBigIntOrNull(req.params.customerId);
      if (!customerId) {
        return createErrorResponse(res, 400, 'Invalid customer ID');
      }

      const accessible = await ensureCustomerAccessible(customerId, scope);
      if (!accessible) {
        return createErrorResponse(res, 404, 'Customer not found in the selected context');
      }

      const { format = 'json' } = req.query;

      const result = await this.customerEventService.exportCustomerEvents(customerId, format);
      const normalizedData = convertBigInts(result.data);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="customer_${customerId}_events.csv"`);
        
        // Convert to CSV string
        const headers = Object.keys(normalizedData[0] || {}).join(',');
        const rows = normalizedData.map(row => Object.values(row).join(','));
        const csvContent = [headers, ...rows].join('\n');
        
        return res.send(csvContent);
      }

      return createSuccessResponse(res, 'Customer events exported successfully', normalizedData);
    } catch (error) {
      logger.error('Error exporting customer events:', error);
      return respondWithScopedError(res, error, 'Failed to export customer events');
    }
  }

  /**
   * Get customer conversion analytics
   */
  async getCustomerConversionAnalytics(req, res) {
    try {
      const scope = await resolveEventScope(req, 'customer conversion analytics');
      const customerId = toBigIntOrNull(req.params.customerId);
      if (!customerId) {
        return createErrorResponse(res, 400, 'Invalid customer ID');
      }

      const accessible = await ensureCustomerAccessible(customerId, scope);
      if (!accessible) {
        return createErrorResponse(res, 404, 'Customer not found in the selected context');
      }

      const conversionEvents = await this.customerEventService.getCustomerConversionHistory(customerId);
      const allEvents = await this.customerEventService.getCustomerEvents(customerId);

      const conversionData = conversionEvents?.data ?? [];
      const eventsData = allEvents?.data ?? [];

      const conversionMetrics = {
        totalEvents: eventsData.length,
        conversionEvents: conversionData.length,
        conversionRate: eventsData.length > 0 ? Number(((conversionData.length / eventsData.length) * 100).toFixed(2)) : 0,
        lastConversionAttempt: conversionData[0]?.createdAt || null,
        conversionStatus: conversionData[0]?.eventType || 'NO_CONVERSION_ATTEMPT',
        conversionTimeline: conversionData.map(event => ({
          date: event.createdAt,
          type: event.eventType,
          description: event.description,
          metadata: event.metadata
        }))
      };

      return createSuccessResponse(res, 'Customer conversion analytics retrieved successfully', convertBigInts(conversionMetrics));
    } catch (error) {
      logger.error('Error getting customer conversion analytics:', error);
      return respondWithScopedError(res, error, 'Failed to retrieve customer conversion analytics');
    }
  }

  /**
   * Get customer interaction summary
   */
  async getCustomerInteractionSummary(req, res) {
    try {
      const scope = await resolveEventScope(req, 'customer interaction summary');
      const customerId = toBigIntOrNull(req.params.customerId);
      if (!customerId) {
        return createErrorResponse(res, 400, 'Invalid customer ID');
      }

      const accessible = await ensureCustomerAccessible(customerId, scope);
      if (!accessible) {
        return createErrorResponse(res, 404, 'Customer not found in the selected context');
      }

      // Get all customer events
      const allEvents = await this.customerEventService.getCustomerEvents(customerId);
      
      // Filter interaction events
      const eventsData = allEvents?.data ?? [];
      const interactionEvents = eventsData.filter(event => 
        event.eventType.includes('CUSTOMER_CONTACTED') ||
        event.eventType.includes('CUSTOMER_MEETING') ||
        event.eventType.includes('CUSTOMER_CALL') ||
        event.eventType.includes('CUSTOMER_EMAIL')
      );

      // Calculate interaction summary
      const interactionSummary = {
        totalInteractions: interactionEvents.length,
        lastInteraction: interactionEvents[0]?.createdAt || null,
        interactionTypes: interactionEvents.reduce((acc, event) => {
          const type = event.eventType.replace('CUSTOMER_', '');
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {}),
        recentInteractions: interactionEvents.slice(0, 5).map(event => ({
          date: event.createdAt,
          type: event.eventType,
          description: event.description,
          createdBy: event.createdByUser
        }))
      };

      return createSuccessResponse(res, 'Customer interaction summary retrieved successfully', convertBigInts(interactionSummary));
    } catch (error) {
      logger.error('Error getting customer interaction summary:', error);
      return respondWithScopedError(res, error, 'Failed to retrieve customer interaction summary');
    }
  }
}

export default CustomerEventController; 