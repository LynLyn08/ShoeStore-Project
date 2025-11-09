'use strict';
const express = require('express');
const router = express.Router();

// Import controller
const { 
    getAllBlogs, 
    getBlogById 
} = require('../../controllers/blog.controller');

// Định nghĩa các routes
// GET /api/blogs -> Lấy danh sách blog
router.get('/', getAllBlogs);

// GET /api/blogs/:id -> Lấy chi tiết một blog
router.get('/:id', getBlogById);

module.exports = router;