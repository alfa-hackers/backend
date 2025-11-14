import { Controller, Get, Req, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { FastifyRequest } from 'fastify'
import { AuthService } from 'controllers/auth/services'

@Controller('user-temp')
export class UserTempController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getUserTempId(@Req() req: FastifyRequest) {
    try {
      let userId: string | null = null

      if (req.headers.cookie) {
        const currentUser = await this.authService.getCurrentUser(req)
        if (currentUser?.id) {
          userId = currentUser.id
        }
      }

      if (!userId) {
        userId = req.session?.user_temp_id || null
      }

      return { userTempId: userId }
    } catch (error) {
      Logger.error('Error fetching userTempId', error)
      return { userTempId: null }
    }
  }
}
