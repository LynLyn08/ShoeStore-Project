'use strict';
const Joi = require('joi');

// --- Schemas cho User ---

// Schema cho người dùng tự đăng ký
const registerSchema = Joi.object({
  Username: Joi.string().alphanum().min(3).max(50).required().messages({
    'string.alphanum': 'Tên đăng nhập chỉ được chứa chữ và số.',
    'string.min': 'Tên đăng nhập phải có ít nhất 3 ký tự.',
    'string.max': 'Tên đăng nhập không được vượt quá 50 ký tự.',
    'any.required': 'Tên đăng nhập là bắt buộc.'
  }),
  Email: Joi.string().email().max(100).required().messages({
    'string.email': 'Email không hợp lệ.',
    'any.required': 'Email là bắt buộc.'
  }),
  Password: Joi.string().min(6).required().messages({
    'string.min': 'Mật khẩu phải có ít nhất 6 ký tự.',
    'any.required': 'Mật khẩu là bắt buộc.'
  }),
  FullName: Joi.string().max(100).optional().allow(null, ''),
  Phone: Joi.string().pattern(/^0(3|5|7|8|9)\d{8}$/).optional().allow(null, '').messages({
        'string.pattern.base': 'Số điện thoại không hợp lệ (nếu có nhập).'
    }),  
    Address: Joi.string().min(5).max(255).optional().allow(null, '').messages({
        'string.min': 'Địa chỉ phải có ít nhất 5 ký tự (nếu có nhập).'
    })
});

// Schema cho đăng nhập (cho cả user và admin)
const loginSchema = Joi.object({
  identifier: Joi.string().required().messages({
    'any.required': 'Vui lòng nhập Username hoặc Email.'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Vui lòng nhập Mật khẩu.'
  }),
  remember: Joi.boolean().optional()
});


// --- Schemas cho Admin ---

// Schema khi admin tạo người dùng mới
const createUserByAdminSchema = Joi.object({
    Username: Joi.string().alphanum().min(3).max(50).required(),
    Email: Joi.string().email().max(100).required(),
    Password: Joi.string().min(6).required(),
    Role: Joi.string().valid('user', 'admin').required(),
    FullName: Joi.string().max(100).optional().allow(null, ''),
    Phone: Joi.string().max(20).optional().allow(null, ''),
    Address: Joi.string().max(255).optional().allow(null, '')
});

// Schema khi admin cập nhật người dùng
const updateUserByAdminSchema = Joi.object({
    Username: Joi.string().alphanum().min(3).max(50),
    Email: Joi.string().email().max(100),
    Role: Joi.string().valid('user', 'admin'),
    FullName: Joi.string().max(100).optional().allow(null, ''),
    Phone: Joi.string().max(20).optional().allow(null, ''),
    Address: Joi.string().max(255).optional().allow(null, ''),
    TwoFactorEnabled: Joi.boolean()
}).min(1).messages({ // Yêu cầu có ít nhất một trường để cập nhật
    'object.min': 'Phải có ít nhất một trường thông tin để cập nhật.'
});

// Schema khi admin reset mật khẩu cho người dùng
const resetPasswordByAdminSchema = Joi.object({
    newPassword: Joi.string().min(6).required().messages({
        'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự.',
        'any.required': 'Mật khẩu mới là bắt buộc.'
    })
});


// --- Exports ---
module.exports = {
  // User schemas
  registerSchema,
  loginSchema,
  // Admin schemas
  createUserByAdminSchema,
  updateUserByAdminSchema,
  resetPasswordByAdminSchema
};