const express = require('express');
const {
  getDashboardStats,
  getSpendingSummary,
  getVendorPerformance,
  getMonthlyTrend,
} = require('../controllers/report.controller');
const { authenticate } = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(authenticate);

// Dashboard stats: adaptive per role, all roles can fetch
router.get('/dashboard-stats', getDashboardStats);

// Analytics reports: Admins, Managers, and Procurement Officers only
router.get('/spending-summary', authorize([ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER]), getSpendingSummary);
router.get('/vendor-performance', authorize([ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER]), getVendorPerformance);
router.get('/monthly-trend', authorize([ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER]), getMonthlyTrend);

module.exports = router;
