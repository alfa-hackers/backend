import { z } from 'zod'

export const authSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(1, 'Username cannot be empty'),
  password: z.string().min(1, 'Password cannot be empty'),
})
