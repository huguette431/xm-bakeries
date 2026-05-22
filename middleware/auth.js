const { verifyToken } = require('../utils/jwt');

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        
        // Support both `id` and `userId` from token
        req.user = {
            userId: decoded.userId || decoded.id,
            username: decoded.username,
            role: decoded.role
        };
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions' });
        }
        next();
    };
};

module.exports = { authenticate, authorize };