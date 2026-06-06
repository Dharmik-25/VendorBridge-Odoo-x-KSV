const prisma = require('../config/prisma');
const { success, error } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

/**
 * GET /api/activity-logs
 */
const getActivityLogs = async (req, res) => {
  const { entityType, action, search } = req.query;
  const { skip, take, page, limit } = getPagination(req.query);

  const where = {};

  if (entityType) {
    where.entityType = entityType;
  }

  if (action) {
    where.action = action;
  }

  if (search) {
    where.OR = [
      { action: { contains: search, mode: 'insensitive' } },
      { entityType: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [logs, total] = await prisma.$transaction([
    prisma.activityLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    }),
    prisma.activityLog.count({ where }),
  ]);

  return success(
    res,
    logs,
    'Activity logs retrieved successfully',
    200,
    buildPaginationMeta(total, page, limit)
  );
};

/**
 * GET /api/activity-logs/mine
 */
const getMyActivityLogs = async (req, res) => {
  const { skip, take, page, limit } = getPagination(req.query);

  const [logs, total] = await prisma.$transaction([
    prisma.activityLog.findMany({
      where: { userId: req.user.id },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.activityLog.count({ where: { userId: req.user.id } }),
  ]);

  return success(
    res,
    logs,
    'Your activity logs retrieved successfully',
    200,
    buildPaginationMeta(total, page, limit)
  );
};

/**
 * GET /api/activity-logs/entity/:type/:id
 */
const getEntityActivityLogs = async (req, res) => {
  const { type, id } = req.params;

  const logs = await prisma.activityLog.findMany({
    where: {
      entityType: type,
      entityId: id,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, role: true } },
    },
  });

  return success(res, logs, `Activity logs for ${type} ${id} retrieved successfully`);
};

module.exports = {
  getActivityLogs,
  getMyActivityLogs,
  getEntityActivityLogs,
};
