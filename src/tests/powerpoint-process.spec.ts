import { Test, TestingModule } from '@nestjs/testing';
import { PowerPointProcessService } from 'socket/services/payloads/powerpoint-process.service';
import { FileAttachment } from 'socket/socket.interface';
import * as textract from 'textract';

jest.mock('textract');

describe('PowerPointProcessService', () => {
    let service: PowerPointProcessService;
    let fromBufferWithMimeMock: jest.Mock;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [PowerPointProcessService],
        }).compile();

        service = module.get<PowerPointProcessService>(PowerPointProcessService);

        // @ts-ignore
        fromBufferWithMimeMock = jest.fn();
        // @ts-ignore
        textract.fromBufferWithMime = fromBufferWithMimeMock;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should process PPT file and return extracted text', async () => {
        const attachment: FileAttachment = {
            filename: 'presentation.ppt',
            data: Buffer.from('fake').toString('base64'),
            mimeType: 'application/vnd.ms-powerpoint',
            size: 4,
        };

        fromBufferWithMimeMock.mockImplementation(
            (mimeType, buffer, callback) => {
                callback(null, 'Slide1\nSlide2');
            },
        );

        const result = await service.processPpt(attachment);

        expect(fromBufferWithMimeMock).toHaveBeenCalledWith(
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            expect.any(Buffer),
            expect.any(Function),
        );

        expect(result).toContain('File: presentation.ppt');
        expect(result).toContain('Slide1');
        expect(result).toContain('Slide2');
    });

    it('should process PPTX file and return extracted text', async () => {
        const attachment: FileAttachment = {
            filename: 'presentation.pptx',
            data: Buffer.from('fake').toString('base64'),
            mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            size: 4,
        };

        fromBufferWithMimeMock.mockImplementation(
            (mimeType, buffer, callback) => {
                callback(null, 'Slide1\nSlide2');
            },
        );

        const result = await service.processPptx(attachment);

        expect(fromBufferWithMimeMock).toHaveBeenCalledWith(
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            expect.any(Buffer),
            expect.any(Function),
        );

        expect(result).toContain('File: presentation.pptx');
        expect(result).toContain('Slide1');
        expect(result).toContain('Slide2');
    });

    it('should throw an error if textract fails for PPT', async () => {
        const attachment: FileAttachment = {
            filename: 'fail.ppt',
            data: Buffer.from('fake').toString('base64'),
            mimeType: 'application/vnd.ms-powerpoint',
            size: 4,
        };

        fromBufferWithMimeMock.mockImplementation((mimeType, buffer, callback) => {
            callback(new Error('Extraction error'), null);
        });

        await expect(service.processPpt(attachment)).rejects.toThrow(
            'Failed to process PPT file: Extraction error',
        );
    });

    it('should throw an error if textract fails for PPTX', async () => {
        const attachment: FileAttachment = {
            filename: 'fail.pptx',
            data: Buffer.from('fake').toString('base64'),
            mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            size: 4,
        };

        fromBufferWithMimeMock.mockImplementation((mimeType, buffer, callback) => {
            callback(new Error('Extraction error'), null);
        });

        await expect(service.processPptx(attachment)).rejects.toThrow(
            'Failed to process PPTX file: Extraction error',
        );
    });

    it('should return empty string if textract returns null', async () => {
        const attachment: FileAttachment = {
            filename: 'empty.pptx',
            data: Buffer.from('fake').toString('base64'),
            mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            size: 4,
        };

        fromBufferWithMimeMock.mockImplementation((mimeType, buffer, callback) => {
            callback(null, null);
        });

        const result = await service.processPptx(attachment);

        expect(result).toContain('File: empty.pptx');
    });
});
