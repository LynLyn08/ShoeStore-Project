'use strict';
const express = require('express');
const authenticateToken = require('../../middleware/auth.middleware');

// Import controllers
const { placeOrder } = require('../../controllers/order.controller');
const { placeGuestOrder } = require('../../controllers/guestOrder.controller');

// Import validators
const { createOrderSchema } = require('../../validators/order.validator');
const { createGuestOrderSchema } = require('../../validators/guestOrder.validator');

const userOrdersRouter = express.Router();
const guestOrdersRouter = express.Router();

// Middleware chung để validate
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

// --- Route cho người dùng đã đăng nhập ---
userOrdersRouter.post(
    '/place',
    authenticateToken, // Cần đăng nhập
    validate(createOrderSchema),
    placeOrder
);

// --- Route cho khách vãng lai ---
guestOrdersRouter.post(
    '/place',
    validate(createGuestOrderSchema),
    placeGuestOrder
);

module.exports = { userOrdersRouter, guestOrdersRouter };