import { Injectable } from '@nestjs/common'
import { PdfResponseService } from '../responses/pdf-response.service'
import { WordResponseService } from '../responses/word-response.service'
import { ExcelResponseService } from '../responses/excel-response.service'
import { PowerpointResponseService } from '../responses/powerpoint-reponse.service'
import { ChecklistResponseService } from '../responses/checklist-response.service'

@Injectable()
export class ResponseGeneratorService {
  constructor(
    private readonly pdfResponseService: PdfResponseService,
    private readonly wordResponseService: WordResponseService,
    private readonly excelResponseService: ExcelResponseService,
    private readonly powerpointResponseService: PowerpointResponseService,
    private readonly checklistResponseService: ChecklistResponseService,
  ) { }

  async generateResponseByFlag(
    messageFlag: string,
    aiResponse: any,
    roomId: string,
  ): Promise<{ formattedResponse: string; responseFileUrl: string | null }> {
    let formattedResponse: string
    let responseFileUrl: string | null = null

    switch (messageFlag) {
      case 'pdf':
        responseFileUrl = await this.pdfResponseService.generate(aiResponse.content, roomId)
        formattedResponse = aiResponse.content
        break
      case 'word':
        responseFileUrl = await this.wordResponseService.generate(aiResponse.content, roomId)
        formattedResponse = aiResponse.content
        break
      case 'excel':
        responseFileUrl = await this.excelResponseService.generate(aiResponse.content, roomId)
        formattedResponse = aiResponse.content
        break
      case 'powerpoint':
        responseFileUrl = await this.powerpointResponseService.generate(aiResponse.content, roomId)
        formattedResponse = aiResponse.content
        break
      case 'checklist':
        responseFileUrl = await this.checklistResponseService.generate(aiResponse.content, roomId)
        formattedResponse = aiResponse.content
        break
      case 'text':
      default:
        formattedResponse = aiResponse.content
        break
    }

    return { formattedResponse, responseFileUrl }
  }
}
