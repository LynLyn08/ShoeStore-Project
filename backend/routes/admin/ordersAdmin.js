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

// Validators
const { orderStatusSchema, trackingInfoSchema } = require('../../validators/order.validator');

// Controllers
const orderController = require('../../controllers/order.controller');
const guestOrderController = require('../../controllers/guestOrder.controller');


// Áp dụng middleware checkAdmin cho tất cả các route
router.use(checkAdmin);


// --- Main Route to get list of orders ---
router.get('/', (req, res) => {
    const { customerType } = req.query;
    if (customerType === 'user') {
        return orderController.getAllUserOrdersAdmin(req, res);
    }
    if (customerType === 'guest') {
        return guestOrderController.getAllGuestOrdersAdmin(req, res);
    }
    return res.status(400).json({ errors: [{ msg: 'Thiếu hoặc sai tham số customerType (user hoặc guest)' }] });
});

// --- Routes for specific order types ---

// SỬA: Thay đổi '/order/:id' thành '/user/:id' để khớp với frontend
router.get('/user/:id', orderController.getUserOrderDetailAdmin);
router.get('/guest/:id', guestOrderController.getGuestOrderDetailAdmin);

// SỬA: Thay đổi '/order/:id/status' thành '/user/:id/status'
router.put('/user/:id/status', validate(orderStatusSchema), orderController.updateOrderStatus);
router.put('/guest/:id/status', validate(orderStatusSchema), guestOrderController.updateGuestOrderStatus);

// SỬA: Thay đổi '/order/:id/tracking' thành '/user/:id/tracking'
router.put('/user/:id/tracking', validate(trackingInfoSchema), orderController.updateTrackingInfo);


module.exports = router;