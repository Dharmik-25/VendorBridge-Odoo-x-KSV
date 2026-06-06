const express = require('express');
const {
  getActivityLogs,
  getMyActivityLogs,
  getEntityActivityLogs,
} = require('../controllers/activityLog.controller');
const { authenticate } = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(authenticate);

// View own logs (all users)
router.get('/mine', getMyActivityLogs);

// Admin / Procurement Officer access
router.get('/entity/:type/:id', authorize([ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER]), getEntityActivityLogs);

// Admin-only access to full logs
router.get('/', authorize([ROLES.ADMIN]), getActivityLogs);

module.exports = router;
