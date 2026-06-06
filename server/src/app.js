const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const vendorRoutes = require('./routes/vendor.routes');
const rfqRoutes = require('./routes/rfq.routes');
const quotationRoutes = require('./routes/quotation.routes');
const approvalRoutes = require('./routes/approval.routes');
const poRoutes = require('./routes/po.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const activityLogRoutes = require('./routes/activityLog.routes');
const reportRoutes = require('./routes/report.routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ─── Request Parsing ────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Logging ────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'VendorBridge API' });
});

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/vendors', vendorRoutes);
app.use('/api/v1/rfqs', rfqRoutes);
app.use('/api/v1/quotations', quotationRoutes);
app.use('/api/v1/approvals', approvalRoutes);
app.use('/api/v1/purchase-orders', poRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/activity-logs', activityLogRoutes);
app.use('/api/v1/reports', reportRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` } });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
