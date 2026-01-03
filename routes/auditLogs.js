import express from 'express';
import { authenticateToken, authorizePermissions } from '../middleware/auth.js';
import AuditController from '../controllers/auditController.js';

const router = express.Router();
const auditController = new AuditController();

// Get all audit logs (filtered and paginated)
router.get('/',
  authenticateToken,
  authorizePermissions(['audit:read']),
  (req, res) => auditController.getAuditLogs(req, res)
);

// Get audit history for specific entity
router.get('/entity/:entityType/:entityId',
  authenticateToken,
  authorizePermissions(['audit:read']),
  (req, res) => auditController.getEntityAuditHistory(req, res)
);

// Get audit statistics
router.get('/stats',
  authenticateToken,
  authorizePermissions(['audit:read']),
  (req, res) => auditController.getAuditStats(req, res)
);

// Get audit analytics dashboard
router.get('/analytics',
  authenticateToken,
  authorizePermissions(['audit:read']),
  (req, res) => auditController.getAuditAnalytics(req, res)
);

export default router;

