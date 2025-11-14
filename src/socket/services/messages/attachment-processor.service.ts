import { Injectable } from '@nestjs/common'
import { PdfProcessService } from '../payloads/pdf-process.service'
import { WordProcessService } from '../payloads/word-process.service'
import { ExcelProcessService } from '../payloads/excel-process.service'
import { PowerPointProcessService } from '../payloads/powerpoint-process.service'

@Injectable()
export class AttachmentProcessorService {
  constructor(
    private readonly pdfProcessService: PdfProcessService,
    private readonly wordProcessService: WordProcessService,
    private readonly excelProcessService: ExcelProcessService,
    private readonly powerpointProcessService: PowerPointProcessService,
  ) {}

  async processAttachment(attachment: any): Promise<string> {
    switch (attachment.mimeType) {
      case 'application/pdf':
        return await this.pdfProcessService.process(attachment)
      case 'application/msword':
        return await this.wordProcessService.processDoc(attachment)
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await this.wordProcessService.processDocx(attachment)
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      case 'application/vnd.oasis.opendocument.spreadsheet':
        return await this.excelProcessService.process(attachment)
      case 'application/vnd.ms-powerpoint':
        return await this.powerpointProcessService.processPpt(attachment)
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        return await this.powerpointProcessService.processPptx(attachment)
      default:
        return ''
    }
  }
}
