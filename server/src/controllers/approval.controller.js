const prisma = require('../config/prisma');
const { success, error } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { logActivity } = require('../services/activityLogService');
const { generatePONumber } = require('../services/poNumberService');
const { TAX_RATE } = require('../config/constants');

/**
 * GET /api/approvals
 */
const getApprovals = async (req, res) => {
  const { status } = req.query;
  const { skip, take, page, limit } = getPagination(req.query);

  const where = {};

  if (status) {
    where.status = status;
  }

  const [approvals, total] = await prisma.$transaction([
    prisma.approval.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        approver: { select: { id: true, name: true, email: true } },
        quotation: {
          include: {
            rfq: { select: { id: true, title: true } },
            vendor: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.approval.count({ where }),
  ]);

  return success(
    res,
    approvals,
    'Approvals retrieved successfully',
    200,
    buildPaginationMeta(total, page, limit)
  );
};

/**
 * GET /api/approvals/pending
 */
const getPendingApprovals = async (req, res) => {
  const { skip, take, page, limit } = getPagination(req.query);

  const [approvals, total] = await prisma.$transaction([
    prisma.approval.findMany({
      where: { status: 'pending' },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        approver: { select: { id: true, name: true, email: true } },
        quotation: {
          include: {
            rfq: { select: { id: true, title: true } },
            vendor: { select: { id: true, name: true, rating: true } },
            items: { include: { rfqItem: true } },
          },
        },
      },
    }),
    prisma.approval.count({ where: { status: 'pending' } }),
  ]);

  return success(
    res,
    approvals,
    'Pending approvals retrieved successfully',
    200,
    buildPaginationMeta(total, page, limit)
  );
};

/**
 * GET /api/approvals/:id
 */
const getApprovalById = async (req, res) => {
  const { id } = req.params;

  const approval = await prisma.approval.findUnique({
    where: { id },
    include: {
      approver: { select: { id: true, name: true, email: true } },
      quotation: {
        include: {
          rfq: { select: { id: true, title: true, status: true, deadline: true } },
          vendor: { select: { id: true, name: true, email: true, phone: true, rating: true } },
          items: {
            include: {
              rfqItem: true,
            },
          },
        },
      },
    },
  });

  if (!approval) {
    return error(res, 'Approval request not found', 404, 'NOT_FOUND');
  }

  return success(res, approval, 'Approval request retrieved successfully');
};

/**
 * POST /api/approvals
 */
const requestApproval = async (req, res) => {
  const { quotationId, approverId } = req.body;

  // Verify quotation exists
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { rfq: true },
  });

  if (!quotation) {
    return error(res, 'Quotation not found', 404, 'NOT_FOUND');
  }

  // Check if there is already a pending or approved request for this RFQ or quotation
  const existingPending = await prisma.approval.findFirst({
    where: {
      quotationId,
      status: { in: ['pending', 'approved'] },
    },
  });

  if (existingPending) {
    return error(res, `An approval request is already ${existingPending.status} for this quotation`, 400, 'BAD_REQUEST');
  }

  // Verify approver exists and is a manager or admin
  const approver = await prisma.user.findUnique({ where: { id: approverId } });
  if (!approver || (approver.role !== 'manager' && approver.role !== 'admin')) {
    return error(res, 'Target approver must be a registered Manager or Admin', 400, 'BAD_REQUEST');
  }

  // Create approval request & set quotation status to under_review
  const approval = await prisma.$transaction(async (tx) => {
    await tx.quotation.update({
      where: { id: quotationId },
      data: { status: 'under_review' },
    });

    return await tx.approval.create({
      data: {
        quotationId,
        approverId,
        status: 'pending',
      },
    });
  });

  await logActivity(
    req.user.id,
    'REQUEST_APPROVAL',
    'Approval',
    approval.id,
    { quotationId, approverId },
    req.ip
  );

  return success(res, approval, 'Approval requested successfully', 201);
};

/**
 * PUT /api/approvals/:id/decide (Approve or Reject with remarks)
 */
const decideApproval = async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body; // status is either approved or rejected

  const approval = await prisma.approval.findUnique({
    where: { id },
    include: {
      quotation: {
        include: {
          items: {
            include: { rfqItem: true },
          },
        },
      },
    },
  });

  if (!approval) {
    return error(res, 'Approval request not found', 404, 'NOT_FOUND');
  }

  if (approval.status !== 'pending') {
    return error(res, `This approval request is already resolved (Status: ${approval.status})`, 400, 'BAD_REQUEST');
  }

  // Verify currently logged in user is the assigned approver (or admin)
  if (approval.approverId !== req.user.id && req.user.role !== 'admin') {
    return error(res, 'Access denied. You are not the assigned approver for this request', 403, 'FORBIDDEN');
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update the approval status
    const updatedApproval = await tx.approval.update({
      where: { id },
      data: {
        status,
        remarks,
        decidedAt: new Date(),
      },
    });

    const quotationStatus = status === 'approved' ? 'approved' : 'rejected';

    // 2. Update quotation status
    await tx.quotation.update({
      where: { id: approval.quotationId },
      data: { status: quotationStatus },
    });

    if (status === 'approved') {
      // 3. Update RFQ status to awarded
      await tx.rFQ.update({
        where: { id: approval.quotation.rfqId },
        data: { status: 'awarded' },
      });

      // 4. Automatically generate Purchase Order
      const poNumber = await generatePONumber();

      // Calculate totals
      const totalAmount = approval.quotation.items.reduce(
        (sum, item) => sum + parseFloat(item.unitPrice) * parseFloat(item.rfqItem.quantity),
        0
      );
      const taxAmount = totalAmount * TAX_RATE;
      const grandTotal = totalAmount + taxAmount;

      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          rfqId: approval.quotation.rfqId,
          quotationId: approval.quotation.id,
          poNumber,
          vendorId: approval.quotation.vendorId,
          totalAmount,
          taxAmount,
          grandTotal,
          createdById: req.user.id,
          status: 'generated',
        },
      });

      // Create snapshot PO items
      const poItemsData = approval.quotation.items.map((item) => {
        const qty = parseFloat(item.rfqItem.quantity);
        const price = parseFloat(item.unitPrice);
        return {
          poId: purchaseOrder.id,
          productName: item.rfqItem.productName,
          quantity: qty,
          unitPrice: price,
          totalPrice: qty * price,
        };
      });

      await tx.pOItem.createMany({
        data: poItemsData,
      });
    } else {
      // If rejected, set RFQ back to published so vendors can revise or others can be selected
      await tx.rFQ.update({
        where: { id: approval.quotation.rfqId },
        data: { status: 'published' },
      });
    }

    return updatedApproval;
  });

  await logActivity(
    req.user.id,
    status === 'approved' ? 'APPROVE_QUOTATION' : 'REJECT_QUOTATION',
    'Approval',
    id,
    { remarks, quotationId: approval.quotationId },
    req.ip
  );

  return success(res, result, `Approval request ${status} successfully`);
};

module.exports = {
  getApprovals,
  getPendingApprovals,
  getApprovalById,
  requestApproval,
  decideApproval,
};
