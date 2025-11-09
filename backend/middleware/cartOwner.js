'use strict';
const jwt = require('jsonwebtoken');
const db = require('../models');

/**
 * Middleware để xác định giỏ hàng của user hoặc guest.
 * Tìm hoặc tạo một giỏ hàng và gắn nó vào req.cart.
 */
const getCartOwner = async (req, res, next) => {
    try {
        let whereClause = {};
        let defaults = {};

        // 1. Ưu tiên user đã đăng nhập (qua token JWT)
        const authHeader = req.headers.authorization || "";
        if (authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded?.id) {
                    whereClause = { UserID: decoded.id };
                    defaults = { UserID: decoded.id };
                }
            } catch (err) {
                // Token không hợp lệ, tiếp tục xử lý như guest
                console.warn("Invalid JWT token provided for cart, treating as guest.");
            }
        }

        // 2. Nếu không phải user, tìm theo session ID của guest
        if (!whereClause.UserID) {
            const sessionId = req.headers["x-session-id"];
            if (!sessionId) {
                return res.status(400).json({ success: false, message: "Thiếu token JWT hoặc X-Session-ID." });
            }
            whereClause = { SessionID: sessionId };
            defaults = { SessionID: sessionId };
        }
        
        // 3. Sử dụng findOrCreate của Sequelize
        const [cart, created] = await db.Cart.findOrCreate({
            where: whereClause,
            defaults: defaults
        });

        req.cart = cart; // Gắn cart vào request
        next();

    } catch (error) {
        console.error("Cart owner middleware error:", error);
        return res.status(500).json({ success: false, message: "Lỗi khi xác định giỏ hàng." });
    }
};

module.exports = getCartOwner;