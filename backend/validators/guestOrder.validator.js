'use strict';
const Joi = require('joi');

// Schema cho một sản phẩm trong đơn hàng
const itemSchema = Joi.object({
    variantId: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().min(1).required(),
    price: Joi.number().min(0).required()
});

// Schema chính để tạo đơn hàng cho khách vãng lai
const createGuestOrderSchema = Joi.object({
    // --- THÔNG TIN KHÁCH HÀNG (đã được làm phẳng) ---
    fullName: Joi.string().trim().required().messages({
        'string.empty': `Họ và tên không được để trống`,
        'any.required': `Họ và tên là trường bắt buộc`
    }),
    phone: Joi.string().pattern(/^0\d{9}$/).required().messages({
        'string.pattern.base': `Số điện thoại phải bắt đầu bằng 0 và có 10 chữ số`,
        'string.empty': `Số điện thoại không được để trống`,
        'any.required': `Số điện thoại là trường bắt buộc`
    }),
    email: Joi.string().email().required().messages({
        'string.email': `Email không hợp lệ`,
        'string.empty': `Email không được để trống`,
        'any.required': `Email là trường bắt buộc`
    }),
    street: Joi.string().trim().required().messages({
        'string.empty': `Địa chỉ không được để trống`
    }),
    city: Joi.string().trim().required().messages({
        'string.empty': `Thành phố không được để trống`
    }),
    
    // --- THÔNG TIN ĐƠN HÀNG ---
    items: Joi.array().items(itemSchema).min(1).required().messages({
        'array.min': `Đơn hàng phải có ít nhất 1 sản phẩm`
    }),
    shippingProviderId: Joi.number().integer().positive().required().messages({
        'any.required': `Vui lòng chọn đơn vị vận chuyển`
    }),
    paymentMethod: Joi.string().required().messages({
        'any.required': `Vui lòng chọn phương thức thanh toán`
    }),
    totalAmount: Joi.number().min(0).required(),
    
    // --- TRƯỜNG TÙY CHỌN ---
    couponCode: Joi.string().allow(null, ''),
    shippingFee: Joi.number().min(0).optional(),
    
    // === SỬA LỖI: THÊM 2 TRƯỜNG MÀ FRONTEND GỬI LÊN ===
    source: Joi.string().optional().allow(null, ''),
    sessionId: Joi.string().optional().allow(null, '')
});


// Schema để tra cứu lịch sử đơn hàng của khách (giữ nguyên)
const lookupSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email không đúng định dạng.',
        'any.required': 'Email không được để trống.'
    }),
    phone: Joi.string().required().messages({
        'any.required': 'Số điện thoại không được để trống.'
    })
});


module.exports = {
    createGuestOrderSchema,
    lookupSchema
};