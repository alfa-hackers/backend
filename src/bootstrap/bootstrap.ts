import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from 'app.module'
import { SwaggerModule } from '@nestjs/swagger'
import { registerFastifyPlugins } from 'session'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import Fastify from 'fastify'
import { ZodValidationPipe } from 'common/pipes'
import { options, swaggerConfig } from './'
import { logStartup, logRunning } from './'
import { getServerConfig } from './'

export async function bootstrap() {
  logStartup()

  const { host, port, baseUrl } = getServerConfig()

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

  logRunning(baseUrl)
}
