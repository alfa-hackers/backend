import * as fastifyCookie from '@fastify/cookie'
import * as fastifySession from '@fastify/session'
import * as fastifyCors from '@fastify/cors'
import { customRedisStore as redisStore } from 'session/providers'
import fastifyStatic from '@fastify/static'
import { join } from 'path'
import { fastifyMultipart } from '@fastify/multipart'
import { cookieConfig, multipartLimits } from 'session/constants'

const allowedOrigins = [
  'https://dev.whirav.ru',
  'https://whirav.ru',
  'http://localhost:3000',
  'http://localhost:3001',
]

export function registerFastifyPlugins(app) {
  const fastify = app.getHttpAdapter().getInstance()

  fastify.register(fastifyMultipart, {
    limits: multipartLimits,
  })

  fastify.register(fastifyCors, {
    origin: allowedOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })

  fastify.register(fastifyCookie)

  fastify.register(fastifyStatic, {
    root: join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
    acceptRange: true,
    cacheControl: true,
    maxAge: '1d',
  })

  fastify.register(fastifyStatic, {
    root: join(process.cwd(), 'static'),
    prefix: '/static/',
    acceptRange: true,
    cacheControl: true,
    maxAge: '1d',
    decorateReply: false,
  })

  fastify.register(fastifySession, {
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    cookieName: 'user_temp_id',
    cookie: cookieConfig,
    store: redisStore,
  })
  fastify.addHook('onRequest', async (req) => {
    if (!req.session.user_temp_id) {
      const tempId = crypto.randomUUID()

      req.session.user_temp_id = tempId
      await req.session.save()
    }
  })
}
