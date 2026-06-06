const { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } = require('../config/constants');

/**
 * Parse pagination params and return Prisma skip/take
 */
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
};

/**
 * Build pagination metadata for response
 */
const buildPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});

module.exports = { getPagination, buildPaginationMeta };
