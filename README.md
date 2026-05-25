# XM Bakeries API

![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![Express](https://img.shields.io/badge/Express-4.x-blue)
![MySQL](https://img.shields.io/badge/MySQL-8.x-orange)
![JWT](https://img.shields.io/badge/Auth-JWT-yellow)
![Swagger](https://img.shields.io/badge/Docs-Swagger-brightgreen)

A full-featured **E-commerce Backend API** for XM Bakeries, a bakery business located in Kigali City, Nyarugenge District, Gitega Sector. Built with Node.js, Express, and MySQL.

## 🚀 Live Demo

- **API Base URL:** https://xm-bakeries-4biq.onrender.com
- **Swagger UI:** https://xm-bakeries-4biq.onrender.com/api-docs
- **Health Check:** https://xm-bakeries-4biq.onrender.com/health

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)

---

## Overview

XM Bakeries needed a backend system to replace their manual Excel-based system. This API provides:

- Remote order placement for customers
- Real-time inventory tracking
- Automated sales and inventory reports
- Customer management
- Product search and filtering

---

## Features

### ✅ Week 1 — Planning & Setup
- Requirements analysis
- Database schema design (ERD)
- Node.js project setup
- MySQL connection with connection pooling
- All tables created

### ✅ Week 2 — Authentication & Authorization
- User registration with password hashing (bcrypt)
- JWT token-based login
- Role-based access control (Admin / Customer)
- Protected routes with middleware

### ✅ Week 3 — Product & Customer Management
- Full Product CRUD (Create, Read, Update, Delete)
- Customer CRUD operations
- Input validation middleware
- Swagger API documentation setup

### ✅ Week 4 — Orders System
- Place orders with stock validation
- Order items storage
- View orders (user and admin)
- Automatic inventory deduction on order placement
- Inventory transaction logging

### ✅ Week 5 — Search, Reports & Tracking
- Product search by name, category, price range, quantity
- Sort and filter products
- Sales reports (by day/week/month)
- Inventory reports with low stock alerts
- Order tracking with estimated delivery time
- Customer purchase history

### ✅ Week 6 — Swagger & Testing & Deployment
- Complete Swagger/OpenAPI 3.0 documentation
- All endpoints documented with examples
- API tested via Swagger UI
- Deployed on Render

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| MySQL2 | Database driver |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| Swagger UI | API documentation |
| Helmet | Security headers |
| CORS | Cross-origin requests |
| Morgan | HTTP request logging |
| Compression | Response compression |
| Joi | Input validation |
| dotenv | Environment variables |

---

## Database Schema

### Tables

**users**
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto increment |
| username | VARCHAR(50) | Unique username |
| email | VARCHAR(100) | Unique email |
| password_hash | VARCHAR(255) | Bcrypt hashed password |
| role | ENUM | 'admin' or 'customer' |
| first_name | VARCHAR(50) | First name |
| last_name | VARCHAR(50) | Last name |
| phone | VARCHAR(20) | Phone number |
| address | VARCHAR(255) | Address |
| created_at | TIMESTAMP | Registration date |

**products**
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto increment |
| name | VARCHAR(100) | Product name |
| description | TEXT | Product description |
| price | DECIMAL(10,2) | Price in RWF |
| category | VARCHAR(50) | Product category |
| quantity | INT | Stock quantity |
| min_stock_level | INT | Minimum stock alert level |
| image_url | VARCHAR(255) | Product image URL |

**orders**
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto increment |
| order_number | VARCHAR(50) | Unique order number |
| user_id | INT (FK) | Customer reference |
| total_amount | DECIMAL(10,2) | Total order amount |
| status | ENUM | pending/processing/baking/out_for_delivery/delivered/cancelled |
| delivery_address | VARCHAR(255) | Delivery address |
| estimated_delivery_time | DATETIME | Estimated delivery |
| placed_at | TIMESTAMP | Order placement time |

**order_items**
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto increment |
| order_id | INT (FK) | Order reference |
| product_id | INT (FK) | Product reference |
| quantity | INT | Quantity ordered |
| unit_price | DECIMAL(10,2) | Price at time of order |
| subtotal | DECIMAL(10,2) | Line total |

**inventory_transactions**
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto increment |
| product_id | INT (FK) | Product reference |
| transaction_type | ENUM | purchase/sale/adjustment/return |
| quantity_change | INT | Change in quantity |
| previous_quantity | INT | Stock before change |
| new_quantity | INT | Stock after change |
| notes | TEXT | Transaction notes |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register new customer | Public |
| POST | /api/auth/login | Login user | Public |

### Products
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/products | Get all products (filter/sort) | Public |
| GET | /api/products/:id | Get product by ID | Public |
| GET | /api/products/categories | Get all categories | Public |
| POST | /api/products | Create product | Admin |
| PUT | /api/products/:id | Update product | Admin |
| DELETE | /api/products/:id | Delete product | Admin |

### Orders
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/orders | Place an order | Customer |
| GET | /api/orders | Get my orders | Customer |
| GET | /api/orders/:id | Get order details | Customer/Admin |
| GET | /api/orders/track/:order_number | Track an order | Public |
| GET | /api/orders/all | Get all orders | Admin |
| PUT | /api/orders/:id/status | Update order status | Admin |

### Reports
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/reports/sales | Sales report | Admin |
| GET | /api/reports/inventory | Inventory report | Admin |
| GET | /api/reports/inventory/:id/history | Product inventory history | Admin |
| GET | /api/reports/customers/:id/purchases | Customer purchase report | Customer/Admin |

### Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/users/profile | Get my profile | Customer |
| PUT | /api/users/:id | Update customer | Customer/Admin |
| GET | /api/users | Get all customers | Admin |
| GET | /api/users/:id | Get customer by ID | Admin |

---

## Installation

### Prerequisites
- Node.js v18+
- MySQL 8.x
- npm

### Steps

```bash
# Clone the repository
git clone https://github.com/huguette431/xm-bakeries.git

# Navigate to project folder
cd xm-bakeries

# Install dependencies
npm install
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=xm_bakeries
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

---

## Database Setup

Run this SQL in MySQL to create the database and tables:

```sql
CREATE DATABASE IF NOT EXISTS xm_bakeries;
USE xm_bakeries;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    address VARCHAR(255),
    role ENUM('admin', 'customer') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    quantity INT DEFAULT 0,
    image_url VARCHAR(255),
    min_stock_level INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending','processing','baking','out_for_delivery','delivered','cancelled') DEFAULT 'pending',
    tracking_status VARCHAR(255),
    delivery_address VARCHAR(255) NOT NULL,
    delivery_location_lat DECIMAL(10,8),
    delivery_location_lng DECIMAL(11,8),
    estimated_delivery_time DATETIME,
    placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    transaction_type ENUM('purchase','sale','adjustment','return') NOT NULL,
    quantity_change INT NOT NULL,
    previous_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    reference_id INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

---

## Running the Application

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

Server runs at: `http://localhost:3000`

---

## API Documentation

Swagger UI is available at:
```
http://localhost:3000/api-docs
```

Live Swagger UI:
```
https://xm-bakeries-4biq.onrender.com/api-docs
```

---

## Testing

### Sample Test Flow
```bash
# 1. Register a user
POST /api/auth/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "0788888888",
  "address": "Kigali, Rwanda"
}

# 2. Login
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}

# 3. Use returned token in Authorization header:
# Bearer <your_token>

# 4. Place an order
POST /api/orders
{
  "items": [{"product_id": 1, "quantity": 2}],
  "delivery_address": "Kigali, Nyarugenge"
}

# 5. Track order
GET /api/orders/track/ORD-20260522110525-625
```

---

## Project Structure

```
xm-bakeries/
├── app.js                  # Express app setup
├── server.js               # Server entry point
├── package.json
├── .env                    # Environment variables
├── config/
│   ├── database.js         # MySQL connection
│   └── swagger.js          # Swagger configuration
├── controllers/
│   ├── auth.controller.js  # Register & login logic
│   ├── order.controller.js # Order management
│   ├── product.controller.js # Product management
│   ├── report.controller.js  # Reports generation
│   └── user.controller.js  # Customer management
├── middleware/
│   ├── auth.js             # JWT authentication
│   └── validation.js       # Input validation
├── routes/
│   ├── auth.routes.js      # /api/auth
│   ├── order.routes.js     # /api/orders
│   ├── product.routes.js   # /api/products
│   ├── report.routes.js    # /api/reports
│   └── user.routes.js      # /api/users
└── utils/
    ├── jwt.js              # Token generation/verification
    └── password.js         # Password hashing
```

---

## Author

**Huguette Manzi Keza**  
XM Bakeries Backend API — L5 Software Development Assignment  
GitHub: https://github.com/huguette431/xm-bakeries

---

## License

ISC
