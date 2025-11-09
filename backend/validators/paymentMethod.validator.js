'use strict';
const Joi = require('joi');

// Schema dùng cho cả việc tạo mới và cập nhật
const paymentMethodSchema = Joi.object({
    Code: Joi.string().uppercase().max(20).required().messages({
        'any.required': 'Mã phương thức là bắt buộc.'
    }),
    Name: Joi.string().min(2).max(100).required().messages({
        'string.min': 'Tên phương thức phải có ít nhất 2 ký tự.',
        'any.required': 'Tên phương thức là bắt buộc.'
    }),
    Type: Joi.string().valid('OFFLINE', 'ONLINE').required().messages({
        'any.only': 'Loại phương thức phải là OFFLINE hoặc ONLINE.',
        'any.required': 'Loại phương thức là bắt buộc.'
    }),
    Provider: Joi.string().max(50).optional().allow(null, ''),
    IsActive: Joi.boolean().default(true),
    ConfigJson: Joi.string().optional().allow(null, '')
});


module.exports = { 
    paymentMethodSchema 
};