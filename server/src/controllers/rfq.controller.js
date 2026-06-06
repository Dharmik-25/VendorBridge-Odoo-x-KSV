const prisma = require('../config/prisma');
const { success, error } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { logActivity } = require('../services/activityLogService');
const { calculateScores } = require('../services/scoringService');

/**
 * GET /api/rfqs
 */
const getRFQs = async (req, res) => {
  const { status, search } = req.query;
  const { skip, take, page, limit } = getPagination(req.query);

  const where = {};

  // Role-based visibility
  if (req.user.role === 'vendor') {
    // Vendors only see RFQs they are invited to and that are published or later
    if (!req.user.vendorId) {
      return success(res, [], 'No invited RFQs found', 200, buildPaginationMeta(0, page, limit));
    }
    where.rfqVendors = {
      some: {
        vendorId: req.user.vendorId,
      },
    };
    where.status = {
      in: ['published', 'closed', 'awarded'],
    };
  } else if (status) {
    where.status = status;
  }

  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
  }

  const [rfqs, total] = await prisma.$transaction([
    prisma.rFQ.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { items: true, rfqVendors: true, quotations: true } },
      },
    }),
    prisma.rFQ.count({ where }),
  ]);

  return success(
    res,
    rfqs,
    'RFQs retrieved successfully',
    200,
    buildPaginationMeta(total, page, limit)
  );
};

/**
 * GET /api/rfqs/:id
 */
const getRFQById = async (req, res) => {
  const { id } = req.params;

  const rfq = await prisma.rFQ.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      items: true,
      rfqVendors: {
        include: {
          vendor: { select: { id: true, name: true, email: true, category: true, rating: true, status: true } },
        },
      },
      quotations: {
        where: req.user.role === 'vendor' ? { vendorId: req.user.vendorId } : undefined,
        include: {
          vendor: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!rfq) {
    return error(res, 'RFQ not found', 404, 'NOT_FOUND');
  }

  // Security check: if vendor, they must be invited
  if (req.user.role === 'vendor') {
    const isInvited = rfq.rfqVendors.some((rv) => rv.vendorId === req.user.vendorId);
    if (!isInvited) {
      return error(res, 'Access denied. You are not invited to this RFQ', 403, 'FORBIDDEN');
    }
  }

  return success(res, rfq, 'RFQ retrieved successfully');
};

/**
 * POST /api/rfqs
 */
const createRFQ = async (req, res) => {
  const { title, description, deadline, items, vendorIds } = req.body;

  const result = await prisma.$transaction(async (tx) => {
    // Create base RFQ
    const rfq = await tx.rFQ.create({
      data: {
        title,
        description,
        deadline: new Date(deadline),
        createdById: req.user.id,
        status: 'draft',
      },
    });

    // Create RFQ items
    if (items && items.length > 0) {
      await tx.rFQItem.createMany({
        data: items.map((item) => ({
          rfqId: rfq.id,
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit || 'pcs',
          specifications: item.specifications || null,
        })),
      });
    }

    // Assign/invite vendors
    if (vendorIds && vendorIds.length > 0) {
      await tx.rFQVendor.createMany({
        data: vendorIds.map((vendorId) => ({
          rfqId: rfq.id,
          vendorId,
        })),
      });
    }

    return rfq;
  });

  await logActivity(
    req.user.id,
    'CREATE_RFQ',
    'RFQ',
    result.id,
    { title: result.title, itemCount: items?.length || 0, vendorCount: vendorIds?.length || 0 },
    req.ip
  );

  // Return the complete RFQ with relations
  const completedRFQ = await prisma.rFQ.findUnique({
    where: { id: result.id },
    include: { items: true, rfqVendors: true },
  });

  return success(res, completedRFQ, 'RFQ created successfully', 201);
};

/**
 * PUT /api/rfqs/:id
 */
const updateRFQ = async (req, res) => {
  const { id } = req.params;
  const { title, description, deadline, items, vendorIds } = req.body;

  const existingRFQ = await prisma.rFQ.findUnique({ where: { id } });
  if (!existingRFQ) {
    return error(res, 'RFQ not found', 404, 'NOT_FOUND');
  }

  if (existingRFQ.status !== 'draft') {
    return error(res, 'Only RFQs in draft status can be modified', 400, 'BAD_REQUEST');
  }

  const result = await prisma.$transaction(async (tx) => {
    // Update basic RFQ info
    const updated = await tx.rFQ.update({
      where: { id },
      data: {
        title,
        description,
        deadline: deadline ? new Date(deadline) : undefined,
      },
    });

    // Handle items update if provided (delete and recreate is cleanest for nested lines)
    if (items) {
      await tx.rFQItem.deleteMany({ where: { rfqId: id } });
      await tx.rFQItem.createMany({
        data: items.map((item) => ({
          rfqId: id,
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit || 'pcs',
          specifications: item.specifications || null,
        })),
      });
    }

    // Handle vendor invitations update if provided
    if (vendorIds) {
      await tx.rFQVendor.deleteMany({ where: { rfqId: id } });
      await tx.rFQVendor.createMany({
        data: vendorIds.map((vendorId) => ({
          rfqId: id,
          vendorId,
        })),
      });
    }

    return updated;
  });

  await logActivity(
    req.user.id,
    'UPDATE_RFQ',
    'RFQ',
    id,
    { title: result.title },
    req.ip
  );

  const completedRFQ = await prisma.rFQ.findUnique({
    where: { id },
    include: { items: true, rfqVendors: true },
  });

  return success(res, completedRFQ, 'RFQ updated successfully');
};

/**
 * PUT /api/rfqs/:id/publish
 */
const publishRFQ = async (req, res) => {
  const { id } = req.params;

  const rfq = await prisma.rFQ.findUnique({ where: { id } });
  if (!rfq) {
    return error(res, 'RFQ not found', 404, 'NOT_FOUND');
  }

  if (rfq.status !== 'draft') {
    return error(res, 'RFQ is already published or closed', 400, 'BAD_REQUEST');
  }

  const updated = await prisma.rFQ.update({
    where: { id },
    data: { status: 'published' },
  });

  await logActivity(req.user.id, 'PUBLISH_RFQ', 'RFQ', id, { title: rfq.title }, req.ip);

  return success(res, updated, 'RFQ published successfully');
};

/**
 * PUT /api/rfqs/:id/close
 */
const closeRFQ = async (req, res) => {
  const { id } = req.params;

  const rfq = await prisma.rFQ.findUnique({ where: { id } });
  if (!rfq) {
    return error(res, 'RFQ not found', 404, 'NOT_FOUND');
  }

  const updated = await prisma.rFQ.update({
    where: { id },
    data: { status: 'closed' },
  });

  await logActivity(req.user.id, 'CLOSE_RFQ', 'RFQ', id, { title: rfq.title }, req.ip);

  return success(res, updated, 'RFQ closed successfully');
};

/**
 * POST /api/rfqs/:id/invite-vendors
 */
const inviteVendors = async (req, res) => {
  const { id } = req.params;
  const { vendorIds } = req.body;

  if (!vendorIds || vendorIds.length === 0) {
    return error(res, 'Vendor IDs array is required', 400, 'BAD_REQUEST');
  }

  const rfq = await prisma.rFQ.findUnique({ where: { id } });
  if (!rfq) {
    return error(res, 'RFQ not found', 404, 'NOT_FOUND');
  }

  // Deduplicate and filter out already invited vendors
  const alreadyInvited = await prisma.rFQVendor.findMany({
    where: { rfqId: id, vendorId: { in: vendorIds } },
    select: { vendorId: true },
  });
  const alreadyInvitedIds = alreadyInvited.map((v) => v.vendorId);
  const newVendorIds = vendorIds.filter((vId) => !alreadyInvitedIds.includes(vId));

  if (newVendorIds.length > 0) {
    await prisma.rFQVendor.createMany({
      data: newVendorIds.map((vendorId) => ({
        rfqId: id,
        vendorId,
      })),
    });
  }

  await logActivity(
    req.user.id,
    'INVITE_VENDORS',
    'RFQ',
    id,
    { invitedCount: newVendorIds.length, totalCount: vendorIds.length },
    req.ip
  );

  return success(res, null, `${newVendorIds.length} new vendors invited successfully`);
};

/**
 * GET /api/rfqs/:id/vendors
 */
const getRFQVendors = async (req, res) => {
  const { id } = req.params;

  const rfqVendors = await prisma.rFQVendor.findMany({
    where: { rfqId: id },
    include: {
      vendor: {
        select: { id: true, name: true, email: true, phone: true, category: true, rating: true },
      },
    },
  });

  return success(res, rfqVendors, 'Invited vendors retrieved successfully');
};

/**
 * GET /api/rfqs/:id/quotations
 */
const getRFQQuotations = async (req, res) => {
  const { id } = req.params;

  const quotations = await prisma.quotation.findMany({
    where: { rfqId: id },
    include: {
      vendor: { select: { id: true, name: true, email: true, rating: true } },
      items: {
        include: { rfqItem: true },
      },
    },
  });

  return success(res, quotations, 'RFQ quotations retrieved successfully');
};

/**
 * GET /api/rfqs/:id/quotations/compare
 */
const compareQuotations = async (req, res) => {
  const { id } = req.params;

  const rfq = await prisma.rFQ.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!rfq) {
    return error(res, 'RFQ not found', 404, 'NOT_FOUND');
  }

  const quotations = await prisma.quotation.findMany({
    where: { rfqId: id, status: { not: 'withdrawn' } },
    include: {
      vendor: { select: { id: true, name: true, email: true, rating: true } },
      items: {
        include: { rfqItem: true },
      },
    },
  });

  if (quotations.length === 0) {
    return success(res, { rfq, quotations: [], comparison: [] }, 'No quotations available for comparison');
  }

  // Calculate scores using service
  const scoredQuotations = calculateScores(quotations);

  // Sort by weighted score descending
  scoredQuotations.sort((a, b) => b.weightedScore - a.weightedScore);

  const response = {
    rfq,
    comparison: scoredQuotations.map((q) => ({
      quotationId: q.id,
      vendor: q.vendor,
      notes: q.notes,
      deliveryDays: q.deliveryDays,
      totalAmount: q.totalAmount,
      priceScore: q.priceScore,
      deliveryScore: q.deliveryScore,
      ratingScore: q.ratingScore,
      weightedScore: q.weightedScore,
      items: q.items.map((item) => ({
        rfqItemId: item.rfqItemId,
        productName: item.rfqItem.productName,
        quantity: parseFloat(item.rfqItem.quantity),
        unit: item.rfqItem.unit,
        unitPrice: parseFloat(item.unitPrice),
        totalPrice: parseFloat(item.totalPrice),
      })),
    })),
    recommendedQuotationId: scoredQuotations[0]?.id || null,
  };

  return success(res, response, 'Quotation comparison report generated successfully');
};

module.exports = {
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
};
