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
    this.logger.log(
      `MinIO client initialized with endpoint: ${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
    )
  }

  async uploadFile(
    bucketName: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string> {
    try {
      this.logger.log(`Проверка существования бакета: ${bucketName}`)
      const exists = await this.minioClient.bucketExists(bucketName)
      if (!exists) {
        this.logger.log(`Бакет не найден, создаем: ${bucketName}`)
        await this.minioClient.makeBucket(bucketName, 'us-east-1')
        this.logger.log(`Бакет создан: ${bucketName}`)
      }

      this.logger.log(`Загрузка файла: ${fileName} в бакет: ${bucketName}`)
      await this.minioClient.putObject(bucketName, fileName, fileBuffer, fileBuffer.length, {
        'Content-Type': contentType,
      })
      this.logger.log(`Файл успешно загружен: ${bucketName}/${fileName}`)

      return `${bucketName}/${fileName}`
    } catch (error) {
      this.logger.error(
        `Ошибка при загрузке файла: ${fileName} в бакет: ${bucketName}`,
        error.stack,
      )
      throw new InternalServerErrorException(error, 'Ошибка при загрузке файла в MinIO')
    }
  }

  async getPresignedUrl(
    bucketName: string,
    fileName: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    try {
      this.logger.log(
        `Генерация presigned URL для файла: ${bucketName}/${fileName}, срок: ${expiresInSeconds} сек.`,
      )
      const url = await this.minioClient.presignedGetObject(bucketName, fileName, expiresInSeconds)
      this.logger.log(`Presigned URL сгенерирован: ${url}`)
      return url
    } catch (error) {
      this.logger.error(
        `Ошибка при получении presigned URL для файла: ${bucketName}/${fileName}`,
        error.stack,
      )
      throw new InternalServerErrorException(error, 'Ошибка при получении pre-signed URL')
    }
  }
}
