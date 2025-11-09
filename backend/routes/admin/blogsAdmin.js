'use strict';
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Middlewares
const checkAdmin = require('../../middleware/checkAdmin');

// Controllers
const {
    getAllBlogsAdmin,
    getBlogByIdAdmin,
    createBlog,
    updateBlog,
    deleteBlog
} = require('../../controllers/blog.controller');

// Validator
const { blogSchema } = require('../../validators/blog.validator');
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ errors: [{ msg: error.details[0].message }] });
    next();
};

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.resolve(process.cwd(), 'uploads/blogs')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// Áp dụng middleware checkAdmin cho tất cả các route
router.use(checkAdmin);

// Định nghĩa routes CRUD
router.get('/', getAllBlogsAdmin);
router.get('/:id', getBlogByIdAdmin);
router.post('/', upload.single('image'), validate(blogSchema), createBlog);
router.put('/:id', upload.single('image'), validate(blogSchema), updateBlog);
router.delete('/:id', deleteBlog);

module.exports = router;