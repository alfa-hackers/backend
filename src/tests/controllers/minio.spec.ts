import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from 'adapters/minio/minio.controller';
import { MinioService } from 'adapters/minio/minio.service';
import { InternalServerErrorException } from '@nestjs/common';

describe('FilesController', () => {
    let controller: FilesController;
    let minioService: MinioService;

    const mockMinioService = {
        getPresignedUrl: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [FilesController],
            providers: [
                { provide: MinioService, useValue: mockMinioService },
            ],
        }).compile();

        controller = module.get<FilesController>(FilesController);
        minioService = module.get<MinioService>(MinioService);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('downloadFile', () => {
        it('should return a pre-signed URL', async () => {
            const fileUrl = 'chat-files/example.pdf';
            const presignedUrl = 'http://localhost:9000/chat-files/example.pdf?signature=test';

            mockMinioService.getPresignedUrl.mockResolvedValue(presignedUrl);

            const result = await controller.downloadFile({ fileUrl });

            expect(result).toEqual({ url: presignedUrl });
            expect(mockMinioService.getPresignedUrl).toHaveBeenCalledWith('chat-files', 'example.pdf', 3600);
        });

        it('should throw InternalServerErrorException if MinioService fails', async () => {
            const fileUrl = 'chat-files/example.pdf';
            const error = new Error('Minio error');

            mockMinioService.getPresignedUrl.mockRejectedValue(error);

            await expect(controller.downloadFile({ fileUrl }))
                .rejects
                .toBeInstanceOf(InternalServerErrorException);
        });
    });
});
