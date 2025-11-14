import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Room } from 'domain/room.entity'
import { FastifyRequest } from 'fastify'
import { AuthService } from 'controllers/auth/services'
import { User } from 'domain/user.entity'
@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async extractUserId(request: FastifyRequest, authService: AuthService): Promise<string | null> {
    if (request.headers.cookie) {
      const currentUser = await authService.getCurrentUser(request)
      if (currentUser?.id) return currentUser.id
    }
    return request.session?.user_temp_id || null
  }

  async getRoomsByUserId(userId: string) {
    if (!userId) throw new UnauthorizedException('User ID not provided')

    const userExists = await this.userRepository.findOne({ where: { id: userId } })
    if (!userExists) throw new NotFoundException(`User with ID ${userId} not found`)

    const rooms = await this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.owner', 'owner')
      .leftJoin('room.userRooms', 'userRoom')
      .where('userRoom.userId = :userId', { userId })
      .orderBy('room.createdAt', 'DESC')
      .getMany()

    return { data: rooms, meta: { total: rooms.length } }
  }

  async deleteRoom(roomId: string) {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['owner'],
    })

    if (!room) throw new NotFoundException(`Room with ID ${roomId} not found`)

    await this.roomRepository.remove(room)
    return { success: true, message: 'Room deleted successfully' }
  }
}
