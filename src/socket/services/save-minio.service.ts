import { Injectable } from '@nestjs/common'
import { FileAttachment } from '../socket.interface'
import { MinioService } from 'adapters/minio/minio.service'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class SaveMinioService {
  constructor(private readonly minioService: MinioService) {}

  async saveFile(attachment: FileAttachment, roomId: string): Promise<string> {
    const bucketName = process.env.MINIO_BUCKET_NAME || 'chat-files'
    const fileExtension = attachment.filename.split('.').pop()
    const uniqueFileName = `${roomId}/${uuidv4()}.${fileExtension}`
    const fileBuffer = Buffer.from(attachment.data, 'base64')
    const filePath = await this.minioService.uploadFile(
      bucketName,
      uniqueFileName,
      fileBuffer,
      attachment.mimeType,
    )

    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'
    const minioEndpoint = process.env.MINIO_ENDPOINT
    const minioPort = process.env.MINIO_PORT

    return `${protocol}://${minioEndpoint}:${minioPort}/${filePath}`
  }
}
