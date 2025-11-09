'use strict';
const express = require('express');
const router = express.Router();

// Import controller
const {
    getAllAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
} = require('../../controllers/address.controller');

// Import middleware xác thực
const authenticateToken = require('../../middleware/auth.middleware');

// Import validator và middleware validate
const { addressSchema } = require('../../validators/address.validator');
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

// Áp dụng middleware xác thực cho tất cả các route bên dưới
router.use(authenticateToken);

// Định nghĩa các routes
router.get('/', getAllAddresses);
router.post('/', validate(addressSchema), createAddress);
router.patch('/:id', validate(addressSchema), updateAddress); // Joi schema mặc định cho phép các trường optional
router.delete('/:id', deleteAddress);
router.patch('/:id/default', setDefaultAddress);

module.exports = router;