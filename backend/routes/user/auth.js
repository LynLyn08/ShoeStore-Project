'use strict';
const express = require('express');
const router = express.Router();

// 1. Import controller chứa logic xử lý
const { register, login } = require('../../controllers/auth.controller');

// 2. Import các schema validation từ Joi
const { registerSchema, loginSchema } = require('../../validators/user.validator');

// 3. Tạo một middleware để sử dụng các schema trên
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => ({
      msg: detail.message,
      field: detail.context.key
    }));
    return res.status(400).json({ errors });
  }
  next();
};

// 4. Định nghĩa các routes
// Route '/register' sẽ đi qua middleware 'validate' trước, sau đó mới đến controller 'register'
router.post('/register', validate(registerSchema), register);

// Tương tự cho '/login'
router.post('/login', validate(loginSchema), login);

module.exports = router;