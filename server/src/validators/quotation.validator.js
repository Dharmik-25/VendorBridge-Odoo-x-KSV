const { z } = require('zod');

const quotationItemSchema = z.object({
  rfqItemId: z.string({ required_error: 'RFQ Item ID is required' }),
  unitPrice: z.number({ required_error: 'Unit price is required' }).positive('Unit price must be greater than 0'),
});

const quotationCreateSchema = z.object({
  body: z.object({
    rfqId: z.string({ required_error: 'RFQ ID is required' }),
    notes: z.string().optional().nullable(),
    deliveryDays: z.number({ required_error: 'Delivery days is required' }).int().positive('Delivery days must be a positive integer'),
    items: z.array(quotationItemSchema).min(1, 'Quotation must have pricing for at least one line item'),
  }),
});

module.exports = { quotationCreateSchema };
