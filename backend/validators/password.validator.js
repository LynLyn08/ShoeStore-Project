'use strict';
const Joi = require('joi');

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email không đúng định dạng.',
        'any.required': 'Email là bắt buộc.'
    })
});

const resetPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required().messages({
        'string.length': 'OTP phải có 6 chữ số.'
    }),
    newPassword: Joi.string().min(8).required().messages({
        'string.min': 'Mật khẩu mới phải có ít nhất 8 ký tự.'
    })
});
const changePasswordSchema = Joi.object({
    oldPassword: Joi.string().required().messages({
        'any.required': 'Mật khẩu hiện tại là bắt buộc.'
    }),
    newPassword: Joi.string()
        .min(8)
        // Thêm regex giống frontend nếu cần
        // .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\w\\s]).{8,}$')) 
        .required()
        .messages({
            'string.min': 'Mật khẩu mới phải có ít nhất 8 ký tự.',
            // 'string.pattern.base': 'Mật khẩu mới phải có chữ HOA, thường, số, và ký tự đặc biệt.',
            'any.required': 'Mật khẩu mới là bắt buộc.'
    })
});
module.exports = {
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema
};