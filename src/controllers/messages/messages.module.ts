import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MessagesController } from 'controllers/messages/messages.controller'
import { MessagesService } from 'controllers/messages/services/messages.service'
import { Message } from 'domain/message.entity'
import { Room } from 'domain/room.entity'
import { User } from 'domain/user.entity'
import { UserRoom } from 'domain/user-room.entity'
import { AuthModule } from 'controllers/auth/auth.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Room, User, UserRoom]),
    AuthModule, // <- здесь импорт
  ],
  controllers: [MessagesController],
  providers: [MessagesService], // AuthService убрали
  exports: [MessagesService],
})
export class MessagesModule {}
