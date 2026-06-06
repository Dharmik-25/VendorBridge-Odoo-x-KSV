const fs = require('fs');
const path = require('path');
const prisma = require('../config/prisma');
const { success, error } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { logActivity } = require('../services/activityLogService');
const { generateInvoiceNumber } = require('../services/poNumberService');
const { generateInvoicePDF } = require('../services/pdfService');
const { sendInvoiceEmail } = require('../services/emailService');
const { INVOICE_DUE_DAYS } = require('../config/constants');

/**
 * GET /api/invoices
 */
const getInvoices = async (req, res) => {
  const { status } = req.query;
  const { skip, take, page, limit } = getPagination(req.query);

  const where = {};

  if (req.user.role === 'vendor') {
    if (!req.user.vendorId) {
      return error(res, 'User is not a registered vendor', 400, 'BAD_REQUEST');
    }
    where.purchaseOrder = {
      vendorId: req.user.vendorId,
    };
  }

  if (status) {
    where.status = status;
  }

  const [invoices, total] = await prisma.$transaction([
    prisma.invoice.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        purchaseOrder: {
          select: {
            id: true,
            poNumber: true,
            grandTotal: true,
            vendor: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return success(
    res,
    invoices,
    'Invoices retrieved successfully',
    200,
    buildPaginationMeta(total, page, limit)
  );
};

/**
 * GET /api/invoices/:id
 */
const getInvoiceById = async (req, res) => {
  const { id } = req.params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      purchaseOrder: {
        include: {
          vendor: true,
          items: true,
          createdBy: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!invoice) {
    return error(res, 'Invoice not found', 404, 'NOT_FOUND');
  }

  // Security guard: vendor can only view their own invoice
  if (req.user.role === 'vendor' && invoice.purchaseOrder.vendorId !== req.user.vendorId) {
    return error(res, 'Access denied. You do not own this invoice', 403, 'FORBIDDEN');
  }

  return success(res, invoice, 'Invoice retrieved successfully');
};

/**
 * POST /api/invoices (Generate invoice from PO)
 */
const generateInvoice = async (req, res) => {
  const { poId } = req.body;

  // Verify PO exists
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { vendor: true, items: true },
  });

  if (!po) {
    return error(res, 'Purchase Order not found', 404, 'NOT_FOUND');
  }

  // Verify invoice does not already exist
  const existingInvoice = await prisma.invoice.findUnique({
    where: { poId },
  });

  if (existingInvoice) {
    return error(res, 'An invoice has already been generated for this Purchase Order', 400, 'BAD_REQUEST');
  }

  const invoiceNumber = await generateInvoiceNumber();

  // Set due date to issue date + INVOICE_DUE_DAYS (default 30)
  const issueDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + INVOICE_DUE_DAYS);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create invoice in draft status
    const inv = await tx.invoice.create({
      data: {
        poId,
        invoiceNumber,
        issueDate,
        dueDate,
        status: 'issued', // Immediately issue it
      },
    });

    // 2. Generate PDF via Puppeteer
    const pdfRelativePath = await generateInvoicePDF(inv, po, po.vendor);

    // 3. Update invoice with PDF path
    return await tx.invoice.update({
      where: { id: inv.id },
      data: { pdfPath: pdfRelativePath },
    });
  });

  await logActivity(
    req.user.id,
    'GENERATE_INVOICE',
    'Invoice',
    result.id,
    { invoiceNumber: result.invoiceNumber, poNumber: po.poNumber },
    req.ip
  );

  return success(res, result, 'Invoice generated successfully', 201);
};

/**
 * GET /api/invoices/:id/pdf (Streams PDF invoice to browser)
 */
const getInvoicePDF = async (req, res) => {
  const { id } = req.params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { purchaseOrder: true },
  });

  if (!invoice) {
    return error(res, 'Invoice not found', 404, 'NOT_FOUND');
  }

  // Security guard: vendor can only stream their own invoice
  if (req.user.role === 'vendor' && invoice.purchaseOrder.vendorId !== req.user.vendorId) {
    return error(res, 'Access denied. You do not own this invoice', 403, 'FORBIDDEN');
  }

  if (!invoice.pdfPath) {
    return error(res, 'PDF file not generated for this invoice', 404, 'NOT_FOUND');
  }

  const absolutePath = path.join(__dirname, '../../', invoice.pdfPath);

  if (!fs.existsSync(absolutePath)) {
    return error(res, 'Invoice PDF file not found on disk', 404, 'NOT_FOUND');
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber}.pdf"`);

  const stream = fs.createReadStream(absolutePath);
  stream.on('error', (err) => {
    console.error('PDF stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream PDF' });
    }
  });
  stream.pipe(res);
};

/**
 * POST /api/invoices/:id/send-email (Emails PDF invoice to vendor)
 */
const emailInvoice = async (req, res) => {
  const { id } = req.params;
  const { recipientEmail } = req.body;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      purchaseOrder: {
        include: {
          vendor: true,
        },
      },
    },
  });

  if (!invoice) {
    return error(res, 'Invoice not found', 404, 'NOT_FOUND');
  }

  const targetEmail = recipientEmail || invoice.purchaseOrder.vendor.email;

  if (!targetEmail) {
    return error(res, 'Recipient email address is required', 400, 'BAD_REQUEST');
  }

  if (!invoice.pdfPath) {
    return error(res, 'PDF file has not been generated for this invoice', 400, 'BAD_REQUEST');
  }

  await sendInvoiceEmail(targetEmail, invoice.invoiceNumber, invoice.pdfPath);

  // Update emailed timestamp
  const updated = await prisma.invoice.update({
    where: { id },
    data: { emailedAt: new Date() },
  });

  await logActivity(
    req.user.id,
    'EMAIL_INVOICE',
    'Invoice',
    id,
    { invoiceNumber: invoice.invoiceNumber, recipient: targetEmail },
    req.ip
  );

  return success(res, updated, `Invoice emailed successfully to ${targetEmail}`);
};

/**
 * PUT /api/invoices/:id/mark-paid
 */
const markInvoiceAsPaid = async (req, res) => {
  const { id } = req.params;

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) {
    return error(res, 'Invoice not found', 404, 'NOT_FOUND');
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: 'paid' },
  });

  await logActivity(
    req.user.id,
    'MARK_INVOICE_PAID',
    'Invoice',
    id,
    { invoiceNumber: invoice.invoiceNumber },
    req.ip
  );

  return success(res, updated, 'Invoice marked as paid successfully');
};

module.exports = {
  getInvoices,
  getInvoiceById,
  generateInvoice,
  getInvoicePDF,
  emailInvoice,
  markInvoiceAsPaid,
};
