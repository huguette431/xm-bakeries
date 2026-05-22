const db = require('../config/database');

// Generate sales report
const getSalesReport = async (req, res) => {
    try {
        const { start_date, end_date, group_by = 'day' } = req.query;
        
        let dateFormat;
        switch (group_by) {
            case 'month':
                dateFormat = '%Y-%m';
                break;
            case 'week':
                dateFormat = '%Y-%u';
                break;
            default:
                dateFormat = '%Y-%m-%d';
        }
        
        let query = `
            SELECT 
                DATE_FORMAT(o.placed_at, ?) as period,
                COUNT(DISTINCT o.id) as total_orders,
                SUM(o.total_amount) as total_sales,
                SUM(oi.quantity) as total_quantity_sold,
                AVG(o.total_amount) as average_order_value
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.status = 'delivered'
        `;
        
        const params = [dateFormat];
        
        if (start_date) {
            query += ' AND DATE(o.placed_at) >= ?';
            params.push(start_date);
        }
        
        if (end_date) {
            query += ' AND DATE(o.placed_at) <= ?';
            params.push(end_date);
        }
        
        query += ' GROUP BY period ORDER BY period DESC';
        
        const [salesData] = await db.query(query, params);
        
        // Get top selling products
        const [topProducts] = await db.query(
            `SELECT 
                p.id, p.name, p.category,
                SUM(oi.quantity) as total_quantity,
                SUM(oi.subtotal) as total_revenue
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             JOIN orders o ON oi.order_id = o.id
             WHERE o.status = 'delivered'
             GROUP BY p.id, p.name, p.category
             ORDER BY total_revenue DESC
             LIMIT 10`
        );
        
        // Get sales by category
        const [salesByCategory] = await db.query(
            `SELECT 
                p.category,
                SUM(oi.quantity) as total_quantity,
                SUM(oi.subtotal) as total_revenue
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             JOIN orders o ON oi.order_id = o.id
             WHERE o.status = 'delivered'
             GROUP BY p.category
             ORDER BY total_revenue DESC`
        );
        
        res.json({
            summary: {
                total_periods: salesData.length,
                overall_sales: salesData.reduce((sum, d) => sum + parseFloat(d.total_sales), 0),
                overall_orders: salesData.reduce((sum, d) => sum + d.total_orders, 0)
            },
            sales_by_period: salesData,
            top_products: topProducts,
            sales_by_category: salesByCategory
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate sales report' });
    }
};

// Generate inventory report
const getInventoryReport = async (req, res) => {
    try {
        // Current inventory levels
        const [currentInventory] = await db.query(
            `SELECT 
                id, name, category, price, quantity, min_stock_level,
                CASE 
                    WHEN quantity <= 0 THEN 'Out of Stock'
                    WHEN quantity <= min_stock_level THEN 'Low Stock'
                    ELSE 'In Stock'
                END as stock_status
             FROM products
             ORDER BY quantity ASC`
        );
        
        // Low stock alerts
        const [lowStock] = await db.query(
            `SELECT id, name, category, quantity, min_stock_level
             FROM products
             WHERE quantity <= min_stock_level
             ORDER BY quantity ASC`
        );
        
        // Inventory turnover (last 30 days)
        const [turnover] = await db.query(
            `SELECT 
                p.id, p.name,
                COALESCE(SUM(oi.quantity), 0) as units_sold_30d,
                COALESCE(SUM(oi.subtotal), 0) as revenue_30d
             FROM products p
             LEFT JOIN order_items oi ON p.id = oi.product_id
             LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'delivered' 
                AND o.placed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
             GROUP BY p.id, p.name
             ORDER BY units_sold_30d DESC`
        );
        
        // Inventory transaction summary
        const [transactions] = await db.query(
            `SELECT 
                DATE(created_at) as date,
                transaction_type,
                COUNT(*) as transaction_count,
                SUM(quantity_change) as net_change
             FROM inventory_transactions
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
             GROUP BY DATE(created_at), transaction_type
             ORDER BY date DESC`
        );
        
        // Total inventory value
        const [totalValue] = await db.query(
            `SELECT 
                SUM(price * quantity) as total_inventory_value,
                COUNT(*) as total_products,
                SUM(CASE WHEN quantity <= min_stock_level THEN 1 ELSE 0 END) as products_low_stock,
                SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as products_out_of_stock
             FROM products`
        );
        
        res.json({
            summary: totalValue[0],
            current_inventory: currentInventory,
            low_stock_alerts: lowStock,
            inventory_turnover: turnover,
            recent_transactions: transactions
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate inventory report' });
    }
};

// Get inventory history for a product
const getInventoryHistory = async (req, res) => {
    try {
        const { product_id } = req.params;
        const { days = 30 } = req.query;
        
        const [history] = await db.query(
            `SELECT 
                id, transaction_type, quantity_change, previous_quantity, 
                new_quantity, reference_id, notes, created_at
             FROM inventory_transactions
             WHERE product_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
             ORDER BY created_at DESC`,
            [product_id, days]
        );
        
        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch inventory history' });
    }
};

// Get purchase history for a customer
const getCustomerPurchaseReport = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check authorization
        if (req.user.role !== 'admin' && req.user.userId !== parseInt(id)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const [orders] = await db.query(
            `SELECT 
                o.id, o.order_number, o.total_amount, o.status, o.placed_at,
                COUNT(oi.id) as item_count
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             WHERE o.user_id = ?
             GROUP BY o.id
             ORDER BY o.placed_at DESC`,
            [id]
        );
        
        const [summary] = await db.query(
            `SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(total_amount), 0) as total_spent,
                COALESCE(AVG(total_amount), 0) as average_order_value,
                COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders
             FROM orders
             WHERE user_id = ?`,
            [id]
        );
        
        // Favorite products
        const [favorites] = await db.query(
            `SELECT 
                p.id, p.name, p.category,
                COUNT(*) as times_ordered,
                SUM(oi.quantity) as total_quantity
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             JOIN orders o ON oi.order_id = o.id
             WHERE o.user_id = ?
             GROUP BY p.id, p.name, p.category
             ORDER BY times_ordered DESC
             LIMIT 10`,
            [id]
        );
        
        res.json({
            summary: summary[0],
            orders,
            favorite_products: favorites
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch purchase report' });
    }
};

module.exports = {
    getSalesReport,
    getInventoryReport,
    getInventoryHistory,
    getCustomerPurchaseReport
};