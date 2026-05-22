const validateRegistration = (req, res, next) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email and password are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    next();
};

const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    next();
};

const validateProduct = (req, res, next) => {
    const { name, price, category, quantity } = req.body;
    if (!name || !price || !category || quantity === undefined) {
        return res.status(400).json({ error: 'Name, price, category and quantity are required' });
    }
    if (price <= 0) {
        return res.status(400).json({ error: 'Price must be greater than 0' });
    }
    next();
};

const validateOrder = (req, res, next) => {
    const { items, delivery_address } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Order must have at least one item' });
    }
    if (!delivery_address) {
        return res.status(400).json({ error: 'Delivery address is required' });
    }
    next();
};

module.exports = { validateRegistration, validateLogin, validateProduct, validateOrder };