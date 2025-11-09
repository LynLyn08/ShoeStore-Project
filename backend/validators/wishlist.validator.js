const Joi = require('joi');

const wishlistSchema = Joi.object({
  productId: Joi.number().integer().required()
});

module.exports = { wishlistSchema };