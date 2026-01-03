import prisma from '../utils/prismaClient.js';
import {
  resolveManagedScope,
  normalizeScopeWithSchool,
  applyScopeToWhere,
  toBigIntSafe
} from '../utils/contextScope.js';

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

const respondWithScopedError = (res, error, fallbackMessage) => {
  const status = error?.statusCode || error?.status || 500;
  const message = error?.message || fallbackMessage;
  if (status >= 500) {
    console.error(message, error);
  }
  return res.status(status).json({ success: false, message });
};

export const advancedSearch = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'customer search');
    // Example: search by name/email/phone
    const { query } = req.query;
    const customers = await prisma.customer.findMany({
      where: applyScopeToWhere({
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } }
        ]
      }, scope, { useCourse: false })
    });
    res.json({ success: true, data: customers });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to perform advanced customer search');
  }
};

export const getSearchSuggestions = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'customer search suggestions');
    // Mock suggestions
    res.json({ success: true, data: ['John Doe', 'Jane Smith', 'Acme Corp'] });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch search suggestions');
  }
};

export const getAutocomplete = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'customer autocomplete');
    // Mock autocomplete
    res.json({ success: true, data: ['john@example.com', 'jane@example.com'] });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch autocomplete suggestions');
  }
};

export const saveSearch = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'save customer search');
    // Mock save
    res.json({ success: true, message: 'Search saved', id: 1 });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to save search');
  }
};

export const getSavedSearches = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'saved customer searches');
    // Mock saved searches
    res.json({ success: true, data: [{ id: 1, query: 'John' }] });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch saved searches');
  }
};

export const deleteSavedSearch = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'delete saved search');
    // Mock delete
    res.json({ success: true, message: 'Saved search deleted' });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to delete saved search');
  }
};

export const getAvailableFilters = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'available filters');
    // Mock filters
    res.json({ success: true, data: ['name', 'email', 'phone', 'status'] });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch available filters');
  }
};

export const createCustomFilter = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'create custom filter');
    // Mock custom filter
    res.json({ success: true, message: 'Custom filter created', id: 1 });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to create custom filter');
  }
}; 