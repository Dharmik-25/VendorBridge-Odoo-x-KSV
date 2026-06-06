const express = require('express');
const {
  getVendors,
  getMyVendorProfile,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  approveVendor,
  rejectVendor,
} = require('../controllers/vendor.controller');
const { authenticate } = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { vendorCreateSchema, vendorUpdateSchema } = require('../validators/vendor.validator');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(authenticate);

// Vendor profile access
router.get('/me', getMyVendorProfile);

// Admin / Procurement Officer access
router.get('/', authorize([ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER]), getVendors);
router.post('/', authorize([ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER]), validate(vendorCreateSchema), createVendor);
router.get('/:id', authorize([ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER]), getVendorById);
router.put('/:id', authorize([ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER]), validate(vendorUpdateSchema), updateVendor);

// Admin-only operations
router.delete('/:id', authorize([ROLES.ADMIN]), deleteVendor);
router.put('/:id/approve', authorize([ROLES.ADMIN]), approveVendor);
router.put('/:id/reject', authorize([ROLES.ADMIN]), rejectVendor);

module.exports = router;
