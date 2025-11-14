import { Injectable, Logger } from '@nestjs/common'
import * as PptxGenJS from 'pptxgenjs'
import { SaveMinioService } from '../save-minio.service'

@Injectable()
export class PowerpointResponseService {
  private readonly logger = new Logger(PowerpointResponseService.name)

  constructor(private readonly saveMinioService: SaveMinioService) {}

  async generate(content: string, roomId: string): Promise<string> {
    const startTime = Date.now()
    this.logger.log(`Starting PowerPoint generation for room: ${roomId}`)

    try {
      const pptx = new (PptxGenJS as any)()
      const slides = content.split('\n\n')

      slides.forEach((slideContent) => {
        const slide = pptx.addSlide()
        slide.addText(slideContent, {
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 5,
          fontSize: 18,
          color: '363636',
        })
      })

      const buffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer
      const base64Data = buffer.toString('base64')
      const filename = `response_${Date.now()}.pptx`

      const fileUrl = await this.saveMinioService.saveFile(
        {
          filename,
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          data: base64Data,
          size: buffer.length,
        },
        roomId,
      )

      this.logger.log(
        `PowerPoint successfully saved for room ${roomId}: ${fileUrl} (Generation time: ${Date.now() - startTime}ms)`,
      )

      return fileUrl
    } catch (error) {
      this.logger.error(
        `Failed to generate PowerPoint for room ${roomId}: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }
}
