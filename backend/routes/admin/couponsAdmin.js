'use strict';
const express = require('express');
const router = express.Router();

// Middlewares
const checkAdmin = require('../../middleware/checkAdmin');
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ errors: [{ msg: error.details[0].message }] });
    next();
};

// Controllers
const {
    getAllCouponsAdmin,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    getCustomerEmails,
    sendCouponToCustomers,
    getCouponUsage,        
    getCouponAssignments
} = require('../../controllers/coupon.controller');

// Validator
const { couponSchema } = require('../../validators/coupon.validator');

// Áp dụng middleware checkAdmin cho tất cả route
router.use(checkAdmin);

// Định nghĩa routes
router.get('/', getAllCouponsAdmin);
router.post('/', validate(couponSchema), createCoupon);
router.put('/:id', validate(couponSchema), updateCoupon);
router.delete('/:id', deleteCoupon);
// ===  2 ROUTE CHI TIẾT ===
router.get('/:id/usage', getCouponUsage);
router.get('/:id/assignments', getCouponAssignments);
// Routes cho nghiệp vụ email
router.get('/emails', getCustomerEmails);
router.post('/send-email', sendCouponToCustomers);

module.exports = router;