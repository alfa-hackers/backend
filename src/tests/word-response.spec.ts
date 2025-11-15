import { Test, TestingModule } from '@nestjs/testing';
import { WordResponseService } from 'socket/services/responses/word-response.service';
import { SaveMinioService } from 'socket/services/save-minio.service';

jest.mock('docx', () => {
    const originalModule = jest.requireActual('docx');
    return {
        ...originalModule,
        Packer: {
            toBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-docx')),
        },
    };
});

describe('WordResponseService', () => {
    let service: WordResponseService;
    let saveMinioService: SaveMinioService;

    const mockSaveMinioService = {
        saveFile: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WordResponseService,
                { provide: SaveMinioService, useValue: mockSaveMinioService },
            ],
        }).compile();

        service = module.get<WordResponseService>(WordResponseService);
        saveMinioService = module.get<SaveMinioService>(SaveMinioService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should generate a Word document and return file URL', async () => {
        const content = 'Hello World';
        const roomId = 'room123';
        const fakeUrl = 'https://fake-minio-url.com/response.docx';

        mockSaveMinioService.saveFile.mockResolvedValue(fakeUrl);

        const result = await service.generate(content, roomId);

        expect(result).toBe(fakeUrl);
        expect(mockSaveMinioService.saveFile).toHaveBeenCalledTimes(1);

        const saveFileArg = mockSaveMinioService.saveFile.mock.calls[0][0];
        expect(saveFileArg.filename).toMatch(/response_\d+\.docx/);
        expect(saveFileArg.mimeType).toBe(
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        );
        expect(saveFileArg.data).toBeDefined();
        expect(saveFileArg.size).toBeGreaterThan(0);
    });

    it('should throw an error if saveMinioService fails', async () => {
        const content = 'Some content';
        const roomId = 'room123';

        mockSaveMinioService.saveFile.mockRejectedValue(new Error('Minio error'));

        await expect(service.generate(content, roomId)).rejects.toThrow('Minio error');
    });
});
