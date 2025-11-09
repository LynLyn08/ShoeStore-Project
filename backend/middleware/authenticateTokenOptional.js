'use strict';
const jwt = require('jsonwebtoken');

/**
 * Middleware xác thực token JWT một cách "tùy chọn".
 * - Nếu token hợp lệ, giải mã và gắn payload vào req.user.
 * - Nếu token không có hoặc không hợp lệ, vẫn cho phép request đi tiếp mà không có req.user.
 */
const authenticateTokenOptional = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        // Không có token, cho đi tiếp
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, userPayload) => {
        if (!err) {
            // Token hợp lệ, gắn user vào request
            req.user = userPayload;
        }
        // Kể cả khi token lỗi, vẫn cho đi tiếp
        next();
    });
};

module.exports = authenticateTokenOptional;