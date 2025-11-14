import { z } from 'zod'

export const getUserMessagesSchema = z.object({
  roomId: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
})

export const getRoomMessagesSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
})

export type GetRoomMessagesType = z.infer<typeof getRoomMessagesSchema>
export type GetUserMessagesType = z.infer<typeof getUserMessagesSchema>
