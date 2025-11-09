'use strict';
const express = require('express');
const router = express.Router();

// 1. Import cả hai controller
const productController = require('../../controllers/product.controller');
const reviewController = require('../../controllers/review.controller');

// 2. Import middleware (lấy từ file server.js và profile.js của bạn)
const { expressjwt } = require('express-jwt');
const multer = require('multer'); // Import multer
const path = require('path');

// 3. Cấu hình Multer (lấy từ server.js của bạn)
// (Chúng ta cần định nghĩa nó ở đây để route 'createReview' có thể sử dụng)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// 4. Khởi tạo middleware
const authenticateUser = expressjwt({ secret: process.env.JWT_SECRET, algorithms: ['HS256'] });
// Middleware xử lý req.user (lấy từ server.js của bạn)
const userAuthMiddleware = (req, res, next) => { if(req.auth) req.user = req.auth; next(); };


// === CÁC ROUTE SẢN PHẨM (Không đổi) ===
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.get('/:id/variants', productController.getProductVariants); 

// === CÁC ROUTE ĐÁNH GIÁ (SỬA VÀ THÊM MỚI) ===

// Lấy danh sách review (Public) - Trỏ đến reviewController
router.get('/:productId/reviews', reviewController.getProductReviews);

// Kiểm tra quyền review (Private)
router.get(
    '/:productId/check-review', 
    authenticateUser, 
    userAuthMiddleware, // Thêm middleware này
    reviewController.checkReviewEligibility
);

// Tạo review mới (Private, cần upload media)
router.post(
    '/:productId/reviews', 
    authenticateUser, 
    userAuthMiddleware, // Thêm middleware này
    upload.array('media', 5), // Tên field là 'media', tối đa 5 files
    reviewController.createReview
);

module.exports = router;