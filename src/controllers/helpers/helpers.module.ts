import { Module } from '@nestjs/common'
import { UserTempController } from './user-temp.contoller'
import { AuthService } from 'controllers/auth/services'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from 'domain/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserTempController],
  providers: [AuthService],
})
export class HelpersModule {}
