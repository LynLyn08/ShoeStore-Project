// backend/routes/user/paymentMethods.js
'use strict';
const express = require('express');
const router = express.Router();

// Import controller mới
const { getActivePaymentMethods } = require('../../controllers/paymentMethod.controller');

// Định nghĩa route công khai
router.get('/', getActivePaymentMethods);

module.exports = router;