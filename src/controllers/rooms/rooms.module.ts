import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RoomsController } from 'controllers/rooms/rooms.controller'
import { RoomsService } from 'controllers/rooms/services/rooms.service'
import { Message } from 'domain/message.entity'
import { Room } from 'domain/room.entity'
import { User } from 'domain/user.entity'
import { UserRoom } from 'domain/user-room.entity'
import { AuthService } from 'controllers/auth/services'

@Module({
  imports: [TypeOrmModule.forFeature([Message, Room, User, UserRoom])],
  controllers: [RoomsController],
  providers: [RoomsService, AuthService],
  exports: [RoomsService],
})
export class RoomsModule {}
