import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import { ZodError, ZodSchema } from 'zod'

interface ZodValidatable {
  schema?: ZodSchema
}

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema?: ZodSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    const schema = this.schema || this.getSchemaFromDto(metadata)
    if (!schema) return value

    try {
      return schema.parse(value)
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        })
      }
      throw new BadRequestException('Validation failed')
    }
  }

  private getSchemaFromDto(metadata: ArgumentMetadata): ZodSchema | undefined {
    const dtoClass = metadata.metatype as unknown as ZodValidatable
    return dtoClass?.schema
  }
}
