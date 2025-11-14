import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Message } from 'domain/message.entity'
import { Room } from 'domain/room.entity'
import { User } from 'domain/user.entity'
import { GetUserMessagesDto, GetRoomMessagesDto } from 'controllers/messages/dto/messages.dto'
import { FastifyRequest } from 'fastify'
import { AuthService } from 'controllers/auth/services'

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name)

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authService: AuthService,
  ) {}

  private async getUserId(request: FastifyRequest): Promise<string> {
    try {
      const kratosUser = await this.authService.getCurrentUser(request)
      if (kratosUser?.id) return kratosUser.id
    } catch (err) {
      this.logger.error('Failed to get user from Kratos', err.stack || err.message)
    }

    const sessionUserId = request.session?.user_temp_id
    if (!sessionUserId) {
      throw new UnauthorizedException('User not found in Kratos or session')
    }
    return sessionUserId
  }

  async getMessagesByRoomId(dto: GetRoomMessagesDto, request: FastifyRequest) {
    const { roomId, limit, offset } = dto
    const userId = await this.getUserId(request)

    const room = await this.roomRepository.findOne({ where: { id: roomId } })
    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`)
    }

    const messages = await this.messageRepository.find({
      where: { roomId },
      relations: ['room', 'user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    })

    return { data: messages, meta: { total: messages.length, limit, offset, userId } }
  }

  async getMessagesByUserId(dto: GetUserMessagesDto, request: FastifyRequest) {
    const { roomId, limit, offset } = dto
    const userId = await this.getUserId(request)

    const userExists = await this.userRepository.findOne({ where: { id: userId } })
    if (!userExists) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    const whereCondition: any = { userId }
    if (roomId) whereCondition.roomId = roomId

    const messages = await this.messageRepository.find({
      where: whereCondition,
      relations: ['room', 'user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    })

    return { data: messages, meta: { total: messages.length, limit, offset, userId } }
  }

  async getMessageById(messageId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['room', 'user'],
    })

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`)
    }

    return message
  }
}
