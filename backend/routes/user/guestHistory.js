'use strict';
const express = require('express');
const router = express.Router();

// Import controllers
const {
    lookupOrders,
    getOrderDetail,
    cancelOrder
} = require('../../controllers/guestOrder.controller');

// Import validator và middleware
const { lookupSchema } = require('../../validators/guestOrder.validator');
const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ errors: [{ msg: error.details[0].message }] });
    }
    // Ghi đè req.body bằng dữ liệu đã được Joi validate và chuẩn hóa
    req.body = value;
    next();
};

// Định nghĩa các routes
router.post('/lookup', validate(lookupSchema), lookupOrders);
router.get('/:id', getOrderDetail);
router.post('/:id/cancel', cancelOrder);

module.exports = router;