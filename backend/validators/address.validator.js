// backend/validators/address.validator.js
const Joi = require('joi');

const addressSchema = Joi.object({
  FullName: Joi.string()
    .max(100)
    .required()
    .messages({
      'string.max': 'Họ tên không được vượt quá 100 ký tự',
      'any.required': 'Họ tên là bắt buộc'
    }),
  Phone: Joi.string()
    .pattern(/^[0-9]{10,11}$/)
    .required()
    .messages({
      'string.pattern.base': 'Số điện thoại không hợp lệ',
      'any.required': 'Số điện thoại là bắt buộc'
    }),
  Street: Joi.string()
    .max(255)
    .required()
    .messages({
      'string.max': 'Địa chỉ đường không được vượt quá 255 ký tự',
      'any.required': 'Địa chỉ đường là bắt buộc'
    }),
  City: Joi.string()
    .max(100)
    .required()
    .messages({
      'string.max': 'Thành phố không được vượt quá 100 ký tự',
      'any.required': 'Thành phố là bắt buộc'
    }),
  State: Joi.string().max(100).optional().allow(null, ''),
  Country: Joi.string().max(100).default('Việt Nam'),
  Email: Joi.string().email().max(100).optional().allow(null, ''),
  Note: Joi.string().max(255).optional().allow(null, ''),
  IsDefault: Joi.boolean().default(false)
});

module.exports = {
  addressSchema
};