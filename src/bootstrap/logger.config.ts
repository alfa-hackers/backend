import { Logger } from '@nestjs/common'
import * as cliColor from 'cli-color'

export const bootstrapLogger = new Logger('Bootstrap')

export const logStartup = () => {
    bootstrapLogger.log(cliColor.green('✅ Starting NestJS (Fastify) application...'))
    bootstrapLogger.log('')
}

export const logRunning = (baseUrl: string) => {
    bootstrapLogger.log(cliColor.blue(`🌐 Application is running on: ${baseUrl}`))
    bootstrapLogger.log(cliColor.cyan(`📚 Swagger documentation available at: ${baseUrl}/api`))
}
