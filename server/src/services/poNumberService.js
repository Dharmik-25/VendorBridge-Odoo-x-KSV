const prisma = require('../config/prisma');

/**
 * Generate PO Number with format PO-YYYY-XXXXX (e.g., PO-2026-00001)
 */
const generatePONumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `PO-${year}-`;
  
  // Find the highest sequence number for the current year
  const lastPO = await prisma.purchaseOrder.findFirst({
    where: {
      poNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      poNumber: 'desc',
    },
  });

  let nextSequence = 1;
  if (lastPO) {
    const parts = lastPO.poNumber.split('-');
    const lastSeq = parseInt(parts[2]);
    if (!isNaN(lastSeq)) {
      nextSequence = lastSeq + 1;
    }
  }

  const sequenceStr = nextSequence.toString().padStart(5, '0');
  return `${prefix}${sequenceStr}`;
};

/**
 * Generate Invoice Number with format INV-YYYY-XXXXX (e.g., INV-2026-00001)
 */
const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
  });

  let nextSequence = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split('-');
    const lastSeq = parseInt(parts[2]);
    if (!isNaN(lastSeq)) {
      nextSequence = lastSeq + 1;
    }
  }

  const sequenceStr = nextSequence.toString().padStart(5, '0');
  return `${prefix}${sequenceStr}`;
};

module.exports = { generatePONumber, generateInvoiceNumber };
