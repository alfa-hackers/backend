import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from 'domain/user.entity'
import { Socket } from 'socket.io'

@Injectable()
export class RoomConnectionService {
  private readonly logger = new Logger(RoomConnectionService.name)

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async handleConnection(socket: Socket, userTempId: string) {
    this.logger.log(`New socket connection: ${socket.id}`)
    this.logger.log(`userTempId: ${userTempId}`)

    if (!userTempId) {
      this.logger.error('userTempId is missing')
      throw new Error('userTempId is required')
    }

    let user = await this.userRepository.findOne({ where: { id: userTempId } })

    if (!user) {
      this.logger.log(`User not found. Creating new temp user with id: ${userTempId}`)
      user = this.userRepository.create({
        id: userTempId,
        username: `temp_${userTempId.slice(0, 8)}`,
        userTempId,
        role: 'temp',
        temp: true,
      })
      await this.userRepository.save(user)
      this.logger.log(`Temp user created and saved: ${user.id}`)
    } else {
      this.logger.log(`Existing user found: ${user.id}`)
    }

    return { user, userTempId }
  }
}
