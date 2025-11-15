import { Test, TestingModule } from '@nestjs/testing'
import { SaveMinioService } from 'socket/services/save-minio.service'
import { MinioService } from 'adapters/minio/minio.service'

describe('SaveMinioService', () => {
    let service: SaveMinioService
    let minioService: MinioService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SaveMinioService,
                {
                    provide: MinioService,
                    useValue: {
                        uploadFile: jest.fn(),
                    },
                },
            ],
        }).compile()

        service = module.get<SaveMinioService>(SaveMinioService)
        minioService = module.get<MinioService>(MinioService)

        process.env.MINIO_BUCKET_NAME = 'chat-files'
        process.env.MINIO_USE_SSL = 'false'
        process.env.MINIO_ENDPOINT = 'localhost'
        process.env.MINIO_PORT = '9000'
    })

    it('should save file and return URL', async () => {
        jest.spyOn(minioService, 'uploadFile').mockResolvedValue('chat-files/room1/test-file.png')

        const attachment = {
            filename: 'image.png',
            data: Buffer.from('123').toString('base64'),
            mimeType: 'image/png',
        }

        const url = await service.saveFile(attachment as any, 'room1')

        expect(url).toBe('http://localhost:9000/chat-files/room1/test-file.png')
        expect(minioService.uploadFile).toHaveBeenCalled()
    })
})
