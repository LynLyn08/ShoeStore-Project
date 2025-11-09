'use strict';
const express = require('express');
const router = express.Router();

// Middlewares
const checkAdmin = require('../../middleware/checkAdmin');

// Controllers
const {
    getAllReviewsAdmin,
    getReviewByIdAdmin,
    deleteReview
} = require('../../controllers/review.controller');

// Áp dụng middleware checkAdmin cho tất cả các route
router.use(checkAdmin);

// Định nghĩa các routes
router.get('/', getAllReviewsAdmin);
router.get('/:id', getReviewByIdAdmin);
router.delete('/:id', deleteReview);

module.exports = router;