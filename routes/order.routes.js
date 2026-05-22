const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validateOrder } = require('../middleware/validation');
const {
    placeOrder,
    getUserOrders,
    getOrderDetails,
    updateOrderStatus,
    trackOrder,
    getAllOrders
} = require('../controllers/order.controller');

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Place an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - delivery_address
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *               delivery_address:
 *                 type: string
 *               delivery_location_lat:
 *                 type: number
 *               delivery_location_lng:
 *                 type: number
 *     responses:
 *       201:
 *         description: Order placed successfully
 *       400:
 *         description: Bad request
 */
router.post('/', authenticate, validateOrder, placeOrder);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get my orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/', authenticate, getUserOrders);

/**
 * @swagger
 * /orders/all:
 *   get:
 *     summary: Get all orders (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All orders
 */
router.get('/all', authenticate, authorize('admin'), getAllOrders);

/**
 * @swagger
 * /orders/track/{order_number}:
 *   get:
 *     summary: Track an order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: order_number
 *         required: true
 *         schema:
 *           type: string
 *         example: ORD-20241201120000-001
 *     responses:
 *       200:
 *         description: Order tracking info
 *       404:
 *         description: Order not found
 */
router.get('/track/:order_number', trackOrder);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order details
 *     tags: [Orders]
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
 *         description: Order details
 *       404:
 *         description: Order not found
 */
router.get('/:id', authenticate, getOrderDetails);

/**
 * @swagger
 * /orders/{id}/status:
 *   put:
 *     summary: Update order status (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, baking, out_for_delivery, delivered, cancelled]
 *               tracking_status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/:id/status', authenticate, authorize('admin'), updateOrderStatus);

module.exports = router;