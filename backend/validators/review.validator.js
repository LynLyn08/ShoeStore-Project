const Joi = require('joi');

const reviewSchema = Joi.object({
  productId: Joi.number().integer().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(500).optional().allow('', null)
});

module.exports = { reviewSchema };