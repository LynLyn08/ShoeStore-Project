'use strict';
const express = require("express");
const router = express.Router();

// Import controller
const { changePassword } = require("../../controllers/auth.controller");

// Import middleware kiểm tra quyền admin
const checkAdmin = require('../../middleware/checkAdmin');

// Import validator
const { changePasswordSchema } = require('../../validators/auth.validator');
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }
    next();
};

// --- Định nghĩa Route ---
// POST /api/admin/auth/change-password
// Luồng xử lý: Request -> express-jwt (trong server.js) -> checkAdmin -> validate -> controller
router.post(
    "/change-password",
    checkAdmin,
    validate(changePasswordSchema),
    changePassword
);

module.exports = router;