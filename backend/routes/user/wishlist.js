'use strict';
const express = require('express');
const router = express.Router();

// --- Import Middlewares ---
// Middleware bắt buộc đăng nhập
const authenticateToken = require('../../middleware/auth.middleware'); 
// Middleware KHÔNG bắt buộc đăng nhập
const authenticateTokenOptional = require('../../middleware/authenticateTokenOptional'); 

// --- Import Controllers ---
const {
    getWishlistIds,      // Lấy danh sách ID sản phẩm đã thích (nhẹ)
    checkWishlistStatus, // Kiểm tra 1 sản phẩm đã thích chưa
    toggleWishlist       // Thêm/bỏ thích một sản phẩm
} = require('../../controllers/wishlist.controller');

// --- Import Validator ---
const { wishlistSchema } = require('../../validators/wishlist.validator');
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    next();
};


// === ĐỊNH NGHĨA CÁC ROUTES ===

// Các route này có thể được gọi bởi cả khách và người dùng đã đăng nhập.
// Middleware `authenticateTokenOptional` sẽ cố gắng đọc user, nếu không có thì bỏ qua.
router.get('/', authenticateTokenOptional, getWishlistIds);
router.get('/check/:productId', authenticateTokenOptional, checkWishlistStatus);

// Route này bắt buộc phải đăng nhập để thực hiện hành động thêm/bỏ thích.
// Middleware `authenticateToken` sẽ trả về lỗi 401 nếu không có token hợp lệ.
router.post('/toggle', authenticateToken, validate(wishlistSchema), toggleWishlist);


module.exports = router;