const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
    getSalesReport,
    getInventoryReport,
    getInventoryHistory,
    getCustomerPurchaseReport
} = require('../controllers/report.controller');

/**
 * @swagger
 * /reports/sales:
 *   get:
 *     summary: Get sales report (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: group_by
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *     responses:
 *       200:
 *         description: Sales report
 */
router.get('/sales', authenticate, authorize('admin'), getSalesReport);

/**
 * @swagger
 * /reports/inventory:
 *   get:
 *     summary: Get inventory report (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory report
 */
router.get('/inventory', authenticate, authorize('admin'), getInventoryReport);

/**
 * @swagger
 * /reports/inventory/{product_id}/history:
 *   get:
 *     summary: Get inventory history for a product (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inventory history
 */
router.get('/inventory/:product_id/history', authenticate, authorize('admin'), getInventoryHistory);

/**
 * @swagger
 * /reports/customers/{id}/purchases:
 *   get:
 *     summary: Get customer purchase report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Purchase report
 */
router.get('/customers/:id/purchases', authenticate, getCustomerPurchaseReport);

module.exports = router;