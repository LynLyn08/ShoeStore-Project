'use strict';
const Joi = require('joi');

// --- Schemas dùng chung ---

// Schema cho một biến thể (variant)
const variantSchema = Joi.object({
    size: Joi.string().max(20).required().messages({
        'any.required': 'Kích thước biến thể là bắt buộc.'
    }),
    color: Joi.string().max(50).required().messages({
        'any.required': 'Màu sắc biến thể là bắt buộc.'
    }),
    stockQuantity: Joi.number().integer().min(0).required().messages({
        'number.base': 'Số lượng tồn phải là số.',
        'number.min': 'Số lượng tồn không được âm.',
        'any.required': 'Số lượng tồn là bắt buộc.'
    }),
    sku: Joi.string().max(50).optional().allow(null, '')
});

// --- Schema cho Admin ---

// Custom validator để parse và kiểm tra chuỗi JSON 'variants'
const variantsJsonString = Joi.string().custom((value, helpers) => {
    try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            return helpers.message('Phải có ít nhất một biến thể sản phẩm.');
        }
        // Validate từng object trong mảng variants đã parse
        const { error } = Joi.array().items(variantSchema).validate(parsed);
        if (error) {
            // Ném lỗi chi tiết từ Joi để thông báo cho người dùng
            return helpers.message(error.details.map(d => d.message).join(', '));
        }
        return parsed; // Trả về giá trị đã parse thành công
    } catch (e) {
        return helpers.message('Dữ liệu "variants" không phải là một chuỗi JSON hợp lệ.');
    }
}).required();

// Schema khi Admin tạo sản phẩm mới
const createProductByAdminSchema = Joi.object({
    name: Joi.string().max(100).required().messages({
        'any.required': 'Tên sản phẩm là bắt buộc.'
    }),
    description: Joi.string().optional().allow(null, ''),
    price: Joi.number().positive().required().messages({
        'number.base': 'Giá sản phẩm phải là số.',
        'number.positive': 'Giá sản phẩm phải lớn hơn 0.',
        'any.required': 'Giá sản phẩm là bắt buộc.'
    }),
    discountPercent: Joi.number().min(0).max(100).default(0),
    categoryId: Joi.number().integer().required().messages({
        'any.required': 'Danh mục là bắt buộc.'
    }),
    variants: variantsJsonString
}).keys({ // <-- SỬA: Thêm .keys()
    // Cho phép các trường này tồn tại khi TẠO MỚI (vì form gửi lên cả 3)
    existingImages: Joi.string().optional().allow(null, ''),
    existingColorImages: Joi.string().optional().allow(null, '')
});

// Schema khi Admin cập nhật sản phẩm
const updateProductByAdminSchema = createProductByAdminSchema.keys({
    // Cho phép 2 trường này tồn tại (dưới dạng chuỗi JSON) khi cập nhật
    existingImages: Joi.string().optional().allow(null, ''),
    existingColorImages: Joi.string().optional().allow(null, '')
});
module.exports = {
    createProductByAdminSchema,
    updateProductByAdminSchema,
};