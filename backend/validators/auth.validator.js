'use strict';
const Joi = require('joi');

const changePasswordSchema = Joi.object({
    oldPassword: Joi.string().required().messages({
        'any.required': 'Mật khẩu cũ là bắt buộc.'
    }),
    newPassword: Joi.string().min(8).required().messages({
        'string.min': 'Mật khẩu mới phải có ít nhất 8 ký tự.',
        'any.required': 'Mật khẩu mới là bắt buộc.'
    })
});

module.exports = {
    changePasswordSchema
};