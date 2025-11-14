import { z } from 'zod'

export const loginSchema = z
  .object({
    email: z.string().email().optional(),
    username: z.string().min(1, 'Username cannot be empty').optional(),
    password: z.string().min(1, 'Password cannot be empty'),
  })
  .refine((data) => data.email || data.username, {
    message: 'Either email or username must be provided',
    path: ['email'],
  })
