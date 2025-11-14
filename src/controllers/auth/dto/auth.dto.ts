import { ApiProperty } from '@nestjs/swagger'
import { authSchema } from 'controllers/auth/dto/auth.schema'

export class AuthDto {
  static schema = authSchema

  @ApiProperty()
  email?: string

  @ApiProperty()
  username: string

  @ApiProperty()
  password: string
}
