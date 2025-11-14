import { Logger } from '@nestjs/common'
import * as cliColor from 'cli-color'
import { bootstrap } from './bootstrap/bootstrap'

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap')
  logger.error(cliColor.red('❌ Error during bootstrap:'), error)
  process.exit(1)
})
