const db = require('../config/database');

// Generate unique order number
const generateOrderNumber = () => {
    const date = new Date();
    const timestamp = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0') +
        date.getHours().toString().padStart(2, '0') +
        date.getMinutes().toString().padStart(2, '0') +
        date.getSeconds().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
};

// Place order
const placeOrder = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { items, delivery_address, delivery_location_lat, delivery_location_lng } = req.body;
        const userId = req.user.userId;
        
        // Validate stock and calculate total
        let totalAmount = 0;
        const orderItems = [];
        
        for (const item of items) {
            const [products] = await connection.query(
                'SELECT id, name, price, quantity FROM products WHERE id = ? FOR UPDATE',
                [item.product_id]
            );
            
            if (products.length === 0) {
                throw new Error(`Product ${item.product_id} not found`);
            }
            
            const product = products[0];
            
            if (product.quantity < item.quantity) {
                throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity}`);
            }
            
            const subtotal = product.price * item.quantity;
            totalAmount += subtotal;
            
            orderItems.push({
                ...item,
                unit_price: product.price,
                subtotal
            });
        }
        
        // Create order
        const orderNumber = generateOrderNumber();
        const estimatedDeliveryTime = new Date();
        estimatedDeliveryTime.setHours(estimatedDeliveryTime.getHours() + 2); // 2 hours delivery estimate
        
        const [orderResult] = await connection.query(
            `INSERT INTO orders (order_number, user_id, total_amount, delivery_address, 
             delivery_location_lat, delivery_location_lng, estimated_delivery_time)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [orderNumber, userId, totalAmount, delivery_address, 
             delivery_location_lat, delivery_location_lng, estimatedDeliveryTime]
        );
        
        const orderId = orderResult.insertId;
        
        // Insert order items and update inventory
        for (const item of orderItems) {
            await connection.query(
                `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
                 VALUES (?, ?, ?, ?, ?)`,
                [orderId, item.product_id, item.quantity, item.unit_price, item.subtotal]
            );
            
            // Get current quantity before update
            const [current] = await connection.query(
                'SELECT quantity FROM products WHERE id = ?',
                [item.product_id]
            );
            const oldQuantity = current[0].quantity;
            const newQuantity = oldQuantity - item.quantity;
            
            // Update product quantity
            await connection.query(
                'UPDATE products SET quantity = ? WHERE id = ?',
                [newQuantity, item.product_id]
            );
            
            // Log inventory transaction
            await connection.query(
                `INSERT INTO inventory_transactions (product_id, transaction_type, quantity_change, previous_quantity, new_quantity, reference_id, notes)
                 VALUES (?, 'sale', ?, ?, ?, ?, 'Order placed')`,
                [item.product_id, -item.quantity, oldQuantity, newQuantity, orderId]
            );
        }
        
        await connection.commit();
        
        res.status(201).json({
            message: 'Order placed successfully',
            order: {
                id: orderId,
                order_number: orderNumber,
                total_amount: totalAmount,
                estimated_delivery_time: estimatedDeliveryTime,
                status: 'pending'
            }
        });
        
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(400).json({ error: error.message || 'Failed to place order' });
    } finally {
        connection.release();
    }
};

// Get user orders
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const [orders] = await db.query(
            `SELECT o.*, 
                    COUNT(oi.id) as item_count
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             WHERE o.user_id = ?
             GROUP BY o.id
             ORDER BY o.placed_at DESC`,
            [userId]
        );
        
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

// Get order details
const getOrderDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const isAdmin = req.user.role === 'admin';
        
        let query = `
            SELECT o.*, 
                   u.username, u.email, u.first_name, u.last_name, u.phone
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.id = ?
        `;
        const params = [id];
        
        if (!isAdmin) {
            query += ' AND o.user_id = ?';
            params.push(userId);
        }
        
        const [orders] = await db.query(query, params);
        
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        const [items] = await db.query(
            `SELECT oi.*, p.name, p.image_url
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?`,
            [id]
        );
        
        res.json({
            ...orders[0],
            items
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
};

// Update order status (Admin only)
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, tracking_status } = req.body;
        
        const validStatuses = ['pending', 'processing', 'baking', 'out_for_delivery', 'delivered', 'cancelled'];
        
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        let updateFields = [];
        const params = [];
        
        if (status) {
            updateFields.push('status = ?');
            params.push(status);
        }
        
        if (tracking_status) {
            updateFields.push('tracking_status = ?');
            params.push(tracking_status);
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        params.push(id);
        
        const [result] = await db.query(
            `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
            params
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
};

// Track order
const trackOrder = async (req, res) => {
    try {
        const { order_number } = req.params;
        
        const [orders] = await db.query(
            `SELECT id, order_number, status, tracking_status, estimated_delivery_time, placed_at
             FROM orders WHERE order_number = ?`,
            [order_number]
        );
        
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        const order = orders[0];
        
        // Calculate time remaining if not delivered
        let timeRemaining = null;
        if (order.status !== 'delivered' && order.estimated_delivery_time) {
            const now = new Date();
            const estimated = new Date(order.estimated_delivery_time);
            if (estimated > now) {
                const diffMs = estimated - now;
                const diffMins = Math.floor(diffMs / 60000);
                timeRemaining = `${diffMins} minutes`;
            }
        }
        
        // Get status history/updates (could be extended)
        const [updates] = await db.query(
            `SELECT status, tracking_status, updated_at 
             FROM orders 
             WHERE id = ?`,
            [order.id]
        );
        
        res.json({
            order_number: order.order_number,
            status: order.status,
            tracking_status: order.tracking_status || 'Order confirmed',
            estimated_delivery_time: order.estimated_delivery_time,
            placed_at: order.placed_at,
            time_remaining: timeRemaining,
            updates: updates[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to track order' });
    }
};

// Get all orders (Admin only)
const getAllOrders = async (req, res) => {
    try {
        const { status, start_date, end_date, limit, offset } = req.query;
        
        let query = `
            SELECT o.*, u.username, u.email,
                   COUNT(oi.id) as item_count
            FROM orders o
            JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE 1=1
        `;
        const params = [];
        
        if (status) {
            query += ' AND o.status = ?';
            params.push(status);
        }
        
        if (start_date) {
            query += ' AND DATE(o.placed_at) >= ?';
            params.push(start_date);
        }
        
        if (end_date) {
            query += ' AND DATE(o.placed_at) <= ?';
            params.push(end_date);
        }
        
        query += ' GROUP BY o.id ORDER BY o.placed_at DESC';
        
        const limitNum = parseInt(limit) || 20;
        const offsetNum = parseInt(offset) || 0;
        query += ' LIMIT ? OFFSET ?';
        params.push(limitNum, offsetNum);
        
        const [orders] = await db.query(query, params);
        
        // Get total count
        const [countResult] = await db.query(
            'SELECT COUNT(*) as total FROM orders' +
            (status ? ' WHERE status = ?' : ''),
            status ? [status] : []
        );
        
        res.json({
            orders,
            pagination: {
                total: countResult[0].total,
                limit: limitNum,
                offset: offsetNum
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

module.exports = {
    placeOrder,
    getUserOrders,
    getOrderDetails,
    updateOrderStatus,
    trackOrder,
    getAllOrders
};