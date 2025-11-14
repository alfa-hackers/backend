import { Injectable, ForbiddenException, HttpStatus, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AuthDto, LoginDto } from 'controllers/auth/dto'
import { Configuration, IdentityApi, FrontendApi } from '@ory/kratos-client'
import { FastifyRequest, FastifyReply } from 'fastify'
import { User } from 'domain/user.entity'
import axios from 'axios'

@Injectable()
export class AuthService {
  private readonly kratosAdmin: IdentityApi
  private readonly kratosPublic: FrontendApi
  private readonly kratosPublicUrl: string

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.kratosPublicUrl = process.env.KRATOS_PUBLIC_URL

    const adminConfig = new Configuration({
      basePath: process.env.KRATOS_ADMIN_URL,
      baseOptions: { timeout: 5000 },
    })

    const publicConfig = new Configuration({
      basePath: this.kratosPublicUrl,
      baseOptions: { timeout: 5000 },
    })

    this.kratosAdmin = new IdentityApi(adminConfig)
    this.kratosPublic = new FrontendApi(publicConfig)
  }

  private async fetchFlow(endpoint: string, cookie?: string) {
    const response = await axios.get(`${this.kratosPublicUrl}/self-service/${endpoint}/browser`, {
      headers: cookie ? { cookie } : {},
      withCredentials: true,
      maxRedirects: 0,
      validateStatus: (status) => status < 400,
    })

    const flow = response.data
    const flowCookies = response.headers['set-cookie'] || []
    const csrfToken = flow.ui.nodes.find((node: any) => node.attributes.name === 'csrf_token')
      ?.attributes.value

    const allCookies = [...(cookie ? [cookie] : []), ...flowCookies].join('; ')

    return { flow, csrfToken, allCookies }
  }

  private async postFlow(endpoint: string, flowId: string, data: any, cookies: string) {
    const response = await axios.post(
      `${this.kratosPublicUrl}/self-service/${endpoint}?flow=${flowId}`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookies,
        },
        withCredentials: true,
        maxRedirects: 0,
        validateStatus: (status) => status < 400,
      },
    )
    return { data: response.data, cookies: response.headers['set-cookie'] }
  }

  async getCurrentUser(req: FastifyRequest) {
    const cookie = req.headers.cookie
    if (!cookie) return null

    try {
      const response = await axios.get(`${this.kratosPublicUrl}/sessions/whoami`, {
        headers: { cookie },
        withCredentials: true,
      })

      const kratosIdentity = response.data.identity
      if (!kratosIdentity) return null

      let user = await this.getUserFromSession(kratosIdentity.id)
      if (!user) {
        user = await this.syncUserToPostgres(kratosIdentity)
      }

      return user
    } catch (error) {
      return error
    }
  }

  private handleAxiosError(err: any, defaultMessage: string) {
    const errorMessage =
      err.response?.data?.ui?.messages?.[0]?.text ||
      err.response?.data?.error?.message ||
      err.response?.data?.message ||
      err.message
    throw new ForbiddenException(`${defaultMessage}: ${errorMessage}`)
  }

  private setCookies(res: FastifyReply, cookies?: string[]) {
    if (cookies) {
      cookies.forEach((cookie: string) => {
        res.header('set-cookie', cookie)
      })
    }
  }

  private async syncUserToPostgres(kratosIdentity: any): Promise<User> {
    if (!kratosIdentity) {
      throw new ForbiddenException('Kratos identity not found')
    }

    const kratosId = kratosIdentity.id
    const traits = kratosIdentity.traits

    let user = await this.userRepository.findOne({
      where: { id: kratosId },
    })

    if (user) {
      user.username = traits.username
      user.email = traits.email
      user.temp = false
      return await this.userRepository.save(user)
    }

    const existingByUsername = await this.userRepository.findOne({
      where: { username: traits.username },
    })

    if (existingByUsername && existingByUsername.id !== kratosId) {
      throw new ConflictException('Username already exists')
    }

    if (traits.email) {
      const existingByEmail = await this.userRepository.findOne({
        where: { email: traits.email },
      })

      if (existingByEmail && existingByEmail.id !== kratosId) {
        throw new ConflictException('Email already exists')
      }
    }

    user = this.userRepository.create({
      id: kratosId,
      username: traits.username,
      email: traits.email,
      role: 'user',
    })

    return await this.userRepository.save(user)
  }

  async getUserFromSession(kratosIdentityId: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id: kratosIdentityId },
    })
  }

  async handleSignup(dto: AuthDto, req: FastifyRequest, res: FastifyReply) {
    try {
      const cookie = req.headers.cookie
      const { flow, csrfToken, allCookies } = await this.fetchFlow('registration', cookie)

      const result = await this.postFlow(
        'registration',
        flow.id,
        {
          method: 'password',
          password: dto.password,
          traits: { email: dto.email, username: dto.username },
          csrf_token: csrfToken,
        },
        allCookies,
      )

      const user = await this.syncUserToPostgres(result.data.identity)

      this.setCookies(res, result.cookies)

      return res.status(HttpStatus.CREATED).send({
        message: 'User successfully registered',
        session: result.data.session,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      })
    } catch (err) {
      if (err instanceof ConflictException) {
        throw err
      }
      this.handleAxiosError(err, 'Cannot register user')
    }
  }

  async handleLogin(dto: LoginDto, req: FastifyRequest, res: FastifyReply) {
    try {
      const cookie = req.headers.cookie
      const { flow, csrfToken, allCookies } = await this.fetchFlow('login', cookie)

      const result = await this.postFlow(
        'login',
        flow.id,
        {
          method: 'password',
          password: dto.password,
          identifier: dto.email || dto.username,
          csrf_token: csrfToken,
        },
        allCookies,
      )

      this.setCookies(res, result.cookies)

      const sessionCookie = result.cookies?.join('; ') || allCookies

      const whoamiResponse = await axios.get(`${this.kratosPublicUrl}/sessions/whoami`, {
        headers: { cookie: sessionCookie },
        withCredentials: true,
      })

      const kratosIdentity = whoamiResponse.data.identity

      if (!kratosIdentity) {
        throw new ForbiddenException('Identity not found after login')
      }

      const user = await this.syncUserToPostgres(kratosIdentity)

      return res.status(HttpStatus.OK).send({
        message: 'User successfully logged in',
        session: whoamiResponse.data,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url,
        },
      })
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof ConflictException) {
        throw err
      }

      this.handleAxiosError(err, 'Login failed')
    }
  }

  async handleLogout(req: FastifyRequest, res: FastifyReply) {
    const cookie = req.headers.cookie
    if (!cookie) {
      return res.status(HttpStatus.BAD_REQUEST).send({ message: 'No session cookie provided' })
    }

    try {
      const flowResponse = await axios.get(`${this.kratosPublicUrl}/self-service/logout/browser`, {
        headers: { cookie },
        withCredentials: true,
        maxRedirects: 0,
        validateStatus: (status) => status < 400,
      })

      const logoutUrl = flowResponse.data.logout_url
      const response = await axios.get(logoutUrl, {
        headers: { cookie },
        withCredentials: true,
        maxRedirects: 0,
        validateStatus: (status) => status < 400,
      })

      this.setCookies(res, response.headers['set-cookie'])

      return res.send({ message: 'User successfully logged out' })
    } catch (err) {
      this.handleAxiosError(err, 'Logout failed')
    }
  }

  async handleGetCurrentUser(req: FastifyRequest, res: FastifyReply) {
    const cookie = req.headers.cookie
    if (!cookie) {
      return res.status(HttpStatus.UNAUTHORIZED).send({ message: 'No session cookie provided' })
    }

    try {
      const response = await axios.get(`${this.kratosPublicUrl}/sessions/whoami`, {
        headers: { cookie },
        withCredentials: true,
      })

      const kratosIdentity = response.data.identity

      const user = await this.getUserFromSession(kratosIdentity.id)

      if (!user) {
        const syncedUser = await this.syncUserToPostgres(kratosIdentity)
        return res.send({
          user: {
            id: syncedUser.id,
            username: syncedUser.username,
            email: syncedUser.email,
            role: syncedUser.role,
            avatar_url: syncedUser.avatar_url,
          },
        })
      }

      return res.send({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      })
    } catch {
      throw new ForbiddenException('Not logged in')
    }
  }

  async handleGetCurrentUserId(req: FastifyRequest, res: FastifyReply) {
    const cookie = req.headers.cookie
    if (!cookie) {
      return res.status(HttpStatus.UNAUTHORIZED).send({ message: 'No session cookie provided' })
    }

    try {
      const response = await axios.get(`${this.kratosPublicUrl}/sessions/whoami`, {
        headers: { cookie },
        withCredentials: true,
      })

      const kratosIdentity = response.data.identity

      const user = await this.getUserFromSession(kratosIdentity.id)

      if (!user) {
        const syncedUser = await this.syncUserToPostgres(kratosIdentity)
        return res.send({ userId: syncedUser.id })
      }

      return res.send({ userId: user.id })
    } catch (error) {
      throw new ForbiddenException(error, 'Not logged in')
    }
  }

  async updateUserProfile(userId: string, updateData: Partial<User>): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } })

    if (!user) {
      throw new ForbiddenException('User not found')
    }

    if (updateData.avatar_url !== undefined) {
      user.avatar_url = updateData.avatar_url
    }
    if (updateData.role !== undefined) {
      user.role = updateData.role
    }

    return await this.userRepository.save(user)
  }
}
