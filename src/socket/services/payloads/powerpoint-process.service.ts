import { Injectable } from '@nestjs/common'
import { FileAttachment } from '../../socket.interface'
import * as textract from 'textract'

@Injectable()
export class PowerPointProcessService {
  private async extractText(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      textract.fromBufferWithMime(
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        buffer,
        (error, text) => {
          if (error) return reject(error)
          resolve(text || '')
        },
      )
    })
  }

  async processPpt(attachment: FileAttachment): Promise<string> {
    try {
      const buffer = Buffer.from(attachment.data, 'base64')
      const text = await this.extractText(buffer)

      let output = `File: ${attachment.filename}\n\n`
      output += text.trim()

      return output
    } catch (error: any) {
      throw new Error(`Failed to process PPT file: ${error.message}`)
    }
  }

  async processPptx(attachment: FileAttachment): Promise<string> {
    try {
      const buffer = Buffer.from(attachment.data, 'base64')
      const text = await this.extractText(buffer)

      let output = `File: ${attachment.filename}\n\n`
      output += text.trim()

      return output
    } catch (error: any) {
      throw new Error(`Failed to process PPTX file: ${error.message}`)
    }
  }
}
