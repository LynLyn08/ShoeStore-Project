'use strict';
const express = require("express");
const router = express.Router();

const { getProviders } = require('../../controllers/shipping.controller');

// GET /api/shipping/providers
router.get("/providers", getProviders);

module.exports = router;