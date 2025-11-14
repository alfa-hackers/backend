import { Controller, Post, Delete, Param, HttpCode, HttpStatus, Req, Logger } from '@nestjs/common'
import { RoomsService } from 'controllers/rooms/services/rooms.service'
import { FastifyRequest } from 'fastify'
import { AuthService } from 'controllers/auth/services'

@Controller('rooms')
export class RoomsController {
  private readonly logger = new Logger(RoomsController.name)

  constructor(
    private readonly roomsService: RoomsService,
    private readonly authService: AuthService,
  ) {}

  @Post('/by-user')
  async getUserRooms(@Req() request: FastifyRequest) {
    try {
      const userId = await this.roomsService.extractUserId(request, this.authService)
      if (!userId) return []
      return this.roomsService.getRoomsByUserId(userId)
    } catch (error) {
      this.logger.error('Error fetching user rooms', error.stack || error.message)
      return []
    }
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  async deleteRoom(@Param('id') id: string) {
    return this.roomsService.deleteRoom(id)
  }
}
