'use strict';
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// 1. Import Controller (file 3)
const {
    getAllProductsAdmin,
    getProductByIdAdmin,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../../controllers/product.controller');

// 2. Import Validator (file 2)
const { 
    createProductByAdminSchema, 
    updateProductByAdminSchema 
} = require('../../validators/product.validator');

// 3. Cấu hình Multer (giống file "cũ" của bạn)
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ 
    storage, 
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ cho phép file hình ảnh!'), false);
        }
    }
});

// 4. Middleware Validate (để dùng Joi Validator - file 2)
const validate = (schema) => (req, res, next) => {
    // Joi (file 2) đã xử lý việc parse 'variants'
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
        const errors = error.details.map(detail => ({ msg: detail.message }));
        return res.status(400).json({ errors });
    }
    
    // Gán lại req.body với dữ liệu đã được parse (cho 'variants')
    req.body = value; 
    next();
};

// 5. Định nghĩa các Routes

// GET (danh sách)
router.get('/', getAllProductsAdmin);

// GET (chi tiết)
router.get('/:id', getProductByIdAdmin);

// POST (tạo mới)
router.post(
    '/', 
    upload.any(), // Dùng upload.any() để xử lý (colorImage_... và images)
    validate(createProductByAdminSchema), // Validate
    createProduct
);

// PUT (cập nhật) - ĐÂY LÀ ROUTE BỊ THIẾU
router.put(
    '/:id', 
    upload.any(), // Dùng upload.any()
    validate(updateProductByAdminSchema), // Validate
    updateProduct // Gọi hàm controller update
);

// DELETE (xóa)
router.delete('/:id', deleteProduct);

module.exports = router;