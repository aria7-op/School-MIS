import logger from '../config/logger.js';
import {
  resolveManagedScope,
  normalizeScopeWithSchool,
  toBigIntSafe
} from '../utils/contextScope.js';

const resolveWorkflowScope = async (req, entityName) => {
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
  logger.error(message, error);
  return res.status(status).json({ success: false, message });
};

export const getWorkflows = async (req, res) => {
  try {
    await resolveWorkflowScope(req, 'workflow list');
    res.json({ success: true, data: [
      { id: 1, name: 'Onboarding', status: 'active' },
      { id: 2, name: 'Offboarding', status: 'inactive' }
    ] });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch workflows');
  }
};

export const createWorkflow = async (req, res) => {
  try {
    await resolveWorkflowScope(req, 'workflow create');
    res.status(201).json({ success: true, data: { id: 3, ...req.body } });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to create workflow');
  }
};

export const getWorkflowById = async (req, res) => {
  try {
    await resolveWorkflowScope(req, 'workflow detail');
    res.json({ success: true, data: { id: req.params.workflowId, name: 'Onboarding', status: 'active' } });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch workflow');
  }
};

export const updateWorkflow = async (req, res) => {
  try {
    await resolveWorkflowScope(req, 'workflow update');
    res.json({ success: true, data: { id: req.params.workflowId, ...req.body } });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to update workflow');
  }
};

export const deleteWorkflow = async (req, res) => {
  try {
    await resolveWorkflowScope(req, 'workflow delete');
    res.json({ success: true, message: 'Workflow deleted' });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to delete workflow');
  }
};

export const executeWorkflow = async (req, res) => {
  try {
    await resolveWorkflowScope(req, 'workflow execute');
    res.json({ success: true, message: 'Workflow executed', workflowId: req.params.workflowId });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to execute workflow');
  }
};

export const getWorkflowAnalytics = async (req, res) => {
  try {
    await resolveWorkflowScope(req, 'workflow analytics');
    res.json({ success: true, data: { totalWorkflows: 2, active: 1, inactive: 1 } });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch workflow analytics');
  }
}; 