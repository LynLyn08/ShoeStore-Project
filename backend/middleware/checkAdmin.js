'use strict';

const checkAdmin = (req, res, next) => {
    // Middleware này chạy SAU khi token đã được xác thực,
    // nên chúng ta có thể tin tưởng rằng req.user (hoặc req.auth) đã tồn tại.
    const user = req.user || req.auth;

    if (user && user.role === 'admin') {
        next(); // Nếu là admin, cho phép request đi tiếp
    } else {
        // Nếu không phải admin, trả về lỗi 403 Forbidden
        res.status(403).json({ success: false, errors: [{ msg: 'Quyền truy cập bị từ chối. Yêu cầu quyền quản trị viên.' }] });
    }
};

module.exports = checkAdmin;