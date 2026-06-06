const express = require('express');
const {
  getRFQs,
  getRFQById,
  createRFQ,
  updateRFQ,
  publishRFQ,
  closeRFQ,
  inviteVendors,
  getRFQVendors,
  getRFQQuotations,
  compareQuotations,
} = require('../controllers/rfq.controller');
const { authenticate } = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { rfqCreateSchema } = require('../validators/rfq.validator');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(authenticate);

// List/retrieve RFQs (vendors can list invited ones, officers/admins see all)
router.get('/', getRFQs);
router.get('/:id', getRFQById);

// Procurement Officer and Admin permissions
router.post('/', authorize([ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER]), validate(rfqCreateSchema), createRFQ);
router.put('/:id', authorize([ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER]), updateRFQ);
router.put('/:id/publish', authorize([ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER]), publishRFQ);
router.put('/:id/close', authorize([ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER]), closeRFQ);
router.post('/:id/invite-vendors', authorize([ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER]), inviteVendors);
router.get('/:id/vendors', authorize([ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER]), getRFQVendors);
router.get('/:id/quotations', authorize([ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER, ROLES.MANAGER]), getRFQQuotations);
router.get('/:id/quotations/compare', authorize([ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER, ROLES.MANAGER]), compareQuotations);

module.exports = router;
