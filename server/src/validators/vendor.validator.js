const { z } = require('zod');

// GST 15-char alphanumeric Indian GST regex helper
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
// Phone: 10 digit regex helper
const phoneRegex = /^[0-9]{10}$/;

const vendorCreateSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Vendor name is required' }).min(2, 'Name must be at least 2 characters').max(150),
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    phone: z.string().regex(phoneRegex, 'Phone number must be exactly 10 digits').optional().or(z.literal('')),
    category: z.enum(['IT', 'Furniture', 'Logistics', 'Stationery'], {
      errorMap: () => ({ message: 'Category must be one of: IT, Furniture, Logistics, Stationery' }),
    }),
    gstNumber: z.string().regex(gstRegex, 'GST number must be a valid 15-character Indian GST format (e.g. 27ABCDE1234F1Z5)').optional().or(z.literal('')),
    country: z.string().min(2, 'Country must be at least 2 characters').default('India'),
    status: z.enum(['pending', 'approved', 'rejected', 'suspended']).default('pending'),
  }),
});

const vendorUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150).optional(),
    email: z.string().email().optional(),
    phone: z.string().regex(phoneRegex, 'Phone number must be exactly 10 digits').optional().or(z.literal('')),
    category: z.enum(['IT', 'Furniture', 'Logistics', 'Stationery']).optional(),
    gstNumber: z.string().regex(gstRegex, 'GST number must be a valid 15-character Indian GST format').optional().or(z.literal('')),
    country: z.string().min(2).optional(),
    status: z.enum(['pending', 'approved', 'rejected', 'suspended']).optional(),
    rating: z.number().min(0).max(5).optional(),
  }),
});

module.exports = { vendorCreateSchema, vendorUpdateSchema };
