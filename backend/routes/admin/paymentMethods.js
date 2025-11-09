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
    getAllPaymentMethods,
    getPaymentMethodById,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod
} = require('../../controllers/paymentMethod.controller');

// Validator
const { paymentMethodSchema } = require('../../validators/paymentMethod.validator');


// Áp dụng middleware checkAdmin cho tất cả các route
router.use(checkAdmin);


// Định nghĩa routes CRUD
router.get('/', getAllPaymentMethods);
router.get('/:id', getPaymentMethodById);
router.post('/', validate(paymentMethodSchema), createPaymentMethod);
router.put('/:id', validate(paymentMethodSchema), updatePaymentMethod);
router.delete('/:id', deletePaymentMethod);


module.exports = router;