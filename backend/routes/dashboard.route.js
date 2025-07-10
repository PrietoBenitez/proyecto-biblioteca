const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

// GET /api/dashboard/counts
router.get('/counts', dashboardController.getDashboardCounts);

module.exports = router;
