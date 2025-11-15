import { Test, TestingModule } from '@nestjs/testing';
import { ExcelProcessService } from 'socket/services/payloads/excel-process.service';
import { FileAttachment } from 'socket/socket.interface';
import * as ExcelJS from 'exceljs';

describe('ExcelProcessService', () => {
    let service: ExcelProcessService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ExcelProcessService],
        }).compile();

        service = module.get<ExcelProcessService>(ExcelProcessService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should process an Excel file and return formatted string', async () => {
        const attachment: FileAttachment = {
            filename: 'test.xlsx',
            data: Buffer.from('fake').toString('base64'),
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: 4,
        };

        const workbookMock: Partial<ExcelJS.Workbook> = {
            xlsx: {
                load: jest.fn().mockResolvedValue(undefined),
            } as unknown as ExcelJS.Xlsx,
            eachSheet: jest.fn((cb) => {
                cb({
                    name: 'Sheet1',
                    eachRow: (rowCb: any) => {
                        rowCb({
                            eachCell: ({ includeEmpty }: any, cellCb: any) => {
                                cellCb({ value: 'Test' });
                            },
                        });
                    },
                } as any, 1);
            }),
        };

        jest.spyOn(ExcelJS, 'Workbook').mockImplementation(() => workbookMock as ExcelJS.Workbook);

        const result = await service.process(attachment);

        expect(workbookMock.xlsx!.load).toHaveBeenCalled();
        expect(workbookMock.eachSheet).toHaveBeenCalled();
        expect(result).toContain('File: test.xlsx');
        expect(result).toContain('Sheet: Sheet1');
        expect(result).toContain('Test');
    });

    it('should throw an error if workbook fails to load', async () => {
        const attachment: FileAttachment = {
            filename: 'test.xlsx',
            data: Buffer.from('fake').toString('base64'),
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: 4,
        };

        const workbookMock: Partial<ExcelJS.Workbook> = {
            xlsx: {
                load: jest.fn().mockRejectedValue(new Error('Load failed')),
            } as unknown as ExcelJS.Xlsx,
            eachSheet: jest.fn(),
        };

        jest.spyOn(ExcelJS, 'Workbook').mockImplementation(() => workbookMock as ExcelJS.Workbook);

        await expect(service.process(attachment)).rejects.toThrow(
            'Failed to process Excel file: Load failed',
        );
    });

    it('should return "(empty sheet)" for empty worksheet', async () => {
        const attachment: FileAttachment = {
            filename: 'empty.xlsx',
            data: Buffer.from('fake').toString('base64'),
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: 4,
        };

        const workbookMock: Partial<ExcelJS.Workbook> = {
            xlsx: {
                load: jest.fn().mockResolvedValue(undefined),
            } as unknown as ExcelJS.Xlsx,
            eachSheet: jest.fn((cb) => {
                cb({
                    name: 'EmptySheet',
                    eachRow: (rowCb: any) => { },
                } as any, 1);
            }),
        };

        jest.spyOn(ExcelJS, 'Workbook').mockImplementation(() => workbookMock as ExcelJS.Workbook);

        const result = await service.process(attachment);

        expect(result).toContain('(empty sheet)');
    });

    it('should handle cells with formulas', async () => {
        const attachment: FileAttachment = {
            filename: 'formula.xlsx',
            data: Buffer.from('fake').toString('base64'),
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: 4,
        };

        const workbookMock: Partial<ExcelJS.Workbook> = {
            xlsx: {
                load: jest.fn().mockResolvedValue(undefined),
            } as unknown as ExcelJS.Xlsx,
            eachSheet: jest.fn((cb) => {
                cb({
                    name: 'Sheet1',
                    eachRow: (rowCb: any) => {
                        rowCb({
                            eachCell: ({ includeEmpty }: any, cellCb: any) => {
                                cellCb({ value: { result: 42 } });
                            },
                        });
                    },
                } as any, 1);
            }),
        };

        jest.spyOn(ExcelJS, 'Workbook').mockImplementation(() => workbookMock as ExcelJS.Workbook);

        const result = await service.process(attachment);

        expect(result).toContain('42');
    });

    it('should handle cells with rich text', async () => {
        const attachment: FileAttachment = {
            filename: 'richtext.xlsx',
            data: Buffer.from('fake').toString('base64'),
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: 4,
        };

        const workbookMock: Partial<ExcelJS.Workbook> = {
            xlsx: {
                load: jest.fn().mockResolvedValue(undefined),
            } as unknown as ExcelJS.Xlsx,
            eachSheet: jest.fn((cb) => {
                cb({
                    name: 'Sheet1',
                    eachRow: (rowCb: any) => {
                        rowCb({
                            eachCell: ({ includeEmpty }: any, cellCb: any) => {
                                cellCb({ value: { richText: [{ text: 'Rich ' }, { text: 'Text' }] } });
                            },
                        });
                    },
                } as any, 1);
            }),
        };

        jest.spyOn(ExcelJS, 'Workbook').mockImplementation(() => workbookMock as ExcelJS.Workbook);

        const result = await service.process(attachment);

        expect(result).toContain('Rich Text');
    });

    it('should handle cells with dates', async () => {
        const attachment: FileAttachment = {
            filename: 'dates.xlsx',
            data: Buffer.from('fake').toString('base64'),
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: 4,
        };

        const testDate = new Date('2023-01-15');

        const workbookMock: Partial<ExcelJS.Workbook> = {
            xlsx: {
                load: jest.fn().mockResolvedValue(undefined),
            } as unknown as ExcelJS.Xlsx,
            eachSheet: jest.fn((cb) => {
                cb({
                    name: 'Sheet1',
                    eachRow: (rowCb: any) => {
                        rowCb({
                            eachCell: ({ includeEmpty }: any, cellCb: any) => {
                                cellCb({ value: testDate });
                            },
                        });
                    },
                } as any, 1);
            }),
        };

        jest.spyOn(ExcelJS, 'Workbook').mockImplementation(() => workbookMock as ExcelJS.Workbook);

        const result = await service.process(attachment);

        expect(result).toContain('2023-01-15');
    });

    it('should escape cells with commas', async () => {
        const attachment: FileAttachment = {
            filename: 'commas.xlsx',
            data: Buffer.from('fake').toString('base64'),
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: 4,
        };

        const workbookMock: Partial<ExcelJS.Workbook> = {
            xlsx: {
                load: jest.fn().mockResolvedValue(undefined),
            } as unknown as ExcelJS.Xlsx,
            eachSheet: jest.fn((cb) => {
                cb({
                    name: 'Sheet1',
                    eachRow: (rowCb: any) => {
                        rowCb({
                            eachCell: ({ includeEmpty }: any, cellCb: any) => {
                                cellCb({ value: 'Value, with, commas' });
                            },
                        });
                    },
                } as any, 1);
            }),
        };

        jest.spyOn(ExcelJS, 'Workbook').mockImplementation(() => workbookMock as ExcelJS.Workbook);

        const result = await service.process(attachment);

        expect(result).toContain('"Value, with, commas"');
    });
});
