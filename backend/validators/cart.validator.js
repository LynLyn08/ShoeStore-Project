// backend/validators/cart.validator.js
const Joi = require('joi');

const addItemToCartSchema = Joi.object({
  variantId: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base': 'ID biến thể sản phẩm phải là số',
      'any.required': 'ID biến thể sản phẩm là bắt buộc'
    }),
  quantity: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.min': 'Số lượng phải lớn hơn 0',
      'any.required': 'Số lượng là bắt buộc'
    })
});

const updateItemQuantitySchema = Joi.object({
    quantity: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.min': 'Số lượng phải lớn hơn 0',
      'any.required': 'Số lượng là bắt buộc'
    })
});

module.exports = {
  addItemToCartSchema,
  updateItemQuantitySchema
};