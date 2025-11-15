import { Test, TestingModule } from '@nestjs/testing';
import { PowerpointResponseService } from 'socket/services/responses/powerpoint-reponse.service';
import { SaveMinioService } from 'socket/services/save-minio.service';

jest.mock('pptxgenjs', () => {
    return jest.fn().mockImplementation(() => ({
        addSlide: jest.fn().mockReturnThis(),
        addText: jest.fn(),
        write: jest.fn().mockResolvedValue(Buffer.from('fakepptx')),
    }));
});

describe('PowerpointResponseService', () => {
    let service: PowerpointResponseService;
    let saveMinioService: SaveMinioService;

    const mockSaveMinioService = {
        saveFile: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PowerpointResponseService,
                { provide: SaveMinioService, useValue: mockSaveMinioService },
            ],
        }).compile();

        service = module.get<PowerpointResponseService>(PowerpointResponseService);
        saveMinioService = module.get<SaveMinioService>(SaveMinioService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should generate a PowerPoint and return file URL', async () => {
        const content = 'Slide 1 content\n\nSlide 2 content';
        const roomId = 'room123';
        const fakeUrl = 'https://fake-minio-url.com/response.pptx';

        mockSaveMinioService.saveFile.mockResolvedValue(fakeUrl);

        const result = await service.generate(content, roomId);

        expect(result).toBe(fakeUrl);
        expect(mockSaveMinioService.saveFile).toHaveBeenCalledTimes(1);
        const saveFileArg = mockSaveMinioService.saveFile.mock.calls[0][0];
        expect(saveFileArg.filename).toMatch(/response_\d+\.pptx/);
        expect(saveFileArg.mimeType).toBe(
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        );
        expect(saveFileArg.data).toBeDefined();
        expect(saveFileArg.size).toBeGreaterThan(0);
    });

    it('should throw an error if saveMinioService fails', async () => {
        const content = 'Slide content';
        const roomId = 'room123';

        mockSaveMinioService.saveFile.mockRejectedValue(new Error('Minio error'));

        await expect(service.generate(content, roomId)).rejects.toThrow('Minio error');
    });
});
