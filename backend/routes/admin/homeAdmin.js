'use strict';
const express = require('express');
const router = express.Router();

// Import middleware kiểm tra quyền admin
const checkAdmin = require('../../middleware/checkAdmin');

// Import controller
const { 
    getDashboardStats,
    getPaginatedTopProducts,  
    getPaginatedLowStock      
} = require('../../controllers/dashboard.controller');

// Áp dụng checkAdmin cho tất cả
router.use(checkAdmin);

// GET /api/admin/home (Route chính cho stats và charts)
router.get('/', getDashboardStats);

// GET /api/admin/home/top-products
router.get('/top-products', getPaginatedTopProducts);

// GET /api/admin/home/low-stock
router.get('/low-stock', getPaginatedLowStock);

module.exports = router;