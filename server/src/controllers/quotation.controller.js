const prisma = require('../config/prisma');
const { success, error } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { logActivity } = require('../services/activityLogService');

/**
 * GET /api/quotations
 */
const getQuotations = async (req, res) => {
  const { rfqId, status } = req.query;
  const { skip, take, page, limit } = getPagination(req.query);

  const where = {};

  if (req.user.role === 'vendor') {
    if (!req.user.vendorId) {
      return error(res, 'User is not a registered vendor', 400, 'BAD_REQUEST');
    }
    where.vendorId = req.user.vendorId;
  }

  if (rfqId) {
    where.rfqId = rfqId;
  }

  if (status) {
    where.status = status;
  }

  const [quotations, total] = await prisma.$transaction([
    prisma.quotation.findMany({
      where,
      skip,
      take,
      orderBy: { submittedAt: 'desc' },
      include: {
        rfq: { select: { id: true, title: true, deadline: true, status: true } },
        vendor: { select: { id: true, name: true, category: true } },
      },
    }),
    prisma.quotation.count({ where }),
  ]);

  return success(
    res,
    quotations,
    'Quotations retrieved successfully',
    200,
    buildPaginationMeta(total, page, limit)
  );
};

/**
 * GET /api/quotations/mine
 */
const getMyQuotations = async (req, res) => {
  if (req.user.role !== 'vendor' || !req.user.vendorId) {
    return error(res, 'User is not a registered vendor', 400, 'BAD_REQUEST');
  }

  const { skip, take, page, limit } = getPagination(req.query);

  const [quotations, total] = await prisma.$transaction([
    prisma.quotation.findMany({
      where: { vendorId: req.user.vendorId },
      skip,
      take,
      orderBy: { submittedAt: 'desc' },
      include: {
        rfq: { select: { id: true, title: true, deadline: true, status: true } },
      },
    }),
    prisma.quotation.count({ where: { vendorId: req.user.vendorId } }),
  ]);

  return success(
    res,
    quotations,
    'My quotations retrieved successfully',
    200,
    buildPaginationMeta(total, page, limit)
  );
};

/**
 * GET /api/quotations/:id
 */
const getQuotationById = async (req, res) => {
  const { id } = req.params;

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      rfq: { select: { id: true, title: true, deadline: true, status: true } },
      vendor: { select: { id: true, name: true, email: true, phone: true, rating: true } },
      items: {
        include: {
          rfqItem: true,
        },
      },
    },
  });

  if (!quotation) {
    return error(res, 'Quotation not found', 404, 'NOT_FOUND');
  }

  // Security guard: vendor can only view their own quotation
  if (req.user.role === 'vendor' && quotation.vendorId !== req.user.vendorId) {
    return error(res, 'Access denied. You do not own this quotation', 403, 'FORBIDDEN');
  }

  return success(res, quotation, 'Quotation retrieved successfully');
};

/**
 * POST /api/quotations
 */
const submitQuotation = async (req, res) => {
  const { rfqId, notes, deliveryDays, items } = req.body;

  if (req.user.role !== 'vendor' || !req.user.vendorId) {
    return error(res, 'Only approved vendors can submit quotations', 403, 'FORBIDDEN');
  }

  const rfq = await prisma.rFQ.findUnique({
    where: { id: rfqId },
    include: { items: true, rfqVendors: true },
  });

  if (!rfq) {
    return error(res, 'RFQ not found', 404, 'NOT_FOUND');
  }

  // Verify vendor was actually invited
  const isInvited = rfq.rfqVendors.some((rv) => rv.vendorId === req.user.vendorId);
  if (!isInvited) {
    return error(res, 'You are not invited to submit a quotation for this RFQ', 403, 'FORBIDDEN');
  }

  // Verify RFQ is still open/published and deadline has not passed
  if (rfq.status !== 'published') {
    return error(res, `RFQ is not in active submission state (Status: ${rfq.status})`, 400, 'BAD_REQUEST');
  }

  if (new Date() > new Date(rfq.deadline)) {
    return error(res, 'Submission deadline for this RFQ has already passed', 400, 'BAD_REQUEST');
  }

  // Check if they already submitted a quotation
  const existingQuote = await prisma.quotation.findUnique({
    where: {
      rfqId_vendorId: {
        rfqId,
        vendorId: req.user.vendorId,
      },
    },
  });

  if (existingQuote) {
    return error(res, 'You have already submitted a quotation for this RFQ. Use PUT to modify it.', 400, 'BAD_REQUEST');
  }

  // Create quotation & quotation items
  const quotation = await prisma.$transaction(async (tx) => {
    const quote = await tx.quotation.create({
      data: {
        rfqId,
        vendorId: req.user.vendorId,
        notes,
        deliveryDays,
        status: 'submitted',
      },
    });

    // We need to calculate unitPrice * rfqItem.quantity for the totalPrice
    const quotationItemsData = [];
    for (const item of items) {
      const rfqItem = rfq.items.find((i) => i.id === item.rfqItemId);
      if (!rfqItem) {
        throw new Error(`RFQ Item ${item.rfqItemId} not found on this RFQ`);
      }
      
      const qty = parseFloat(rfqItem.quantity);
      const price = parseFloat(item.unitPrice);
      const totalPrice = qty * price;

      quotationItemsData.push({
        quotationId: quote.id,
        rfqItemId: item.rfqItemId,
        unitPrice: price,
        totalPrice: totalPrice,
      });
    }

    await tx.quotationItem.createMany({
      data: quotationItemsData,
    });

    return quote;
  });

  await logActivity(
    req.user.id,
    'SUBMIT_QUOTATION',
    'Quotation',
    quotation.id,
    { rfqId, deliveryDays, noteLength: notes?.length || 0 },
    req.ip
  );

  const completeQuote = await prisma.quotation.findUnique({
    where: { id: quotation.id },
    include: { items: true },
  });

  return success(res, completeQuote, 'Quotation submitted successfully', 201);
};

/**
 * PUT /api/quotations/:id
 */
const updateQuotation = async (req, res) => {
  const { id } = req.params;
  const { notes, deliveryDays, items } = req.body;

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: { rfq: true },
  });

  if (!quotation) {
    return error(res, 'Quotation not found', 404, 'NOT_FOUND');
  }

  // Authorization check
  if (req.user.role === 'vendor' && quotation.vendorId !== req.user.vendorId) {
    return error(res, 'Access denied. You do not own this quotation', 403, 'FORBIDDEN');
  }

  // Status check
  if (quotation.status !== 'submitted' && quotation.status !== 'under_review') {
    return error(res, `Cannot update quotation in current state (Status: ${quotation.status})`, 400, 'BAD_REQUEST');
  }

  // Deadline check
  if (new Date() > new Date(quotation.rfq.deadline)) {
    return error(res, 'Cannot modify quotation because the RFQ deadline has passed', 400, 'BAD_REQUEST');
  }

  const result = await prisma.$transaction(async (tx) => {
    // Update notes and delivery days
    const updated = await tx.quotation.update({
      where: { id },
      data: {
        notes,
        deliveryDays,
        status: 'submitted', // Reset to submitted
      },
    });

    // Update items if provided
    if (items) {
      await tx.quotationItem.deleteMany({ where: { quotationId: id } });

      const rfqItems = await tx.rFQItem.findMany({ where: { rfqId: quotation.rfqId } });

      const quotationItemsData = [];
      for (const item of items) {
        const rfqItem = rfqItems.find((i) => i.id === item.rfqItemId);
        if (!rfqItem) {
          throw new Error(`RFQ Item ${item.rfqItemId} not found on this RFQ`);
        }

        const qty = parseFloat(rfqItem.quantity);
        const price = parseFloat(item.unitPrice);
        const totalPrice = qty * price;

        quotationItemsData.push({
          quotationId: id,
          rfqItemId: item.rfqItemId,
          unitPrice: price,
          totalPrice: totalPrice,
        });
      }

      await tx.quotationItem.createMany({
        data: quotationItemsData,
      });
    }

    return updated;
  });

  await logActivity(
    req.user.id,
    'UPDATE_QUOTATION',
    'Quotation',
    id,
    { deliveryDays: result.deliveryDays },
    req.ip
  );

  const completeQuote = await prisma.quotation.findUnique({
    where: { id },
    include: { items: true },
  });

  return success(res, completeQuote, 'Quotation updated successfully');
};

/**
 * PUT /api/quotations/:id/withdraw
 */
const withdrawQuotation = async (req, res) => {
  const { id } = req.params;

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: { rfq: true },
  });

  if (!quotation) {
    return error(res, 'Quotation not found', 404, 'NOT_FOUND');
  }

  // Authorization check
  if (req.user.role === 'vendor' && quotation.vendorId !== req.user.vendorId) {
    return error(res, 'Access denied. You do not own this quotation', 403, 'FORBIDDEN');
  }

  // Deadline check
  if (new Date() > new Date(quotation.rfq.deadline)) {
    return error(res, 'Cannot withdraw quotation after RFQ deadline has passed', 400, 'BAD_REQUEST');
  }

  const updated = await prisma.quotation.update({
    where: { id },
    data: { status: 'withdrawn' },
  });

  await logActivity(req.user.id, 'WITHDRAW_QUOTATION', 'Quotation', id, null, req.ip);

  return success(res, updated, 'Quotation withdrawn successfully');
};

module.exports = {
  getQuotations,
  getMyQuotations,
  getQuotationById,
  submitQuotation,
  updateQuotation,
  withdrawQuotation,
};
