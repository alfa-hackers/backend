import { Test, TestingModule } from '@nestjs/testing';
import { ExcelResponseService } from 'socket/services/responses/excel-response.service';
import { SaveMinioService } from 'socket/services/save-minio.service';
import * as ExcelJS from 'exceljs';

describe('ExcelResponseService', () => {
    let service: ExcelResponseService;
    let saveMinioService: SaveMinioService;

    const mockSaveMinioService = {
        saveFile: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExcelResponseService,
                { provide: SaveMinioService, useValue: mockSaveMinioService },
            ],
        }).compile();

        service = module.get<ExcelResponseService>(ExcelResponseService);
        saveMinioService = module.get<SaveMinioService>(SaveMinioService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should generate Excel file from structured CSV-like content', async () => {
        const content = `
Name, Age, Date
Alice, 30, 2023-01-01
Bob, 25, 01.02.2023
`;
        const roomId = 'room123';
        const fakeUrl = 'http://minio/fakefile.xlsx';
        mockSaveMinioService.saveFile.mockResolvedValue(fakeUrl);

        const result = await service.generate(content, roomId);

        expect(result).toBe(fakeUrl);
        expect(saveMinioService.saveFile).toHaveBeenCalledTimes(1);

        const callArg = mockSaveMinioService.saveFile.mock.calls[0][0];
        const buffer = Buffer.from(callArg.data, 'base64');

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer.buffer);

        const worksheet = workbook.getWorksheet('AI Response');
        expect(worksheet.getCell('A1').value).toBe('Name');
        expect(worksheet.getCell('B2').value).toBe(30);
        expect(worksheet.getCell('C3').value).toBeInstanceOf(Date);
        expect(mockSaveMinioService.saveFile.mock.calls[0][1]).toBe(roomId);
    });

    it('should generate Excel with "No structured data found" for unstructured content', async () => {
        const content = 'Random text without table';
        const roomId = 'room123';
        const fakeUrl = 'http://minio/fakefile.xlsx';
        mockSaveMinioService.saveFile.mockResolvedValue(fakeUrl);

        const result = await service.generate(content, roomId);

        const callArg = mockSaveMinioService.saveFile.mock.calls[0][0];
        const buffer = Buffer.from(callArg.data, 'base64');

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer.buffer);

        const worksheet = workbook.getWorksheet('AI Response');
        expect(worksheet.getCell('A1').value).toBe('No structured data found');
        expect(result).toBe(fakeUrl);
    });

    it('should throw error if saveMinioService fails', async () => {
        const content = 'Name, Age\nAlice, 30';
        const roomId = 'room123';
        mockSaveMinioService.saveFile.mockRejectedValue(new Error('Save failed'));

        await expect(service.generate(content, roomId)).rejects.toThrow(
            /Failed to generate Excel file/,
        );
    });

    it('should parse numeric and date values correctly', () => {
        const parseValue = service['parseValue'].bind(service);

        expect(parseValue('42')).toBe(42);
        expect(parseValue('3.14')).toBe(3.14);
        expect(parseValue('2023-01-05')).toBeInstanceOf(Date);
        expect(parseValue('05.01.2023')).toBeInstanceOf(Date);
        expect(parseValue('Some text')).toBe('Some text');
        expect(parseValue('')).toBe('');
    });
});
