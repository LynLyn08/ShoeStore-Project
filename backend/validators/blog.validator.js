'use strict';
const Joi = require('joi');

const blogSchema = Joi.object({
    Title: Joi.string().max(200).required().messages({
        'string.max': 'Tiêu đề không được vượt quá 200 ký tự.',
        'any.required': 'Tiêu đề là bắt buộc.'
    }),
    Content: Joi.string().required().messages({
        'any.required': 'Nội dung là bắt buộc.'
    }),
    Author: Joi.string().max(100).optional().allow(null, ''),
    IsActive: Joi.boolean().required().messages({
        'any.required': 'Trạng thái hoạt động là bắt buộc.'
    })
});

module.exports = {
    blogSchema
};