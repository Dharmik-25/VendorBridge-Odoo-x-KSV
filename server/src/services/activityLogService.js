const prisma = require('../config/prisma');

/**
 * Shared utility to write immutable audit logs to database.
 */
const logActivity = async (userId, action, entityType, entityId, metadata = null, ipAddress = null) => {
  try {
    const log = await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        ipAddress,
      },
    });
    return log;
  } catch (err) {
    // We log the error but don't fail the primary transaction.
    // Auditing should be resilient, but not break the system if logging fails.
    console.error('Failed to write activity log:', err);
    return null;
  }
};

module.exports = { logActivity };
