'use strict';
const express = require('express');
const router = express.Router();

const { getHomePageData } = require('../../controllers/home.controller');

// GET /api/home
router.get('/', getHomePageData);

module.exports = router;