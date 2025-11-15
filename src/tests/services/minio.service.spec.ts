import { Test, TestingModule } from '@nestjs/testing'
import { MinioService } from 'adapters/minio/minio.service'
import { InternalServerErrorException } from '@nestjs/common'
import * as Minio from 'minio'

const minioClientMock = {
    bucketExists: jest.fn(),
    makeBucket: jest.fn(),
    putObject: jest.fn(),
    presignedGetObject: jest.fn(),
}

jest.mock('minio', () => {
    return {
        Client: jest.fn().mockImplementation(() => minioClientMock),
    }
})

describe('MinioService', () => {
    let service: MinioService

    beforeEach(async () => {
        jest.clearAllMocks()

        const module: TestingModule = await Test.createTestingModule({
            providers: [MinioService],
        }).compile()

        service = module.get<MinioService>(MinioService)
    })

    describe('uploadFile', () => {
        const bucketName = 'test-bucket'
        const fileName = 'file.txt'
        const fileBuffer = Buffer.from('hello')
        const contentType = 'text/plain'

        it('должен загрузить файл и вернуть путь', async () => {
            minioClientMock.bucketExists.mockResolvedValue(false)
            minioClientMock.makeBucket.mockResolvedValue(undefined)
            minioClientMock.putObject.mockResolvedValue(undefined)

            const result = await service.uploadFile(bucketName, fileName, fileBuffer, contentType)

            expect(result).toBe(`${bucketName}/${fileName}`)
            expect(minioClientMock.bucketExists).toHaveBeenCalledWith(bucketName)
            expect(minioClientMock.makeBucket).toHaveBeenCalledWith(bucketName, 'us-east-1')
            expect(minioClientMock.putObject).toHaveBeenCalled()
        })

        it('должен выбросить ошибку при неуспехе', async () => {
            minioClientMock.bucketExists.mockRejectedValue(new Error('test error'))

            await expect(
                service.uploadFile(bucketName, fileName, fileBuffer, contentType),
            ).rejects.toThrow(InternalServerErrorException)
        })
    })

    describe('getPresignedUrl', () => {
        const bucketName = 'test-bucket'
        const fileName = 'file.txt'

        it('должен вернуть presigned url', async () => {
            minioClientMock.presignedGetObject.mockResolvedValue('http://localhost/presigned')

            const url = await service.getPresignedUrl(bucketName, fileName)

            expect(url).toBe('http://localhost/presigned')
            expect(minioClientMock.presignedGetObject).toHaveBeenCalledWith(bucketName, fileName, 3600)
        })

        it('должен выбросить ошибку при неуспехе', async () => {
            minioClientMock.presignedGetObject.mockRejectedValue(new Error('err'))

            await expect(service.getPresignedUrl(bucketName, fileName)).rejects.toThrow(
                InternalServerErrorException,
            )
        })
    })
})
