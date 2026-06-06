const express = require('express');
const {
  getQuotations,
  getMyQuotations,
  getQuotationById,
  submitQuotation,
  updateQuotation,
  withdrawQuotation,
} = require('../controllers/quotation.controller');
const { authenticate } = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { quotationCreateSchema } = require('../validators/quotation.validator');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(authenticate);

// General listing and detail retrieval (authorized per-role inside controller)
router.get('/', getQuotations);
router.get('/mine', authorize([ROLES.VENDOR]), getMyQuotations);
router.get('/:id', getQuotationById);

// Vendor-only submission and modification
router.post('/', authorize([ROLES.VENDOR]), validate(quotationCreateSchema), submitQuotation);
router.put('/:id', authorize([ROLES.VENDOR]), updateQuotation);
router.put('/:id/withdraw', authorize([ROLES.VENDOR]), withdrawQuotation);

module.exports = router;
