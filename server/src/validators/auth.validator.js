const { z } = require('zod');

const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
  }),
});

const registerSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(2, 'Name must be at least 2 characters').max(100),
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
    role: z.enum(['admin', 'procurement_officer', 'manager', 'vendor']).default('vendor'),
  }),
});

module.exports = { loginSchema, registerSchema };
