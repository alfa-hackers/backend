import { Test, TestingModule } from '@nestjs/testing'
import { AttachmentProcessorService } from 'socket/services/messages/attachment-processor.service'
import { PdfProcessService } from 'socket/services/payloads/pdf-process.service'
import { ExcelProcessService } from 'socket/services/payloads/excel-process.service'
import { WordProcessService } from 'socket/services/payloads/word-process.service'
import { PowerPointProcessService } from 'socket/services/payloads/powerpoint-process.service'

describe('AttachmentProcessorService', () => {
    let service: AttachmentProcessorService
    let pdfProcessService: PdfProcessService
    let wordProcessService: WordProcessService
    let excelProcessService: ExcelProcessService
    let powerpointProcessService: PowerPointProcessService

    const mockPdfProcessService = {
        process: jest.fn(),
    }

    const mockWordProcessService = {
        processDoc: jest.fn(),
        processDocx: jest.fn(),
    }

    const mockExcelProcessService = {
        process: jest.fn(),
    }

    const mockPowerPointProcessService = {
        processPpt: jest.fn(),
        processPptx: jest.fn(),
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AttachmentProcessorService,
                {
                    provide: PdfProcessService,
                    useValue: mockPdfProcessService,
                },
                {
                    provide: WordProcessService,
                    useValue: mockWordProcessService,
                },
                {
                    provide: ExcelProcessService,
                    useValue: mockExcelProcessService,
                },
                {
                    provide: PowerPointProcessService,
                    useValue: mockPowerPointProcessService,
                },
            ],
        }).compile()

        service = module.get<AttachmentProcessorService>(AttachmentProcessorService)
        pdfProcessService = module.get<PdfProcessService>(PdfProcessService)
        wordProcessService = module.get<WordProcessService>(WordProcessService)
        excelProcessService = module.get<ExcelProcessService>(ExcelProcessService)
        powerpointProcessService = module.get<PowerPointProcessService>(PowerPointProcessService)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('processAttachment', () => {
        it('should process PDF attachment', async () => {
            const attachment = { mimeType: 'application/pdf', data: 'test-data' }
            const expectedResult = 'processed-pdf-content'
            mockPdfProcessService.process.mockResolvedValue(expectedResult)

            const result = await service.processAttachment(attachment)

            expect(result).toBe(expectedResult)
            expect(pdfProcessService.process).toHaveBeenCalledWith(attachment)
            expect(pdfProcessService.process).toHaveBeenCalledTimes(1)
        })

        it('should process DOC attachment', async () => {
            const attachment = { mimeType: 'application/msword', data: 'test-data' }
            const expectedResult = 'processed-doc-content'
            mockWordProcessService.processDoc.mockResolvedValue(expectedResult)

            const result = await service.processAttachment(attachment)

            expect(result).toBe(expectedResult)
            expect(wordProcessService.processDoc).toHaveBeenCalledWith(attachment)
            expect(wordProcessService.processDoc).toHaveBeenCalledTimes(1)
        })

        it('should process DOCX attachment', async () => {
            const attachment = {
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                data: 'test-data',
            }
            const expectedResult = 'processed-docx-content'
            mockWordProcessService.processDocx.mockResolvedValue(expectedResult)

            const result = await service.processAttachment(attachment)

            expect(result).toBe(expectedResult)
            expect(wordProcessService.processDocx).toHaveBeenCalledWith(attachment)
            expect(wordProcessService.processDocx).toHaveBeenCalledTimes(1)
        })

        it('should process XLS attachment', async () => {
            const attachment = { mimeType: 'application/vnd.ms-excel', data: 'test-data' }
            const expectedResult = 'processed-xls-content'
            mockExcelProcessService.process.mockResolvedValue(expectedResult)

            const result = await service.processAttachment(attachment)

            expect(result).toBe(expectedResult)
            expect(excelProcessService.process).toHaveBeenCalledWith(attachment)
            expect(excelProcessService.process).toHaveBeenCalledTimes(1)
        })

        it('should process XLSX attachment', async () => {
            const attachment = {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                data: 'test-data',
            }
            const expectedResult = 'processed-xlsx-content'
            mockExcelProcessService.process.mockResolvedValue(expectedResult)

            const result = await service.processAttachment(attachment)

            expect(result).toBe(expectedResult)
            expect(excelProcessService.process).toHaveBeenCalledWith(attachment)
            expect(excelProcessService.process).toHaveBeenCalledTimes(1)
        })

        it('should process ODS attachment', async () => {
            const attachment = {
                mimeType: 'application/vnd.oasis.opendocument.spreadsheet',
                data: 'test-data',
            }
            const expectedResult = 'processed-ods-content'
            mockExcelProcessService.process.mockResolvedValue(expectedResult)

            const result = await service.processAttachment(attachment)

            expect(result).toBe(expectedResult)
            expect(excelProcessService.process).toHaveBeenCalledWith(attachment)
            expect(excelProcessService.process).toHaveBeenCalledTimes(1)
        })

        it('should process PPT attachment', async () => {
            const attachment = { mimeType: 'application/vnd.ms-powerpoint', data: 'test-data' }
            const expectedResult = 'processed-ppt-content'
            mockPowerPointProcessService.processPpt.mockResolvedValue(expectedResult)

            const result = await service.processAttachment(attachment)

            expect(result).toBe(expectedResult)
            expect(powerpointProcessService.processPpt).toHaveBeenCalledWith(attachment)
            expect(powerpointProcessService.processPpt).toHaveBeenCalledTimes(1)
        })

        it('should process PPTX attachment', async () => {
            const attachment = {
                mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                data: 'test-data',
            }
            const expectedResult = 'processed-pptx-content'
            mockPowerPointProcessService.processPptx.mockResolvedValue(expectedResult)

            const result = await service.processAttachment(attachment)

            expect(result).toBe(expectedResult)
            expect(powerpointProcessService.processPptx).toHaveBeenCalledWith(attachment)
            expect(powerpointProcessService.processPptx).toHaveBeenCalledTimes(1)
        })

        it('should return empty string for unsupported mime type', async () => {
            const attachment = { mimeType: 'application/unsupported', data: 'test-data' }

            const result = await service.processAttachment(attachment)

            expect(result).toBe('')
            expect(pdfProcessService.process).not.toHaveBeenCalled()
            expect(wordProcessService.processDoc).not.toHaveBeenCalled()
            expect(wordProcessService.processDocx).not.toHaveBeenCalled()
            expect(excelProcessService.process).not.toHaveBeenCalled()
            expect(powerpointProcessService.processPpt).not.toHaveBeenCalled()
            expect(powerpointProcessService.processPptx).not.toHaveBeenCalled()
        })

        it('should propagate errors from processing services', async () => {
            const attachment = { mimeType: 'application/pdf', data: 'test-data' }
            const error = new Error('Processing failed')
            mockPdfProcessService.process.mockRejectedValue(error)

            await expect(service.processAttachment(attachment)).rejects.toThrow('Processing failed')
        })
    })
})
