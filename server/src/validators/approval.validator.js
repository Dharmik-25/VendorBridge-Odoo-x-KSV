const { z } = require('zod');

const approvalDecisionSchema = z.object({
  body: z.object({
    status: z.enum(['approved', 'rejected'], {
      errorMap: () => ({ message: 'Status must be either approved or rejected' }),
    }),
    remarks: z.string().optional().nullable(),
  }).refine((data) => {
    if (data.status === 'rejected' && (!data.remarks || data.remarks.trim() === '')) {
      return false;
    }
    return true;
  }, {
    message: 'Remarks are mandatory when rejecting an approval request',
    path: ['remarks'],
  }),
});

module.exports = { approvalDecisionSchema };
