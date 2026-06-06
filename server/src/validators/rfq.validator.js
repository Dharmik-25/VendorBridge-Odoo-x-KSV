const { z } = require('zod');

const rfqItemSchema = z.object({
  productName: z.string({ required_error: 'Product name is required' }).min(2, 'Product name must be at least 2 characters'),
  quantity: z.number({ required_error: 'Quantity is required' }).positive('Quantity must be greater than 0'),
  unit: z.string().default('pcs'),
  specifications: z.string().optional().nullable(),
});

const rfqCreateSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(5, 'Title must be at least 5 characters').max(200),
    description: z.string().optional().nullable(),
    deadline: z.string({ required_error: 'Deadline is required' }).refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date > new Date();
    }, { message: 'Deadline must be a valid future date' }),
    items: z.array(rfqItemSchema).min(1, 'RFQ must have at least one line item'),
    vendorIds: z.array(z.string()).min(1, 'Must invite at least one vendor'),
  }),
});

module.exports = { rfqCreateSchema };
