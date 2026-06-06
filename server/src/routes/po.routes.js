const express = require('express');
const {
  getPurchaseOrders,
  getMyPurchaseOrders,
  getPurchaseOrderById,
  acknowledgePurchaseOrder,
} = require('../controllers/po.controller');
const { authenticate } = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(authenticate);

router.get('/', getPurchaseOrders);
router.get('/mine', authorize([ROLES.VENDOR]), getMyPurchaseOrders);
router.get('/:id', getPurchaseOrderById);

router.put('/:id/acknowledge', authorize([ROLES.VENDOR]), acknowledgePurchaseOrder);

module.exports = router;
