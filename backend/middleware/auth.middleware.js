'use strict';
const jwt = require('jsonwebtoken');

/**
 * Middleware để xác thực token JWT từ header 'Authorization'.
 * Nếu hợp lệ, nó sẽ giải mã payload và gắn vào req.user.
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Yêu cầu chưa được xác thực. Vui lòng đăng nhập.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, userPayload) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
        }
        // Gắn payload đã giải mã vào request, ví dụ: { id, role, ... }
        req.user = userPayload; 
        next();
    });
};

module.exports = authenticateToken;