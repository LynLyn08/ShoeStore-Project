const Joi = require('joi');

const shippingProviderSchema = Joi.object({
  Code: Joi.string().max(20).uppercase().required(),
  Name: Joi.string().max(100).required(),
  IsActive: Joi.boolean().default(true),
  ConfigJson: Joi.string().optional().allow(null, '')
});

module.exports = { shippingProviderSchema };