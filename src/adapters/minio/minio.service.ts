import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import * as Minio from 'minio'

@Injectable()
export class MinioService {
  private readonly minioClient: Minio.Client
  private readonly logger = new Logger(MinioService.name)

  constructor() {
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT,
      port: Number(process.env.MINIO_PORT),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
    })
  }

  async uploadFile(
    bucketName: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string> {
    try {
      const exists = await this.minioClient.bucketExists(bucketName)
      if (!exists) {
        this.logger.log(`Бакет "${bucketName}" не существует. Создаю новый...`)
        await this.minioClient.makeBucket(bucketName, 'us-east-1')
        this.logger.log(`Бакет "${bucketName}" успешно создан.`)
      }

      await this.minioClient.putObject(bucketName, fileName, fileBuffer, fileBuffer.length, {
        'Content-Type': contentType,
      })

      this.logger.log(`Файл "${fileName}" успешно загружен в бакет "${bucketName}".`)
      return `${bucketName}/${fileName}`
    } catch (error) {
      this.logger.error(`Ошибка при загрузке файла "${fileName}" в бакет "${bucketName}": ${error}`)
      throw new InternalServerErrorException('Ошибка при загрузке файла в MinIO')
    }
  }

  async getPresignedUrl(
    bucketName: string,
    fileName: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    try {
      const url = await this.minioClient.presignedGetObject(bucketName, fileName, expiresInSeconds)
      this.logger.log(
        `Pre-signed URL для файла "${fileName}" в бакете "${bucketName}" успешно сгенерирован.`,
      )
      return url
    } catch (error) {
      this.logger.error(
        `Ошибка при получении pre-signed URL для файла "${fileName}" в бакете "${bucketName}": ${error}`,
      )
      throw new InternalServerErrorException('Ошибка при получении pre-signed URL')
    }
  }
}
