import { z } from 'zod';

const emailField = z.string().trim().email({ message: 'Invalid email format' });
const usernameField = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(150, 'Username must be at most 150 characters')
  .regex(/^[a-zA-Z0-9._-]+$/, 'Username contains invalid characters');

const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(255, 'Password must be at most 255 characters');

export const loginSchema = z
  .object({
    email: emailField.optional(),
    username: usernameField.optional(),
    password: passwordField,
  })
  .refine((data) => data.email || data.username, {
    message: 'Email or username is required',
    path: ['email'],
  });

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(150, 'Name must be at most 150 characters'),
  email: emailField,
  password: passwordField,
  role: z.string().trim().min(2, 'Role is required'),
  schoolId: z.union([z.string(), z.number(), z.bigint()]).optional(),
  created_by_owner_id: z.union([z.string(), z.number(), z.bigint()]).optional(),
  relational_id: z.union([z.string(), z.number(), z.bigint()]).optional(),
  username: usernameField.optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: passwordField,
  newPassword: passwordField.refine((value, ctx) => {
    if (value === ctx.parent.currentPassword) {
      return false;
    }
    return true;
  }, 'New password must be different from current password'),
});

