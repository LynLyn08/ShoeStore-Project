'use strict';
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// --- Import Middlewares ---
// Middleware này sẽ được áp dụng cho TẤT CẢ các route trong file này.
const authenticateToken = require('../../middleware/auth.middleware');

// --- Import Controllers ---
const { getProfile, updateProfile } = require('../../controllers/profile.controller');
const { getUserOrders, getUserOrderDetail, cancelUserOrder } = require('../../controllers/order.controller');
// Hàm này lấy danh sách yêu thích có phân trang và đầy đủ thông tin sản phẩm.
const { getPaginatedWishlist } = require('../../controllers/wishlist.controller'); 

// --- Cấu hình Multer cho việc upload avatar ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.resolve(process.cwd(), 'uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ 
    storage, 
    limits: { fileSize: 2 * 1024 * 1024 }, // Giới hạn 2MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ cho phép file hình ảnh!'), false);
        }
    }
});

// === ÁP DỤNG MIDDLEWARE XÁC THỰC CHO TẤT CẢ CÁC ROUTE BÊN DƯỚI ===
router.use(authenticateToken);

// --- Profile Routes ---
router.get('/', getProfile);
// Middleware 'upload.single' sẽ xử lý file trước khi controller được gọi
router.put('/', upload.single('avatar'), updateProfile);

// --- Order History Routes (thuộc về Profile) ---
router.get('/orders', getUserOrders);
router.get('/orders/:id', getUserOrderDetail);
router.put('/orders/:id/cancel', cancelUserOrder);

// --- Wishlist Page Route (thuộc về Profile) ---
router.get('/wishlist', getPaginatedWishlist);

module.exports = router;