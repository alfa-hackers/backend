import { Controller, Post, Body, InternalServerErrorException } from '@nestjs/common'
import { MinioService } from './minio.service'
import { ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger'

class DownloadFileDto {
  fileUrl: string
}

@ApiTags('minio')
@Controller('presigned')
export class FilesController {
  constructor(private readonly minioService: MinioService) {}

  @Post('download')
  @ApiBody({
    type: DownloadFileDto,
    description: 'Path to the file in MinIO, e.g., chat-files/example.pdf',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Pre-signed URL for downloading the file',
    schema: {
      example: {
        url: 'http://localhost:9000/chat-files/example.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256...',
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async downloadFile(@Body() body: DownloadFileDto) {
    const { fileUrl } = body
    try {
      const parsed = new URL(fileUrl, 'http://dummy')
      const pathname = parsed.pathname.startsWith('/') ? parsed.pathname.slice(1) : parsed.pathname
      const [bucket, ...fileParts] = pathname.split('/')
      const fileName = fileParts.join('/')
      const url = await this.minioService.getPresignedUrl(bucket, fileName, 60 * 60)
      return { url }
    } catch (error) {
      throw new InternalServerErrorException(error, 'Ошибка при получении pre-signed URL')
    }
  }
}
