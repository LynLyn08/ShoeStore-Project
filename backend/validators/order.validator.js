// backend/validators/order.validator.js (đầy đủ, chỉ sửa createOrderSchema)

'use strict';
const Joi = require('joi');

// Schema cho một item trong đơn hàng khi tạo
const orderItemSchema = Joi.object({
    variantId: Joi.number().integer().required(),
    quantity: Joi.number().integer().min(1).required(),
    price: Joi.number().min(0).required()
});

// Schema cho người dùng khi đặt hàng
const createOrderSchema = Joi.object({
  shippingAddressId: Joi.number().integer().required(),
  items: Joi.array().items(orderItemSchema).min(1).required(),
  totalAmount: Joi.number().min(0).required(),
  paymentMethod: Joi.string().max(20).default('COD'),
  shippingProviderId: Joi.number().integer().optional().allow(null),
  shippingFee: Joi.number().min(0).optional().default(0),
  couponCode: Joi.string().max(50).optional().allow(null, ''),
  source: Joi.string().optional() // 'cart' or 'buy-now'
}).unknown(true);  // SỬA: Cho phép key thừa (e.g., subtotal nếu lỡ gửi) để tránh "not allowed"

// Schema cho Admin cập nhật trạng thái đơn hàng
const orderStatusSchema = Joi.object({
    Status: Joi.string().valid('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled').required().messages({
        'any.only': 'Trạng thái không hợp lệ.',
        'any.required': 'Trạng thái là bắt buộc.'
    })
});

// Schema cho Admin cập nhật thông tin vận đơn
const trackingInfoSchema = Joi.object({
    TrackingCode: Joi.string().alphanum().min(5).max(50).optional().allow(null, ''),
    ShippingProvider: Joi.string().min(2).max(30).optional().allow(null, '')
}).min(1).messages({ // Yêu cầu có ít nhất một trong hai trường
    'object.min': 'Phải cung cấp ít nhất mã vận đơn hoặc nhà cung cấp vận chuyển.'
});


module.exports = { 
    createOrderSchema,
    orderStatusSchema,
    trackingInfoSchema
};