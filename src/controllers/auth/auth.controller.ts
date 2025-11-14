import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AuthDto, LoginDto } from 'controllers/auth/dto'
import { AuthService } from 'controllers/auth/services/auth.service'
import { FastifyRequest, FastifyReply } from 'fastify'
import { Public } from 'common/decorators'

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: AuthDto, @Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.authService.handleSignup(dto, req, res)
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.authService.handleLogin(dto, req, res)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.authService.handleLogout(req, res)
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return this.authService.handleGetCurrentUser(req, res)
  }
}
