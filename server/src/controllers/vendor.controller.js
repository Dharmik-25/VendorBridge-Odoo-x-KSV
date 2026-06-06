const prisma = require('../config/prisma');
const { success, error } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { logActivity } = require('../services/activityLogService');

/**
 * GET /api/vendors
 */
const getVendors = async (req, res) => {
  const { category, status, search } = req.query;
  const { skip, take, page, limit } = getPagination(req.query);

  const where = {};

  if (category) {
    where.category = category;
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [vendors, total] = await prisma.$transaction([
    prisma.vendor.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, isActive: true } } },
    }),
    prisma.vendor.count({ where }),
  ]);

  return success(
    res,
    vendors,
    'Vendors retrieved successfully',
    200,
    buildPaginationMeta(total, page, limit)
  );
};

/**
 * GET /api/vendors/me
 */
const getMyVendorProfile = async (req, res) => {
  if (req.user.role !== 'vendor' || !req.user.vendor?.id) {
    return error(res, 'Profile not found. User is not a registered vendor', 404, 'NOT_FOUND');
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: req.user.vendor.id },
    include: { user: { select: { id: true, name: true, email: true, isActive: true } } },
  });

  if (!vendor) {
    return error(res, 'Vendor details not found', 404, 'NOT_FOUND');
  }

  return success(res, vendor, 'Vendor profile retrieved successfully');
};

/**
 * GET /api/vendors/:id
 */
const getVendorById = async (req, res) => {
  const { id } = req.params;

  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true, isActive: true } } },
  });

  if (!vendor) {
    return error(res, 'Vendor not found', 404, 'NOT_FOUND');
  }

  return success(res, vendor, 'Vendor retrieved successfully');
};

/**
 * POST /api/vendors
 */
const createVendor = async (req, res) => {
  const { name, email, phone, category, gstNumber, country, status } = req.body;

  const existingVendor = await prisma.vendor.findUnique({ where: { email } });
  if (existingVendor) {
    return error(res, 'Vendor with this email already exists', 400, 'VENDOR_EXISTS');
  }

  if (gstNumber) {
    const existingGST = await prisma.vendor.findUnique({ where: { gstNumber } });
    if (existingGST) {
      return error(res, 'Vendor with this GST number already exists', 400, 'GST_EXISTS');
    }
  }

  const vendor = await prisma.vendor.create({
    data: {
      name,
      email,
      phone,
      category,
      gstNumber: gstNumber || null,
      country: country || 'India',
      status: status || 'pending',
    },
  });

  await logActivity(
    req.user.id,
    'CREATE_VENDOR',
    'Vendor',
    vendor.id,
    { name: vendor.name, category: vendor.category, status: vendor.status },
    req.ip
  );

  return success(res, vendor, 'Vendor created successfully', 201);
};

/**
 * PUT /api/vendors/:id
 */
const updateVendor = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, category, gstNumber, country, status, rating } = req.body;

  const vendorExists = await prisma.vendor.findUnique({ where: { id } });
  if (!vendorExists) {
    return error(res, 'Vendor not found', 404, 'NOT_FOUND');
  }

  if (email && email !== vendorExists.email) {
    const existingEmail = await prisma.vendor.findUnique({ where: { email } });
    if (existingEmail) {
      return error(res, 'Vendor with this email already exists', 400, 'VENDOR_EXISTS');
    }
  }

  if (gstNumber && gstNumber !== vendorExists.gstNumber) {
    const existingGST = await prisma.vendor.findUnique({ where: { gstNumber } });
    if (existingGST) {
      return error(res, 'Vendor with this GST number already exists', 400, 'GST_EXISTS');
    }
  }

  const vendor = await prisma.vendor.update({
    where: { id },
    data: {
      name,
      email,
      phone,
      category,
      gstNumber: gstNumber || undefined,
      country,
      status,
      rating: rating !== undefined ? parseFloat(rating) : undefined,
    },
  });

  await logActivity(
    req.user.id,
    'UPDATE_VENDOR',
    'Vendor',
    vendor.id,
    { status: vendor.status, rating: vendor.rating },
    req.ip
  );

  return success(res, vendor, 'Vendor updated successfully');
};

/**
 * DELETE /api/vendors/:id
 * (Soft delete: change status to suspended)
 */
const deleteVendor = async (req, res) => {
  const { id } = req.params;

  const vendorExists = await prisma.vendor.findUnique({ where: { id } });
  if (!vendorExists) {
    return error(res, 'Vendor not found', 404, 'NOT_FOUND');
  }

  const vendor = await prisma.vendor.update({
    where: { id },
    data: { status: 'suspended' },
  });

  // Soft deactivate linked user as well
  if (vendor.userId) {
    await prisma.user.update({
      where: { id: vendor.userId },
      data: { isActive: false },
    });
  }

  await logActivity(
    req.user.id,
    'DELETE_VENDOR',
    'Vendor',
    vendor.id,
    { name: vendor.name, status: vendor.status },
    req.ip
  );

  return success(res, vendor, 'Vendor suspended successfully');
};

/**
 * PUT /api/vendors/:id/approve
 */
const approveVendor = async (req, res) => {
  const { id } = req.params;

  const vendorExists = await prisma.vendor.findUnique({ where: { id } });
  if (!vendorExists) {
    return error(res, 'Vendor not found', 404, 'NOT_FOUND');
  }

  const result = await prisma.$transaction(async (tx) => {
    const vendor = await tx.vendor.update({
      where: { id },
      data: { status: 'approved' },
    });

    if (vendor.userId) {
      await tx.user.update({
        where: { id: vendor.userId },
        data: { isActive: true },
      });
    }

    return vendor;
  });

  await logActivity(
    req.user.id,
    'APPROVE_VENDOR',
    'Vendor',
    id,
    { name: result.name, status: result.status },
    req.ip
  );

  return success(res, result, 'Vendor approved successfully');
};

/**
 * PUT /api/vendors/:id/reject
 */
const rejectVendor = async (req, res) => {
  const { id } = req.params;

  const vendorExists = await prisma.vendor.findUnique({ where: { id } });
  if (!vendorExists) {
    return error(res, 'Vendor not found', 404, 'NOT_FOUND');
  }

  const result = await prisma.$transaction(async (tx) => {
    const vendor = await tx.vendor.update({
      where: { id },
      data: { status: 'rejected' },
    });

    if (vendor.userId) {
      await tx.user.update({
        where: { id: vendor.userId },
        data: { isActive: false }, // don't let rejected vendors log in
      });
    }

    return vendor;
  });

  await logActivity(
    req.user.id,
    'REJECT_VENDOR',
    'Vendor',
    id,
    { name: result.name, status: result.status },
    req.ip
  );

  return success(res, result, 'Vendor rejected successfully');
};

module.exports = {
  getVendors,
  getMyVendorProfile,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  approveVendor,
  rejectVendor,
};
