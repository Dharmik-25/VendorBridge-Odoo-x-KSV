const prisma = require('../config/prisma');
const { success, error } = require('../utils/apiResponse');

/**
 * GET /api/reports/dashboard-stats
 */
const getDashboardStats = async (req, res) => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Counts based on role
  let activeRFQsCount = 0;
  let pendingApprovalsCount = 0;
  let monthlySpend = 0;

  if (req.user.role === 'vendor') {
    // Vendor specific dashboard stats
    if (req.user.vendorId) {
      activeRFQsCount = await prisma.rFQ.count({
        where: {
          status: 'published',
          rfqVendors: { some: { vendorId: req.user.vendorId } },
        },
      });

      const vendorPOs = await prisma.purchaseOrder.findMany({
        where: {
          vendorId: req.user.vendorId,
          createdAt: { gte: firstDayOfMonth },
        },
        select: { grandTotal: true },
      });
      monthlySpend = vendorPOs.reduce((sum, po) => sum + parseFloat(po.grandTotal), 0);
    }
  } else {
    // Admin, PO, Manager see system-wide stats
    activeRFQsCount = await prisma.rFQ.count({ where: { status: 'published' } });
    pendingApprovalsCount = await prisma.approval.count({ where: { status: 'pending' } });

    const recentPOsThisMonth = await prisma.purchaseOrder.findMany({
      where: {
        createdAt: { gte: firstDayOfMonth },
      },
      select: { grandTotal: true },
    });
    monthlySpend = recentPOsThisMonth.reduce((sum, po) => sum + parseFloat(po.grandTotal), 0);
  }

  // 2. Recent Invoices
  const recentInvoices = await prisma.invoice.findMany({
    where: req.user.role === 'vendor' ? { purchaseOrder: { vendorId: req.user.vendorId } } : undefined,
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      purchaseOrder: {
        select: {
          poNumber: true,
          grandTotal: true,
          vendor: { select: { name: true } },
        },
      },
    },
  });

  // 3. Recent Activity Feed (last 5)
  const recentActivities = await prisma.activityLog.findMany({
    where: req.user.role === 'vendor' ? { userId: req.user.id } : undefined,
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, role: true } },
    },
  });

  // 4. Monthly spend chart data for dashboard (last 6 months)
  const monthlyChartData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const pos = await prisma.purchaseOrder.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        vendorId: req.user.role === 'vendor' ? req.user.vendorId : undefined,
      },
      select: { grandTotal: true },
    });

    const sum = pos.reduce((acc, po) => acc + parseFloat(po.grandTotal), 0);
    const monthName = d.toLocaleString('default', { month: 'short' });

    monthlyChartData.push({
      month: monthName,
      spend: parseFloat(sum.toFixed(2)),
    });
  }

  const response = {
    stats: {
      activeRFQs: activeRFQsCount,
      pendingApprovals: pendingApprovalsCount,
      monthlySpend: parseFloat(monthlySpend.toFixed(2)),
      totalInvoices: recentInvoices.length,
    },
    recentInvoices: recentInvoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      poNumber: inv.purchaseOrder.poNumber,
      vendorName: inv.purchaseOrder.vendor.name,
      grandTotal: parseFloat(inv.purchaseOrder.grandTotal),
      status: inv.status,
      issueDate: inv.issueDate,
    })),
    recentActivities: recentActivities.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      createdAt: log.createdAt,
      actorName: log.user ? log.user.name : 'System',
    })),
    monthlyTrend: monthlyChartData,
  };

  return success(res, response, 'Dashboard statistics retrieved successfully');
};

/**
 * GET /api/reports/spending-summary
 */
const getSpendingSummary = async (req, res) => {
  const categories = ['IT', 'Furniture', 'Logistics', 'Stationery'];
  const data = [];

  for (const category of categories) {
    const pos = await prisma.purchaseOrder.findMany({
      where: {
        vendor: { category },
      },
      select: { grandTotal: true },
    });

    const total = pos.reduce((sum, po) => sum + parseFloat(po.grandTotal), 0);
    data.push({
      category,
      value: parseFloat(total.toFixed(2)),
    });
  }

  return success(res, data, 'Spending summary by category retrieved successfully');
};

/**
 * GET /api/reports/vendor-performance
 */
const getVendorPerformance = async (req, res) => {
  const vendors = await prisma.vendor.findMany({
    where: { status: 'approved' },
  });

  const data = [];

  for (const v of vendors) {
    // Total POs & Spend
    const pos = await prisma.purchaseOrder.findMany({
      where: { vendorId: v.id },
      select: { grandTotal: true },
    });

    const totalPOs = pos.length;
    const totalSpend = pos.reduce((sum, po) => sum + parseFloat(po.grandTotal), 0);

    // Avg delivery days from quotations linked to approved approvals
    const quotations = await prisma.quotation.findMany({
      where: { vendorId: v.id, status: 'approved' },
      select: { deliveryDays: true },
    });

    const avgDelivery = quotations.length > 0
      ? quotations.reduce((sum, q) => sum + q.deliveryDays, 0) / quotations.length
      : 0;

    data.push({
      vendorId: v.id,
      vendorName: v.name,
      category: v.category || 'N/A',
      rating: parseFloat(v.rating),
      totalPOs,
      totalSpend: parseFloat(totalSpend.toFixed(2)),
      avgDeliveryDays: parseFloat(avgDelivery.toFixed(1)),
    });
  }

  return success(res, data, 'Vendor performance report retrieved successfully');
};

/**
 * GET /api/reports/monthly-trend
 */
const getMonthlyTrend = async (req, res) => {
  const now = new Date();
  const data = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const pos = await prisma.purchaseOrder.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      select: { grandTotal: true },
    });

    const sum = pos.reduce((acc, po) => acc + parseFloat(po.grandTotal), 0);
    const monthName = d.toLocaleString('default', { month: 'long', year: 'numeric' });

    data.push({
      month: monthName,
      spend: parseFloat(sum.toFixed(2)),
    });
  }

  return success(res, data, 'Monthly trend retrieved successfully');
};

module.exports = {
  getDashboardStats,
  getSpendingSummary,
  getVendorPerformance,
  getMonthlyTrend,
};
