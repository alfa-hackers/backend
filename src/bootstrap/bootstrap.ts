import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from 'app.module'
import { SwaggerModule } from '@nestjs/swagger'
import * as cliColor from 'cli-color'
import { registerFastifyPlugins } from 'session'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import Fastify from 'fastify'
import { ZodValidationPipe } from 'common/pipes'
import { options, swaggerConfig } from './'
import { Logger } from '@nestjs/common'

export async function bootstrap() {
  const logger = new Logger('Bootstrap')
  const nodeEnv = process.env.NODE_ENV
  let baseUrl

  logger.log(cliColor.green('✅ Starting NestJS (Fastify) application...'))
  logger.log('')

  const host = process.env.HOST
  const port = parseInt(process.env.BACKEND_PORT)

  if (nodeEnv === 'production') {
    baseUrl = `https://${host}:${port}`
  } else {
    baseUrl = `http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`
  }

  const fastifyInstance = Fastify({
    logger: false,
    bodyLimit: parseInt(process.env.BODY_LIMIT, 10),
    connectionTimeout: parseInt(process.env.CONNECTION_TIMEOUT, 10),
  })

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(fastifyInstance),
  )

  app.useGlobalPipes(new ZodValidationPipe())

  await registerFastifyPlugins(app)

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api', app as any, document, options)

  await app.listen(port, host)

  logger.log(cliColor.blue(`🌐 Application is running on: ${baseUrl}`))
  logger.log(cliColor.cyan(`📚 Swagger documentation available at: ${baseUrl}/api`))
}
