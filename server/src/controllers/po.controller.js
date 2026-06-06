const prisma = require('../config/prisma');
const { success, error } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { logActivity } = require('../services/activityLogService');

/**
 * GET /api/purchase-orders
 */
const getPurchaseOrders = async (req, res) => {
  const { status } = req.query;
  const { skip, take, page, limit } = getPagination(req.query);

  const where = {};

  if (req.user.role === 'vendor') {
    if (!req.user.vendorId) {
      return error(res, 'User is not a registered vendor', 400, 'BAD_REQUEST');
    }
    where.vendorId = req.user.vendorId;
  }

  if (status) {
    where.status = status;
  }

  const [pos, total] = await prisma.$transaction([
    prisma.purchaseOrder.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: { select: { id: true, name: true, category: true } },
        rfq: { select: { id: true, title: true } },
        invoice: { select: { id: true, invoiceNumber: true, status: true } },
      },
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return success(
    res,
    pos,
    'Purchase Orders retrieved successfully',
    200,
    buildPaginationMeta(total, page, limit)
  );
};

/**
 * GET /api/purchase-orders/mine
 */
const getMyPurchaseOrders = async (req, res) => {
  if (req.user.role !== 'vendor' || !req.user.vendorId) {
    return error(res, 'User is not a registered vendor', 400, 'BAD_REQUEST');
  }

  const { skip, take, page, limit } = getPagination(req.query);

  const [pos, total] = await prisma.$transaction([
    prisma.purchaseOrder.findMany({
      where: { vendorId: req.user.vendorId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        rfq: { select: { id: true, title: true } },
        invoice: { select: { id: true, invoiceNumber: true, status: true } },
      },
    }),
    prisma.purchaseOrder.count({ where: { vendorId: req.user.vendorId } }),
  ]);

  return success(
    res,
    pos,
    'My Purchase Orders retrieved successfully',
    200,
    buildPaginationMeta(total, page, limit)
  );
};

/**
 * GET /api/purchase-orders/:id
 */
const getPurchaseOrderById = async (req, res) => {
  const { id } = req.params;

  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      vendor: true,
      rfq: { select: { id: true, title: true, description: true } },
      items: true,
      invoice: true,
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!po) {
    return error(res, 'Purchase Order not found', 404, 'NOT_FOUND');
  }

  // Security guard: vendor can only view their own PO
  if (req.user.role === 'vendor' && po.vendorId !== req.user.vendorId) {
    return error(res, 'Access denied. You do not own this Purchase Order', 403, 'FORBIDDEN');
  }

  return success(res, po, 'Purchase Order retrieved successfully');
};

/**
 * PUT /api/purchase-orders/:id/acknowledge
 */
const acknowledgePurchaseOrder = async (req, res) => {
  const { id } = req.params;

  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po) {
    return error(res, 'Purchase Order not found', 404, 'NOT_FOUND');
  }

  if (req.user.role === 'vendor' && po.vendorId !== req.user.vendorId) {
    return error(res, 'Access denied. You do not own this Purchase Order', 403, 'FORBIDDEN');
  }

  if (po.status !== 'generated') {
    return error(res, `Purchase Order is already ${po.status}`, 400, 'BAD_REQUEST');
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: { status: 'acknowledged' },
  });

  await logActivity(
    req.user.id,
    'ACKNOWLEDGE_PO',
    'PurchaseOrder',
    id,
    { poNumber: po.poNumber },
    req.ip
  );

  return success(res, updated, 'Purchase Order acknowledged successfully');
};

module.exports = {
  getPurchaseOrders,
  getMyPurchaseOrders,
  getPurchaseOrderById,
  acknowledgePurchaseOrder,
};
