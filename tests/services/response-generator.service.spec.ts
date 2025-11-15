import { Test, TestingModule } from '@nestjs/testing'
import { ResponseGeneratorService } from 'socket/services/messages/response-generator.service'
import { PdfResponseService } from 'socket/services/responses/pdf-response.service'
import { WordResponseService } from 'socket/services/responses/word-response.service'
import { ExcelResponseService } from 'socket/services/responses/excel-response.service'
import { PowerpointResponseService } from 'socket/services/responses/powerpoint-reponse.service'
import { ChecklistResponseService } from 'socket/services/responses/checklist-response.service'

describe('ResponseGeneratorService', () => {
    let service: ResponseGeneratorService
    let pdfResponseService: PdfResponseService
    let wordResponseService: WordResponseService
    let excelResponseService: ExcelResponseService
    let powerpointResponseService: PowerpointResponseService
    let checklistResponseService: ChecklistResponseService

    const mockPdfResponseService = {
        generate: jest.fn(),
    }

    const mockWordResponseService = {
        generate: jest.fn(),
    }

    const mockExcelResponseService = {
        generate: jest.fn(),
    }

    const mockPowerpointResponseService = {
        generate: jest.fn(),
    }

    const mockChecklistResponseService = {
        generate: jest.fn(),
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ResponseGeneratorService,
                {
                    provide: PdfResponseService,
                    useValue: mockPdfResponseService,
                },
                {
                    provide: WordResponseService,
                    useValue: mockWordResponseService,
                },
                {
                    provide: ExcelResponseService,
                    useValue: mockExcelResponseService,
                },
                {
                    provide: PowerpointResponseService,
                    useValue: mockPowerpointResponseService,
                },
                {
                    provide: ChecklistResponseService,
                    useValue: mockChecklistResponseService,
                },
            ],
        }).compile()

        service = module.get<ResponseGeneratorService>(ResponseGeneratorService)
        pdfResponseService = module.get<PdfResponseService>(PdfResponseService)
        wordResponseService = module.get<WordResponseService>(WordResponseService)
        excelResponseService = module.get<ExcelResponseService>(ExcelResponseService)
        powerpointResponseService = module.get<PowerpointResponseService>(PowerpointResponseService)
        checklistResponseService = module.get<ChecklistResponseService>(ChecklistResponseService)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('generateResponseByFlag', () => {
        const roomId = 'test-room-id'
        const aiResponse = {
            content: 'Test AI response content',
        }

        it('should generate PDF response when flag is "pdf"', async () => {
            const expectedFileUrl = 'https://example.com/file.pdf'
            mockPdfResponseService.generate.mockResolvedValue(expectedFileUrl)

            const result = await service.generateResponseByFlag('pdf', aiResponse, roomId)

            expect(result).toEqual({
                formattedResponse: aiResponse.content,
                responseFileUrl: expectedFileUrl,
            })
            expect(pdfResponseService.generate).toHaveBeenCalledWith(aiResponse.content, roomId)
            expect(pdfResponseService.generate).toHaveBeenCalledTimes(1)
        })

        it('should generate Word response when flag is "word"', async () => {
            const expectedFileUrl = 'https://example.com/file.docx'
            mockWordResponseService.generate.mockResolvedValue(expectedFileUrl)

            const result = await service.generateResponseByFlag('word', aiResponse, roomId)

            expect(result).toEqual({
                formattedResponse: aiResponse.content,
                responseFileUrl: expectedFileUrl,
            })
            expect(wordResponseService.generate).toHaveBeenCalledWith(aiResponse.content, roomId)
            expect(wordResponseService.generate).toHaveBeenCalledTimes(1)
        })

        it('should generate Excel response when flag is "excel"', async () => {
            const expectedFileUrl = 'https://example.com/file.xlsx'
            mockExcelResponseService.generate.mockResolvedValue(expectedFileUrl)

            const result = await service.generateResponseByFlag('excel', aiResponse, roomId)

            expect(result).toEqual({
                formattedResponse: aiResponse.content,
                responseFileUrl: expectedFileUrl,
            })
            expect(excelResponseService.generate).toHaveBeenCalledWith(aiResponse.content, roomId)
            expect(excelResponseService.generate).toHaveBeenCalledTimes(1)
        })

        it('should generate PowerPoint response when flag is "powerpoint"', async () => {
            const expectedFileUrl = 'https://example.com/file.pptx'
            mockPowerpointResponseService.generate.mockResolvedValue(expectedFileUrl)

            const result = await service.generateResponseByFlag('powerpoint', aiResponse, roomId)

            expect(result).toEqual({
                formattedResponse: aiResponse.content,
                responseFileUrl: expectedFileUrl,
            })
            expect(powerpointResponseService.generate).toHaveBeenCalledWith(aiResponse.content, roomId)
            expect(powerpointResponseService.generate).toHaveBeenCalledTimes(1)
        })

        it('should generate Checklist response when flag is "checklist"', async () => {
            const expectedFileUrl = 'https://example.com/checklist.pdf'
            mockChecklistResponseService.generate.mockResolvedValue(expectedFileUrl)

            const result = await service.generateResponseByFlag('checklist', aiResponse, roomId)

            expect(result).toEqual({
                formattedResponse: aiResponse.content,
                responseFileUrl: expectedFileUrl,
            })
            expect(checklistResponseService.generate).toHaveBeenCalledWith(aiResponse.content, roomId)
            expect(checklistResponseService.generate).toHaveBeenCalledTimes(1)
        })

        it('should generate text response when flag is "text"', async () => {
            const result = await service.generateResponseByFlag('text', aiResponse, roomId)

            expect(result).toEqual({
                formattedResponse: aiResponse.content,
                responseFileUrl: null,
            })
            expect(pdfResponseService.generate).not.toHaveBeenCalled()
            expect(wordResponseService.generate).not.toHaveBeenCalled()
            expect(excelResponseService.generate).not.toHaveBeenCalled()
            expect(powerpointResponseService.generate).not.toHaveBeenCalled()
            expect(checklistResponseService.generate).not.toHaveBeenCalled()
        })

        it('should generate text response when flag is unknown (default case)', async () => {
            const result = await service.generateResponseByFlag('unknown-flag', aiResponse, roomId)

            expect(result).toEqual({
                formattedResponse: aiResponse.content,
                responseFileUrl: null,
            })
            expect(pdfResponseService.generate).not.toHaveBeenCalled()
            expect(wordResponseService.generate).not.toHaveBeenCalled()
            expect(excelResponseService.generate).not.toHaveBeenCalled()
            expect(powerpointResponseService.generate).not.toHaveBeenCalled()
            expect(checklistResponseService.generate).not.toHaveBeenCalled()
        })

        it('should handle empty string flag (default case)', async () => {
            const result = await service.generateResponseByFlag('', aiResponse, roomId)

            expect(result).toEqual({
                formattedResponse: aiResponse.content,
                responseFileUrl: null,
            })
        })

        it('should propagate errors from PDF response service', async () => {
            const error = new Error('PDF generation failed')
            mockPdfResponseService.generate.mockRejectedValue(error)

            await expect(
                service.generateResponseByFlag('pdf', aiResponse, roomId)
            ).rejects.toThrow('PDF generation failed')
        })

        it('should propagate errors from Word response service', async () => {
            const error = new Error('Word generation failed')
            mockWordResponseService.generate.mockRejectedValue(error)

            await expect(
                service.generateResponseByFlag('word', aiResponse, roomId)
            ).rejects.toThrow('Word generation failed')
        })

        it('should propagate errors from Excel response service', async () => {
            const error = new Error('Excel generation failed')
            mockExcelResponseService.generate.mockRejectedValue(error)

            await expect(
                service.generateResponseByFlag('excel', aiResponse, roomId)
            ).rejects.toThrow('Excel generation failed')
        })

        it('should propagate errors from PowerPoint response service', async () => {
            const error = new Error('PowerPoint generation failed')
            mockPowerpointResponseService.generate.mockRejectedValue(error)

            await expect(
                service.generateResponseByFlag('powerpoint', aiResponse, roomId)
            ).rejects.toThrow('PowerPoint generation failed')
        })

        it('should propagate errors from Checklist response service', async () => {
            const error = new Error('Checklist generation failed')
            mockChecklistResponseService.generate.mockRejectedValue(error)

            await expect(
                service.generateResponseByFlag('checklist', aiResponse, roomId)
            ).rejects.toThrow('Checklist generation failed')
        })

        it('should handle different aiResponse content', async () => {
            const differentAiResponse = {
                content: 'Different content with special characters: @#$%',
            }
            const expectedFileUrl = 'https://example.com/file.pdf'
            mockPdfResponseService.generate.mockResolvedValue(expectedFileUrl)

            const result = await service.generateResponseByFlag('pdf', differentAiResponse, roomId)

            expect(result.formattedResponse).toBe(differentAiResponse.content)
            expect(pdfResponseService.generate).toHaveBeenCalledWith(differentAiResponse.content, roomId)
        })

        it('should handle different roomId values', async () => {
            const differentRoomId = 'different-room-123'
            const expectedFileUrl = 'https://example.com/file.docx'
            mockWordResponseService.generate.mockResolvedValue(expectedFileUrl)

            const result = await service.generateResponseByFlag('word', aiResponse, differentRoomId)

            expect(result.responseFileUrl).toBe(expectedFileUrl)
            expect(wordResponseService.generate).toHaveBeenCalledWith(aiResponse.content, differentRoomId)
        })
    })
})
