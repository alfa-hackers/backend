import { Injectable } from '@nestjs/common'
import { FileAttachment } from '../../socket.interface'
import { PdfReader } from 'pdfreader'

@Injectable()
export class PdfProcessService {
  async process(attachment: FileAttachment): Promise<string> {
    try {
      const buffer = Buffer.from(attachment.data, 'base64')

      const extractedText = await this.extractTextFromPdf(buffer)

      let result = `File: ${attachment.filename}\n\n`
      result += extractedText

      return result
    } catch (error) {
      throw new Error(`Failed to process PDF file: ${error.message}`)
    }
  }

  private extractTextFromPdf(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const pdfReader = new PdfReader()
      let textContent = ''
      let currentPage = 0

      pdfReader.parseBuffer(buffer, (err, item) => {
        if (err) {
          reject(err)
          return
        }

        if (!item) {
          resolve(textContent)
          return
        }

        if (item.page) {
          if (currentPage > 0) {
            textContent += '\n\n'
          }
          currentPage = item.page
          textContent += `--- Page ${item.page} ---\n`
        }

        if (item.text) {
          textContent += item.text + ' '
        }
      })
    })
  }
}
