import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { FastifyRequest } from 'fastify'
import { IS_PUBLIC_KEY } from 'common/decorators/public.decorator'
import axios from 'axios'

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>()
    const cookie = request.headers['cookie']

    if (!cookie) {
      throw new ForbiddenException('No session cookie found')
    }

    try {
      await axios.get(`${process.env.KRATOS_PUBLIC_URL}/sessions/whoami`, {
        headers: { cookie },
        withCredentials: true,
      })

      return true
    } catch {
      throw new ForbiddenException('Invalid or expired session')
    }
  }
}
