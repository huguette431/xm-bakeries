const db = require('../config/database');

// Get all customers (Admin only)
const getAllCustomers = async (req, res) => {
    try {
        const { search, limit, offset } = req.query;
        
        let query = 'SELECT id, username, email, first_name, last_name, phone, address, created_at FROM users WHERE role = "customer"';
        const params = [];
        
        if (search) {
            query += ' AND (username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const limitNum = parseInt(limit) || 50;
        const offsetNum = parseInt(offset) || 0;
        query += ' LIMIT ? OFFSET ?';
        params.push(limitNum, offsetNum);
        
        const [users] = await db.query(query, params);
        
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
};

// Get customer by ID (Admin only)
const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [users] = await db.query(
            'SELECT id, username, email, first_name, last_name, phone, address, created_at FROM users WHERE id = ? AND role = "customer"',
            [id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        // Get customer order summary
        const [orders] = await db.query(
            `SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_spent 
             FROM orders WHERE user_id = ?`,
            [id]
        );
        
        res.json({
            ...users[0],
            order_summary: orders[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
};

// Update customer (Admin or self)
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, phone, address } = req.body;
        
        // Check authorization (admin or same user)
        if (req.user.role !== 'admin' && req.user.userId !== parseInt(id)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const [result] = await db.query(
            `UPDATE users 
             SET first_name = COALESCE(?, first_name),
                 last_name = COALESCE(?, last_name),
                 phone = COALESCE(?, phone),
                 address = COALESCE(?, address)
             WHERE id = ?`,
            [first_name, last_name, phone, address, id]
        );
        
        res.json({ message: 'Customer updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
};

// Get customer profile (self)
const getProfile = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, username, email, first_name, last_name, phone, address, role, created_at FROM users WHERE id = ?',
            [req.user.userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(users[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

module.exports = {
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    getProfile
};