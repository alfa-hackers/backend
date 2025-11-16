import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common'
import * as Minio from 'minio'

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly minioClient: Minio.Client
  private readonly publicClient: Minio.Client
  private readonly logger = new Logger(MinioService.name)
  private isConnected = false
  private readonly publicEndpoint: string
  private readonly internalEndpoint: string
  private readonly isProduction: boolean

  constructor() {
    if (
      !process.env.MINIO_ENDPOINT ||
      !process.env.MINIO_ACCESS_KEY ||
      !process.env.MINIO_SECRET_KEY
    ) {
      throw new Error('MinIO configuration is incomplete')
    }

    const port = 9000
    const useSSL = process.env.MINIO_USE_SSL === 'true'
    this.isProduction = process.env.NODE_ENV === 'production'

    this.internalEndpoint = `${useSSL ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT}:${port}`
    this.publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT || 'http://minio.whirav.ru'

    this.logger.log(
      `Инициализация MinIO клиента: ${process.env.MINIO_ENDPOINT}:${port} (SSL: ${useSSL})`,
    )
    this.logger.log(`Внутренний endpoint: ${this.internalEndpoint}`)
    this.logger.log(`Публичный endpoint: ${this.publicEndpoint}`)
    this.logger.log(`Режим: ${this.isProduction ? 'production' : 'development'}`)

    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT,
      port: port,
      useSSL: useSSL,
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      region: 'us-east-1',
      pathStyle: true,
    })

    const publicUrl = new URL(this.publicEndpoint)
    this.publicClient = new Minio.Client({
      endPoint: publicUrl.hostname,
      port: publicUrl.port ? parseInt(publicUrl.port) : publicUrl.protocol === 'https:' ? 443 : 80,
      useSSL: publicUrl.protocol === 'https:',
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      region: 'us-east-1',
      pathStyle: true,
    })
  }

  async onModuleInit() {
    await this.ensureConnection()
  }

  private async ensureConnection(): Promise<void> {
    let retries = 5
    while (retries > 0 && !this.isConnected) {
      try {
        this.logger.log(`Проверка подключения к MinIO (попыток осталось: ${retries})...`)
        const buckets = await this.minioClient.listBuckets()
        this.isConnected = true
        this.logger.log(`✅ Успешное подключение к MinIO. Найдено бакетов: ${buckets.length}`)

        await this.ensureBucketExists('chat-files')
        return
      } catch (error) {
        retries--
        this.logger.error(`❌ Ошибка подключения к MinIO: ${error.message}`)
        if (retries > 0) {
          this.logger.log('Повторная попытка через 2 секунды...')
          await new Promise((resolve) => setTimeout(resolve, 2000))
        }
      }
    }

    if (!this.isConnected) {
      this.logger.error('❌ Не удалось подключиться к MinIO после нескольких попыток')
      throw new Error('MinIO connection failed')
    }
  }

  private async ensureBucketExists(bucketName: string): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(bucketName)
      if (!exists) {
        this.logger.log(`Создание бакета "${bucketName}"...`)
        await this.minioClient.makeBucket(bucketName, 'us-east-1')

        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucketName}/*`],
            },
          ],
        }
        await this.minioClient.setBucketPolicy(bucketName, JSON.stringify(policy))

        this.logger.log(`✅ Бакет "${bucketName}" создан и настроен`)
      } else {
        this.logger.log(`Бакет "${bucketName}" уже существует`)
      }
    } catch (error) {
      if (error.code === 'BucketAlreadyOwnedByYou' || error.code === 'BucketAlreadyExists') {
        this.logger.log(`Бакет "${bucketName}" уже существует`)
        return
      }
      this.logger.error(`Ошибка при работе с бакетом "${bucketName}": ${error.message}`)
      throw error
    }
  }

  /**
   * Очищает fileUrl от полного URL, оставляя только путь bucket/path/to/file
   */
  private cleanFileUrl(fileUrl: string): string {
    let cleanUrl = fileUrl

    // Если это полный URL, извлекаем только путь
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      try {
        const urlObj = new URL(cleanUrl)
        // Убираем начальный слэш из pathname
        cleanUrl = urlObj.pathname.substring(1)
      } catch (error) {
        this.logger.warn(error, `Не удалось распарсить URL: ${fileUrl}`)
      }
    }

    this.logger.log(`Очищенный fileUrl: "${fileUrl}" -> "${cleanUrl}"`)
    return cleanUrl
  }

  async uploadFile(
    bucketName: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string> {
    if (!this.isConnected) {
      this.logger.warn('MinIO не подключен, попытка переподключения...')
      await this.ensureConnection()
    }

    try {
      this.logger.log(
        `Загрузка файла "${fileName}" в бакет "${bucketName}" (размер: ${fileBuffer.length} bytes)`,
      )

      await this.ensureBucketExists(bucketName)

      const metaData = {
        'Content-Type': contentType,
      }

      const result = await this.minioClient.putObject(
        bucketName,
        fileName,
        fileBuffer,
        fileBuffer.length,
        metaData,
      )

      this.logger.log(`✅ Файл "${fileName}" успешно загружен. ETag: ${result.etag}`)
      return `${bucketName}/${fileName}`
    } catch (error) {
      this.logger.error(`❌ Ошибка при загрузке файла "${fileName}":`)
      this.logger.error(`Тип: ${error.constructor.name}`)
      this.logger.error(`Код: ${error.code || 'N/A'}`)
      this.logger.error(`Сообщение: ${error.message || 'N/A'}`)
      this.logger.error(`Детали:`, JSON.stringify(error, null, 2))

      this.isConnected = false

      throw new InternalServerErrorException(
        `Ошибка при загрузке файла в MinIO: ${error.message || 'Неизвестная ошибка'}`,
      )
    }
  }

  async getPresignedUrl(fileUrl: string, expiresInSeconds = 3600): Promise<string> {
    try {
      // Очищаем fileUrl от полного URL
      const cleanUrl = this.cleanFileUrl(fileUrl)

      const [bucketName, ...filePathParts] = cleanUrl.split('/')
      const fileName = filePathParts.join('/')

      if (!bucketName || !fileName) {
        throw new Error('Неверный формат fileUrl. Ожидается: bucket/path/to/file')
      }

      let publicUrl = await this.publicClient.presignedGetObject(
        bucketName,
        fileName,
        expiresInSeconds,
      )

      // Подменяем http на https только в production
      if (this.isProduction && publicUrl.startsWith('http://')) {
        publicUrl = publicUrl.replace('http://', 'https://')
        this.logger.log(`🔒 URL преобразован в HTTPS для production`)
      }

      this.logger.log(`✅ Pre-signed URL создан для "${fileUrl}"`)
      this.logger.log(`   Bucket: ${bucketName}`)
      this.logger.log(`   File: ${fileName}`)
      this.logger.log(`   URL: ${publicUrl}`)

      return publicUrl
    } catch (error) {
      this.logger.error(`❌ Ошибка создания pre-signed URL для "${fileUrl}": ${error.message}`)
      throw new InternalServerErrorException(
        `Ошибка при получении pre-signed URL: ${error.message || error}`,
      )
    }
  }

  async deleteFile(bucketName: string, fileName: string): Promise<void> {
    try {
      await this.minioClient.removeObject(bucketName, fileName)
      this.logger.log(`✅ Файл "${fileName}" удален из бакета "${bucketName}"`)
    } catch (error) {
      this.logger.error(`❌ Ошибка удаления файла "${fileName}": ${error.message}`)
      throw new InternalServerErrorException(`Ошибка при удалении файла: ${error.message}`)
    }
  }
}
