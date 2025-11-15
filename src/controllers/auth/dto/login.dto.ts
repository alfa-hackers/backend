import { ApiProperty } from '@nestjs/swagger'
import { loginSchema } from 'controllers/auth/dto/login.schema'

export class LoginDto {
  static schema = loginSchema

  @ApiProperty()
  username?: string

  @ApiProperty()
  password: string

  @ApiProperty({ required: false })
  email: string
}
