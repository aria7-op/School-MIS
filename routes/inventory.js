import express from 'express';
const router = express.Router();
import inventoryController from '../controllers/inventoryController';
import {authenticateToken, authorizeRoles} from '../middleware/auth';

import {
  validateInventoryItemData,
  validateCategoryData,
  validateSupplierData,
  validatePurchaseOrderData,
} from '../utils/inventoryUtils';

// Category routes
router.post('/categories', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.createCategory);
router.get('/categories', authenticateToken, inventoryController.getCategories);
router.get('/categories/:id', authenticateToken, inventoryController.getCategoryById);
router.put('/categories/:id', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.updateCategory);
router.delete('/categories/:id', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.deleteCategory);

// Item routes
router.post('/items', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.createItem);
router.get('/items', authenticateToken, inventoryController.getItems);
router.get('/items/:id', authenticateToken, inventoryController.getItemById);
router.put('/items/:id', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.updateItem);
router.delete('/items/:id', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.deleteItem);

// Transaction routes
router.post('/transactions', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.createTransaction);
router.get('/transactions', authenticateToken, inventoryController.getTransactions);
router.get('/transactions/:id', authenticateToken, inventoryController.getTransactionById);

// Supplier routes
router.post('/suppliers', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.createSupplier);
router.get('/suppliers', authenticateToken, inventoryController.getSuppliers);
router.get('/suppliers/:id', authenticateToken, inventoryController.getSupplierById);
router.put('/suppliers/:id', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.updateSupplier);
router.delete('/suppliers/:id', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.deleteSupplier);

// Purchase order routes
router.post('/purchase-orders', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.createPurchaseOrder);
router.get('/purchase-orders', authenticateToken, inventoryController.getPurchaseOrders);
router.get('/purchase-orders/:id', authenticateToken, inventoryController.getPurchaseOrderById);
router.put('/purchase-orders/:id', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.updatePurchaseOrder);
router.patch('/purchase-orders/:id/approve', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.approvePurchaseOrder);
router.patch('/purchase-orders/:id/receive', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.receivePurchaseOrder);

// Maintenance routes
router.post('/maintenance', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.createMaintenanceLog);
router.get('/maintenance', authenticateToken, inventoryController.getMaintenanceLogs);
router.get('/maintenance/:id', authenticateToken, inventoryController.getMaintenanceLogById);
router.put('/maintenance/:id', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.updateMaintenanceLog);

// Alert routes
router.get('/alerts', authenticateToken, inventoryController.getAlerts);
router.patch('/alerts/:id/resolve', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.resolveAlert);
router.post('/alerts/generate', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.generateAlerts);

// Search and discovery
router.get('/search', authenticateToken, inventoryController.searchItems);
router.get('/low-stock', authenticateToken, inventoryController.getLowStockItems);
router.get('/expiring', authenticateToken, inventoryController.getExpiringItems);
router.get('/overdue-maintenance', authenticateToken, inventoryController.getOverdueMaintenance);

// Analytics and reporting
router.get('/analytics/summary', authenticateToken, inventoryController.getInventoryAnalytics);
router.get('/analytics/trends', authenticateToken, inventoryController.getInventoryTrends);
router.get('/analytics/valuations', authenticateToken, inventoryController.getInventoryValuations);
router.get('/report/generate', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.generateInventoryReport);

// Dashboard routes
router.get('/dashboard/summary', authenticateToken, inventoryController.getDashboardSummary);
router.get('/dashboard/recent-transactions', authenticateToken, inventoryController.getRecentTransactions);
router.get('/dashboard/pending-orders', authenticateToken, inventoryController.getPendingOrders);
router.get('/dashboard/alerts-summary', authenticateToken, inventoryController.getAlertsSummary);

// Bulk operations
router.post('/bulk/import', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.bulkImportItems);
router.post('/bulk/update', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.bulkUpdateItems);
router.post('/bulk/export', authenticateToken, inventoryController.bulkExportItems);

// Audit and compliance
router.get('/audit/list', authenticateToken, inventoryController.getAuditList);
router.post('/audit/perform', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.performAudit);
router.get('/audit/report', authenticateToken, inventoryController.getAuditReport);

// Stock management
router.post('/stock/adjust', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.adjustStock);
router.post('/stock/transfer', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.transferStock);
router.post('/stock/reserve', authenticateToken, inventoryController.reserveStock);
router.post('/stock/release', authenticateToken, inventoryController.releaseStock);

// Barcode and QR code
router.get('/barcode/:itemId', authenticateToken, inventoryController.generateBarcode);
router.get('/qrcode/:itemId', authenticateToken, inventoryController.generateQRCode);
router.post('/scan', authenticateToken, inventoryController.scanBarcode);

// Settings and configuration
router.get('/settings', authenticateToken, inventoryController.getInventorySettings);
router.put('/settings', authenticateToken, authorizeRoles(['INVENTORY_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']), inventoryController.updateInventorySettings);

export default router; 