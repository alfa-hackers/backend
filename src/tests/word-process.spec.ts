import { Test, TestingModule } from '@nestjs/testing';
import { WordProcessService } from 'socket/services/payloads/word-process.service';
import { FileAttachment } from 'socket/socket.interface';
import * as mammoth from 'mammoth';

jest.mock('mammoth');

describe('WordProcessService', () => {
    let service: WordProcessService;
    let extractRawTextMock: jest.Mock;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [WordProcessService],
        }).compile();

        service = module.get<WordProcessService>(WordProcessService);

        // @ts-ignore
        extractRawTextMock = jest.fn();
        // @ts-ignore
        mammoth.extractRawText = extractRawTextMock;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should process DOC file and return extracted text', async () => {
        const attachment: FileAttachment = {
            filename: 'document.doc',
            data: Buffer.from('fake').toString('base64'),
            mimeType: 'application/msword',
            size: 4,
        };

        extractRawTextMock.mockResolvedValue({ value: 'Hello World' });

        const result = await service.processDoc(attachment);

        expect(extractRawTextMock).toHaveBeenCalledWith({
            buffer: expect.any(Buffer),
        });

        expect(result).toContain('File: document.doc');
        expect(result).toContain('Hello World');
    });

    it('should process DOCX file and return extracted text', async () => {
        const attachment: FileAttachment = {
            filename: 'document.docx',
            data: Buffer.from('fake').toString('base64'),
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            size: 4,
        };

        extractRawTextMock.mockResolvedValue({ value: 'Hello DOCX' });

        const result = await service.processDocx(attachment);

        expect(extractRawTextMock).toHaveBeenCalledWith({
            buffer: expect.any(Buffer),
        });

        expect(result).toContain('File: document.docx');
        expect(result).toContain('Hello DOCX');
    });

    it('should throw an error if DOC extraction fails', async () => {
        const attachment: FileAttachment = {
            filename: 'fail.doc',
            data: Buffer.from('fake').toString('base64'),
            mimeType: 'application/msword',
            size: 4,
        };

        extractRawTextMock.mockRejectedValue(new Error('Extraction error'));

        await expect(service.processDoc(attachment)).rejects.toThrow(
            'Failed to process DOC file: Extraction error',
        );
    });

    it('should throw an error if DOCX extraction fails', async () => {
        const attachment: FileAttachment = {
            filename: 'fail.docx',
            data: Buffer.from('fake').toString('base64'),
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            size: 4,
        };

        extractRawTextMock.mockRejectedValue(new Error('Extraction error'));

        await expect(service.processDocx(attachment)).rejects.toThrow(
            'Failed to process DOCX file: Extraction error',
        );
    });

    it('should return only filename if mammoth returns empty', async () => {
        const attachment: FileAttachment = {
            filename: 'empty.docx',
            data: Buffer.from('fake').toString('base64'),
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            size: 4,
        };

        extractRawTextMock.mockResolvedValue({ value: '' });

        const result = await service.processDocx(attachment);

        expect(result).toContain('File: empty.docx');
        // Проверяем, что после имени файла нет текста
        expect(result.replace(`File: ${attachment.filename}\n\n`, '').trim()).toBe('');
    });

    it('should return only filename if mammoth returns empty for DOC', async () => {
        const attachment: FileAttachment = {
            filename: 'empty.doc',
            data: Buffer.from('fake').toString('base64'),
            mimeType: 'application/msword',
            size: 4,
        };

        extractRawTextMock.mockResolvedValue({ value: '' });

        const result = await service.processDoc(attachment);

        expect(result).toContain('File: empty.doc');
        expect(result.replace(`File: ${attachment.filename}\n\n`, '').trim()).toBe('');
    });
});
