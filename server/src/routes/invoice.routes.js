const express = require('express');
const {
  getInvoices,
  getInvoiceById,
  generateInvoice,
  getInvoicePDF,
  emailInvoice,
  markInvoiceAsPaid,
} = require('../controllers/invoice.controller');
const { authenticate } = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(authenticate);

router.get('/', getInvoices);
router.get('/:id', getInvoiceById);

// Procurement Officer / Admin only operations
router.post('/', authorize([ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER]), generateInvoice);
router.post('/:id/send-email', authorize([ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER]), emailInvoice);

// Stream invoice PDF (accessible to vendor if it's theirs, verified in controller)
router.get('/:id/pdf', getInvoicePDF);

// Admin only operations
router.put('/:id/mark-paid', authorize([ROLES.ADMIN]), markInvoiceAsPaid);

module.exports = router;
