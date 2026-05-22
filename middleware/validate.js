const Joi = require('joi');

// Registration validation
const validateRegistration = (req, res, next) => {
    const schema = Joi.object({
        username: Joi.string().min(3).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        first_name: Joi.string().max(50),
        last_name: Joi.string().max(50),
        phone: Joi.string().pattern(/^[0-9]{10,15}$/),
        address: Joi.string().max(255)
    });
    
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};

// Login validation
const validateLogin = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    });
    
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};

// Product validation
const validateProduct = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(2).max(100).required(),
        description: Joi.string().max(500),
        price: Joi.number().positive().required(),
        category: Joi.string().required(),
        quantity: Joi.number().integer().min(0).required(),
        image_url: Joi.string().uri(),
        min_stock_level: Joi.number().integer().min(0)
    });
    
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};

// Order validation
const validateOrder = (req, res, next) => {
    const schema = Joi.object({
        items: Joi.array().items(
            Joi.object({
                product_id: Joi.number().integer().required(),
                quantity: Joi.number().integer().min(1).required()
            })
        ).min(1).required(),
        delivery_address: Joi.string().required(),
        delivery_location_lat: Joi.number().min(-90).max(90),
        delivery_location_lng: Joi.number().min(-180).max(180)
    });
    
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};

module.exports = {
    validateRegistration,
    validateLogin,
    validateProduct,
    validateOrder
};