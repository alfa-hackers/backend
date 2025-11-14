import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes'
import { DocumentBuilder } from '@nestjs/swagger'

export const theme = new SwaggerTheme()
export const options = {
  explorer: true,
  customCss: theme.getBuffer(SwaggerThemeNameEnum.DARK),
}

export const swaggerConfig = new DocumentBuilder()
  .setTitle('NestJS API')
  .setDescription(
    `
      NestJS Boilerplate  
      TypeORM  
      PostgreSQL
    `,
  )
  .setVersion('6.6.6')
  .build()
