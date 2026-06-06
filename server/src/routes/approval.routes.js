const express = require('express');
const {
  getApprovals,
  getPendingApprovals,
  getApprovalById,
  requestApproval,
  decideApproval,
} = require('../controllers/approval.controller');
const { authenticate } = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { approvalDecisionSchema } = require('../validators/approval.validator');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(authenticate);

// View and request approvals
router.get('/', authorize([ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER]), getApprovals);
router.get('/pending', authorize([ROLES.ADMIN, ROLES.MANAGER]), getPendingApprovals);
router.get('/:id', authorize([ROLES.ADMIN, ROLES.MANAGER, ROLES.PROCUREMENT_OFFICER]), getApprovalById);

router.post('/', authorize([ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER]), requestApproval);

// Resolution of approval requests (Admin and Manager only)
router.put('/:id/decide', authorize([ROLES.ADMIN, ROLES.MANAGER]), validate(approvalDecisionSchema), decideApproval);

module.exports = router;
