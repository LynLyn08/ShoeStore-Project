// backend/routes/user/coupons.js (file coupons.js)
'use strict';
const express = require('express');
const router = express.Router();

// Import controllers
const { listAvailableCoupons, validateCoupon, getUserVouchers } = require('../../controllers/coupon.controller');
const authenticateToken = require('../../middleware/auth.middleware'); 
const authenticateTokenOptional = require('../../middleware/authenticateTokenOptional'); // Đã thêm
const { checkCouponSchema } = require('../../validators/coupon.validator'); // Đã thêm

// --- Định nghĩa middleware validate ---
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};
// --- Kết thúc định nghĩa middleware validate ---

// Định nghĩa routes
router.get('/', listAvailableCoupons);

router.post(
    '/validate', 
    authenticateTokenOptional, 
    validate(checkCouponSchema), // Sẽ không còn báo lỗi ReferenceError ở đây
    validateCoupon
);

router.get('/vouchers', authenticateToken, getUserVouchers);


module.exports = router;