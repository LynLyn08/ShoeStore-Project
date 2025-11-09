'use strict';
const Joi = require('joi');

const categorySchema = Joi.object({
    Name: Joi.string().max(100).required().messages({
        'string.max': 'Tên danh mục không được vượt quá 100 ký tự',
        'any.required': 'Tên danh mục là bắt buộc'
    }),
    TargetGroup: Joi.string().valid('Men', 'Women', 'Kids', 'Unisex').required().messages({
        'any.only': 'Nhóm đối tượng không hợp lệ (chỉ chấp nhận Men, Women, Kids, Unisex)',
        'any.required': 'Nhóm đối tượng là bắt buộc'
    }),
    Description: Joi.string().max(255).optional().allow(null, ''),
    IsActive: Joi.boolean().optional() // Trạng thái sẽ được quản lý bởi API /toggle
});

module.exports = {
    categorySchema
};