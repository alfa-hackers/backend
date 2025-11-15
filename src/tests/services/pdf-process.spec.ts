import { Test, TestingModule } from '@nestjs/testing';
import { PdfProcessService } from 'socket/services/payloads/pdf-process.service';
import { FileAttachment } from 'socket/socket.interface';
import { PdfReader } from 'pdfreader';

jest.mock('pdfreader');

describe('PdfProcessService', () => {
    let service: PdfProcessService;
    let parseBufferMock: jest.Mock;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [PdfProcessService],
        }).compile();

        service = module.get<PdfProcessService>(PdfProcessService);

        // @ts-ignore
        parseBufferMock = jest.fn();
        // @ts-ignore
        PdfReader.mockImplementation(() => ({
            parseBuffer: parseBufferMock,
        }));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should process a PDF file and return extracted text', async () => {
        const attachment: FileAttachment = {
            filename: 'test.pdf',
            data: Buffer.from('fake').toString('base64'),
            mimeType: 'application/pdf',
            size: 4,
        };

        parseBufferMock.mockImplementation((buffer, callback) => {
            // Симулируем страницы и текст
            callback(null, { page: 1 });
            callback(null, { text: 'Hello' });
            callback(null, { text: 'World' });
            callback(null, null); // завершение
        });

        const result = await service.process(attachment);

        expect(parseBufferMock).toHaveBeenCalled();
        expect(result).toContain('File: test.pdf');
        expect(result).toContain('--- Page 1 ---');
        expect(result).toContain('Hello');
        expect(result).toContain('World');
    });

    it('should handle multiple pages', async () => {
        const attachment: FileAttachment = {
            filename: 'multi.pdf',
            data: Buffer.from('fake').toString('base64'),
            mimeType: 'application/pdf',
            size: 4,
        };

        parseBufferMock.mockImplementation((buffer, callback) => {
            callback(null, { page: 1 });
            callback(null, { text: 'Page1Text' });
            callback(null, { page: 2 });
            callback(null, { text: 'Page2Text' });
            callback(null, null);
        });

        const result = await service.process(attachment);

        expect(result).toContain('--- Page 1 ---');
        expect(result).toContain('Page1Text');
        expect(result).toContain('--- Page 2 ---');
        expect(result).toContain('Page2Text');
    });

    it('should throw an error if parseBuffer fails', async () => {
        const attachment: FileAttachment = {
            filename: 'fail.pdf',
            data: Buffer.from('fake').toString('base64'),
            mimeType: 'application/pdf',
            size: 4,
        };

        parseBufferMock.mockImplementation((buffer, callback) => {
            callback(new Error('Parse error'), null);
        });

        await expect(service.process(attachment)).rejects.toThrow(
            'Failed to process PDF file: Parse error',
        );
    });

    it('should return empty string if PDF has no text', async () => {
        const attachment: FileAttachment = {
            filename: 'empty.pdf',
            data: Buffer.from('fake').toString('base64'),
            mimeType: 'application/pdf',
            size: 4,
        };

        parseBufferMock.mockImplementation((buffer, callback) => {
            callback(null, null); // сразу завершение
        });

        const result = await service.process(attachment);

        expect(result).toContain('File: empty.pdf');
    });
});
