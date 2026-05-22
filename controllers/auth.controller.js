const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        console.log('=== REGISTER START ===');
        console.log('Request body:', req.body);
        
        const { username, email, password, first_name, last_name, phone, address } = req.body;
        
        // Check if user exists
        const [existing] = await db.query(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'User with this email or username already exists' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        console.log('Password hashed successfully');
        
        // Insert user
        const [result] = await db.query(
            `INSERT INTO users (username, email, password_hash, first_name, last_name, phone, address, role)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'customer')`,
            [username, email, hashedPassword, first_name, last_name, phone, address]
        );
        
        // Generate token
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET not defined');
        }
        
        const token = jwt.sign(
            { id: result.insertId, username, role: 'customer' },
            secret,
            { expiresIn: '7d' }
        );
        
        console.log('=== REGISTER SUCCESS ===');
        
        res.status(201).json({
            message: 'Registration successful',
            token,
            user: { id: result.insertId, username, email, role: 'customer' }
        });
    } catch (error) {
        console.error('=== REGISTER ERROR ===');
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        console.log('=== LOGIN START ===');
        console.log('Request body:', req.body);
        
        const { email, password } = req.body;
        
        // Get user
        const [users] = await db.query(
            'SELECT id, username, email, password_hash, role FROM users WHERE email = ?',
            [email]
        );
        
        if (users.length === 0) {
            console.log('User not found:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = users[0];
        console.log('User found:', user.username);
        
        // Check password
        const isValid = await bcrypt.compare(password, user.password_hash);
        console.log('Password valid:', isValid);
        
        if (!isValid) {
            console.log('Invalid password for user:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate token
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET not defined in environment variables');
        }
        
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            secret,
            { expiresIn: '7d' }
        );
        
        console.log('=== LOGIN SUCCESS ===');
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('=== LOGIN ERROR ===');
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { register, login };