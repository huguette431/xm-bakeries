require('dotenv').config();
const jwt = require('jsonwebtoken');

const generateToken = (userId, username, role) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    return jwt.sign(
        { userId, username, role },
        secret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

const verifyToken = (token) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    return jwt.verify(token, secret);
};

module.exports = { generateToken, verifyToken };