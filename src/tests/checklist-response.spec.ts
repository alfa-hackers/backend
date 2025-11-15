import { Test, TestingModule } from '@nestjs/testing';
import { ChecklistResponseService } from 'socket/services/responses/checklist-response.service';
import { SaveMinioService } from 'socket/services/save-minio.service';

describe('ChecklistResponseService', () => {
    let service: ChecklistResponseService;
    let saveMinioService: SaveMinioService;

    const mockSaveMinioService = {
        saveFile: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChecklistResponseService,
                { provide: SaveMinioService, useValue: mockSaveMinioService },
            ],
        }).compile();

        service = module.get<ChecklistResponseService>(ChecklistResponseService);
        saveMinioService = module.get<SaveMinioService>(SaveMinioService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should generate a checklist and call saveMinioService', async () => {
        const content = `1. Task one
2. Task two
3. Task three`;
        const roomId = 'room123';
        const expectedChecklist = `- [ ] Task one
- [ ] Task two
- [ ] Task three`;

        const fakeUrl = 'http://minio/fakefile.md';
        mockSaveMinioService.saveFile.mockResolvedValue(fakeUrl);

        const result = await service.generate(content, roomId);

        expect(result).toBe(fakeUrl);
        expect(saveMinioService.saveFile).toHaveBeenCalledTimes(1);

        // Проверяем данные, переданные в saveFile
        const callArg = mockSaveMinioService.saveFile.mock.calls[0][0];
        const decodedData = Buffer.from(callArg.data, 'base64').toString('utf-8');
        expect(decodedData).toBe(expectedChecklist);
        expect(callArg.filename).toMatch(/^checklist_\d+\.md$/);
        expect(callArg.mimeType).toBe('text/markdown');
        expect(callArg.size).toBe(Buffer.byteLength(decodedData));

        // Проверяем, что roomId передан правильно
        expect(mockSaveMinioService.saveFile.mock.calls[0][1]).toBe(roomId);
    });

    it('should throw error if saveMinioService fails', async () => {
        const content = '1. Task';
        const roomId = 'room123';

        mockSaveMinioService.saveFile.mockRejectedValue(new Error('Save failed'));

        await expect(service.generate(content, roomId)).rejects.toThrow('Save failed');
    });

    it('should handle empty lines correctly', async () => {
        const content = `
1. Task one

2. Task two

`;
        const roomId = 'room123';
        const expectedChecklist = `- [ ] Task one
- [ ] Task two`;

        const fakeUrl = 'http://minio/fakefile.md';
        mockSaveMinioService.saveFile.mockResolvedValue(fakeUrl);

        const result = await service.generate(content, roomId);
        const callArg = mockSaveMinioService.saveFile.mock.calls[0][0];
        const decodedData = Buffer.from(callArg.data, 'base64').toString('utf-8');

        expect(decodedData).toBe(expectedChecklist);
        expect(result).toBe(fakeUrl);
    });
});
