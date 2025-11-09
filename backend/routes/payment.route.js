// backend/routes/payment.route.js
'use strict';
const express = require('express');
const router = express.Router();
const { vnpayIpnHandler } = require('../controllers/payment.controller');

// VNPAY sẽ gọi vào URL này để báo kết quả thanh toán
router.get('/vnpay_ipn', vnpayIpnHandler);

module.exports = router;