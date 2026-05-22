const db = require('../config/database');

// Create product (Admin only)
const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, quantity, image_url, min_stock_level } = req.body;
        
        const [result] = await db.query(
            `INSERT INTO products (name, description, price, category, quantity, image_url, min_stock_level)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, description, price, category, quantity, image_url, min_stock_level || 10]
        );
        
        // Log inventory transaction
        await db.query(
            `INSERT INTO inventory_transactions (product_id, transaction_type, quantity_change, previous_quantity, new_quantity, notes)
             VALUES (?, 'purchase', ?, 0, ?, 'Initial stock')`,
            [result.insertId, quantity, quantity]
        );
        
        res.status(201).json({ message: 'Product created successfully', productId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create product' });
    }
};

// Get all products with filters
const getProducts = async (req, res) => {
    try {
        const { category, min_price, max_price, min_quantity, search, sort_by, sort_order, limit, offset } = req.query;
        
        let query = 'SELECT * FROM products WHERE 1=1';
        const params = [];
        
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        
        if (min_price) {
            query += ' AND price >= ?';
            params.push(min_price);
        }
        
        if (max_price) {
            query += ' AND price <= ?';
            params.push(max_price);
        }
        
        if (min_quantity) {
            query += ' AND quantity >= ?';
            params.push(min_quantity);
        }
        
        if (search) {
            query += ' AND (name LIKE ? OR description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        // Sorting
        const allowedSortFields = ['price', 'name', 'quantity', 'created_at'];
        const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
        const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';
        query += ` ORDER BY ${sortField} ${sortDirection}`;
        
        // Pagination
        const limitNum = parseInt(limit) || 20;
        const offsetNum = parseInt(offset) || 0;
        query += ' LIMIT ? OFFSET ?';
        params.push(limitNum, offsetNum);
        
        const [products] = await db.query(query, params);
        
        // Get total count
        const [countResult] = await db.query(
            'SELECT COUNT(*) as total FROM products WHERE 1=1' + 
            (category ? ' AND category = ?' : '') +
            (min_price ? ' AND price >= ?' : '') +
            (max_price ? ' AND price <= ?' : ''),
            params.slice(0, -2)
        );
        
        res.json({
            products,
            pagination: {
                total: countResult[0].total,
                limit: limitNum,
                offset: offsetNum
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

// Get single product
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [products] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
        
        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(products[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};

// Update product (Admin only)
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, category, quantity, image_url, min_stock_level } = req.body;
        
        // Get current quantity for inventory tracking
        const [current] = await db.query('SELECT quantity FROM products WHERE id = ?', [id]);
        if (current.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const oldQuantity = current[0].quantity;
        
        const [result] = await db.query(
            `UPDATE products 
             SET name = COALESCE(?, name),
                 description = COALESCE(?, description),
                 price = COALESCE(?, price),
                 category = COALESCE(?, category),
                 quantity = COALESCE(?, quantity),
                 image_url = COALESCE(?, image_url),
                 min_stock_level = COALESCE(?, min_stock_level)
             WHERE id = ?`,
            [name, description, price, category, quantity, image_url, min_stock_level, id]
        );
        
        // Log inventory change if quantity changed
        if (quantity !== undefined && quantity !== oldQuantity) {
            await db.query(
                `INSERT INTO inventory_transactions (product_id, transaction_type, quantity_change, previous_quantity, new_quantity, notes)
                 VALUES (?, 'adjustment', ?, ?, ?, 'Manual update')`,
                [id, quantity - oldQuantity, oldQuantity, quantity]
            );
        }
        
        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update product' });
    }
};

// Delete product (Admin only)
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
};

// Get product categories
const getCategories = async (req, res) => {
    try {
        const [categories] = await db.query('SELECT DISTINCT category FROM products ORDER BY category');
        res.json(categories.map(c => c.category));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getCategories
};