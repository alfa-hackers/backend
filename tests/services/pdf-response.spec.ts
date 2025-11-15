import { Test, TestingModule } from '@nestjs/testing';
import { PdfResponseService } from 'socket/services/responses/pdf-response.service';
import { SaveMinioService } from 'socket/services/save-minio.service';
import * as fs from 'fs';
import { EventEmitter } from 'events';

jest.mock('fs');
jest.mock('pdfkit');

describe('PdfResponseService', () => {
    let service: PdfResponseService;
    let saveMinioService: SaveMinioService;

    const mockSaveMinioService = {
        saveFile: jest.fn(),
    };

    const createMockPDFDocument = () => {
        const mockDoc = new EventEmitter();
        (mockDoc as any).fontSize = jest.fn().mockReturnThis();
        (mockDoc as any).text = jest.fn().mockReturnThis();
        (mockDoc as any).moveDown = jest.fn().mockReturnThis();
        (mockDoc as any).registerFont = jest.fn().mockReturnThis();
        (mockDoc as any).font = jest.fn().mockReturnThis();
        (mockDoc as any).end = jest.fn(() => {
            setImmediate(() => {
                const buffer = Buffer.from('%PDF-1.4 fake pdf content');
                mockDoc.emit('data', buffer);
                mockDoc.emit('end');
            });
        });
        return mockDoc;
    };

    beforeEach(async () => {
        const PDFDocument = require('pdfkit');
        PDFDocument.mockImplementation(() => createMockPDFDocument());

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PdfResponseService,
                { provide: SaveMinioService, useValue: mockSaveMinioService },
            ],
        }).compile();

        service = module.get<PdfResponseService>(PdfResponseService);
        saveMinioService = module.get<SaveMinioService>(SaveMinioService);

        (fs.existsSync as jest.Mock).mockReturnValue(false);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should generate PDF from plain text content', async () => {
        const content = 'This is a simple text for PDF generation.';
        const roomId = 'room123';
        const fakeUrl = 'http://minio/fakefile.pdf';
        mockSaveMinioService.saveFile.mockResolvedValue(fakeUrl);

        const result = await service.generate(content, roomId);

        expect(result).toBe(fakeUrl);
        expect(saveMinioService.saveFile).toHaveBeenCalledTimes(1);

        const callArg = mockSaveMinioService.saveFile.mock.calls[0][0];
        expect(callArg.filename).toMatch(/^response_\d+\.pdf$/);
        expect(callArg.mimeType).toBe('application/pdf');
        expect(callArg.data).toBeTruthy();
        expect(callArg.size).toBeGreaterThan(0);
        expect(mockSaveMinioService.saveFile.mock.calls[0][1]).toBe(roomId);
    });

    it('should generate PDF with structured markdown content', async () => {
        const content = `# Header 1
## Header 2
This is a paragraph.
- List item 1
- List item 2
* Another item`;
        const roomId = 'room456';
        const fakeUrl = 'http://minio/structured.pdf';
        mockSaveMinioService.saveFile.mockResolvedValue(fakeUrl);

        const result = await service.generate(content, roomId);

        expect(result).toBe(fakeUrl);
        expect(saveMinioService.saveFile).toHaveBeenCalledTimes(1);

        const callArg = mockSaveMinioService.saveFile.mock.calls[0][0];
        const buffer = Buffer.from(callArg.data, 'base64');

        expect(buffer.length).toBeGreaterThan(0);
    });

    it('should handle empty lines and whitespace correctly', async () => {
        const content = `
        
# Title

Some text here

- Item 1


- Item 2
        `;
        const roomId = 'room789';
        const fakeUrl = 'http://minio/whitespace.pdf';
        mockSaveMinioService.saveFile.mockResolvedValue(fakeUrl);

        const result = await service.generate(content, roomId);

        expect(result).toBe(fakeUrl);
        expect(saveMinioService.saveFile).toHaveBeenCalledTimes(1);
    });

    it('should handle content with multiple header levels', async () => {
        const content = `# Level 1
## Level 2
### Level 3
#### Level 4
##### Level 5
###### Level 6`;
        const roomId = 'room101';
        const fakeUrl = 'http://minio/headers.pdf';
        mockSaveMinioService.saveFile.mockResolvedValue(fakeUrl);

        const result = await service.generate(content, roomId);

        expect(result).toBe(fakeUrl);
        expect(saveMinioService.saveFile).toHaveBeenCalledTimes(1);
    });

    it('should handle different list markers', async () => {
        const content = `- Dash item
* Asterisk item
- Bullet item`;
        const roomId = 'room202';
        const fakeUrl = 'http://minio/lists.pdf';
        mockSaveMinioService.saveFile.mockResolvedValue(fakeUrl);

        const result = await service.generate(content, roomId);

        expect(result).toBe(fakeUrl);
        expect(saveMinioService.saveFile).toHaveBeenCalledTimes(1);
    });

    it('should throw error if saveMinioService fails', async () => {
        const content = 'Test content';
        const roomId = 'room303';
        mockSaveMinioService.saveFile.mockRejectedValue(new Error('Save failed'));

        await expect(service.generate(content, roomId)).rejects.toThrow(
            /Failed to generate PDF file/,
        );
    });

    it('should handle special characters in content', async () => {
        const content = 'Special chars: @#$%^&*(){}[]|\\:;"<>?,./~`';
        const roomId = 'room404';
        const fakeUrl = 'http://minio/special.pdf';
        mockSaveMinioService.saveFile.mockResolvedValue(fakeUrl);

        const result = await service.generate(content, roomId);

        expect(result).toBe(fakeUrl);
        expect(saveMinioService.saveFile).toHaveBeenCalledTimes(1);
    });

    it('should extract structured content correctly', () => {
        const extractStructuredContent = service['extractStructuredContent'].bind(service);

        const content = `# Header
Paragraph text
- List item`;

        const result = extractStructuredContent(content);

        expect(result).toHaveLength(3);
        expect(result[0]).toEqual({ type: 'header', text: 'Header', level: 1 });
        expect(result[1]).toEqual({ type: 'paragraph', text: 'Paragraph text' });
        expect(result[2]).toEqual({ type: 'list', text: 'List item' });
    });

    it('should return null when no font path exists', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(false);
        const getFontPath = service['getFontPath'].bind(service);

        const result = getFontPath();

        expect(result).toBeNull();
    });

    it('should return font path when it exists', () => {
        (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
            return path === '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
        });
        const getFontPath = service['getFontPath'].bind(service);

        const result = getFontPath();

        expect(result).toBe('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf');
    });

    it('should register font when font path exists', async () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        const content = 'Test content';
        const roomId = 'room505';
        const fakeUrl = 'http://minio/font.pdf';
        mockSaveMinioService.saveFile.mockResolvedValue(fakeUrl);

        await service.generate(content, roomId);

        expect(saveMinioService.saveFile).toHaveBeenCalledTimes(1);
    });
});
