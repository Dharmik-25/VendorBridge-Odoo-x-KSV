// ─── Scoring Weights ─────────────────────────────────────────────────────────
const SCORING_WEIGHTS = {
  price: 0.5,      // 50% weight — total quotation cost
  delivery: 0.3,   // 30% weight — delivery speed (fewer days = better)
  rating: 0.2,     // 20% weight — vendor rating (0–5 scale)
};

// ─── Tax Rate ────────────────────────────────────────────────────────────────
const TAX_RATE = 0.18; // 18% GST

// ─── Invoice Due Days ────────────────────────────────────────────────────────
const INVOICE_DUE_DAYS = 30; // Payment due 30 days from issue date

// ─── Pagination Defaults ─────────────────────────────────────────────────────
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// ─── Roles ───────────────────────────────────────────────────────────────────
const ROLES = {
  ADMIN: 'admin',
  PROCUREMENT_OFFICER: 'procurement_officer',
  MANAGER: 'manager',
  VENDOR: 'vendor',
};

module.exports = {
  SCORING_WEIGHTS,
  TAX_RATE,
  INVOICE_DUE_DAYS,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  ROLES,
};
