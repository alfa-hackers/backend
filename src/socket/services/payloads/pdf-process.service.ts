import { Injectable, Logger } from '@nestjs/common'
import { FileAttachment } from '../../socket.interface'
import { PdfReader } from 'pdfreader'

@Injectable()
export class PdfProcessService {
  private readonly logger = new Logger(PdfProcessService.name)
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024
  private readonly PROCESSING_TIMEOUT = 60000
  private readonly MAX_PAGES = 500

  async process(attachment: FileAttachment): Promise<string> {
    try {
      const buffer = Buffer.from(attachment.data, 'base64')
      this.logger.log(
        `Received PDF: ${attachment.filename} (${(buffer.length / 1024).toFixed(2)} KB)`,
      )

      if (buffer.length > this.MAX_FILE_SIZE) {
        this.logger.warn(`PDF file too large: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`)
        throw new Error(
          `PDF file is too large. Maximum size is ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
        )
      }

      this.logger.log(`Starting extraction for: ${attachment.filename}`)
      const extractedText = await this.extractTextFromPdf(buffer, attachment.filename)
      this.logger.log(`Finished extraction for: ${attachment.filename}`)

      return `File: ${attachment.filename}\n\n${extractedText}`
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to process PDF file: ${errorMessage}`)
      throw new Error(`Failed to process PDF file: ${errorMessage}`)
    }
  }

  private extractTextFromPdf(buffer: Buffer, filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const pdfReader = new PdfReader({ debug: false })
      let textContent = ''
      let currentPage = 0
      let hasContent = false
      let itemCount = 0
      const maxItems = 100000

      this.logger.log(`Initializing PDF reader for file: ${filename}`)

      const timeoutId = setTimeout(() => {
        this.logger.error(`PDF processing timeout exceeded (${this.PROCESSING_TIMEOUT}ms)`)
        reject(new Error(`PDF processing timeout exceeded (${this.PROCESSING_TIMEOUT}ms)`))
      }, this.PROCESSING_TIMEOUT)

      pdfReader.parseBuffer(buffer, (err: unknown, item: any) => {
        try {
          if (err) {
            clearTimeout(timeoutId)
            const errorMessage = err instanceof Error ? err.message : String(err)
            this.logger.error(`PDF parsing error: ${errorMessage}`)
            reject(new Error(`PDF parsing error: ${errorMessage}`))
            return
          }

          itemCount++
          if (itemCount % 1000 === 0) {
            this.logger.debug(`Processed ${itemCount} PDF items so far...`)
          }

          if (itemCount > maxItems) {
            clearTimeout(timeoutId)
            this.logger.warn(`PDF has too many items (>${maxItems}), truncating...`)
            resolve(textContent.trim() || '[PDF processed, but content truncated due to size]')
            return
          }

          if (!item) {
            clearTimeout(timeoutId)

            if (!hasContent) {
              this.logger.warn(`No text content extracted from PDF: ${filename}`)
              resolve(
                '[PDF file contains no extractable text content. It may be image-based or encrypted.]',
              )
            } else {
              this.logger.log(`Successfully extracted text from ${currentPage} pages`)
              resolve(textContent.trim())
            }
            return
          }

          if (item.page) {
            if (currentPage >= this.MAX_PAGES) {
              clearTimeout(timeoutId)
              this.logger.warn(`Reached maximum page limit (${this.MAX_PAGES})`)
              resolve(
                textContent.trim() + `\n\n[Truncated: PDF has more than ${this.MAX_PAGES} pages]`,
              )
              return
            }

            if (currentPage > 0) {
              textContent += '\n\n'
            }
            currentPage = item.page
            this.logger.log(`Processing page ${currentPage} of ${filename}`)
            textContent += `--- Page ${item.page} ---\n`
            return
          }

          if (item.text) {
            const text = item.text.trim()

            if (this.isLikelyWatermark(text, textContent)) {
              this.logger.debug(`Skipped likely watermark: "${text}"`)
              return
            }

            hasContent = true
            textContent += text + ' '
          }
        } catch (processingError) {
          clearTimeout(timeoutId)
          const errorMessage =
            processingError instanceof Error ? processingError.message : String(processingError)
          this.logger.error(`Error during PDF item processing: ${errorMessage}`)
          reject(processingError)
        }
      })
    })
  }

  private isLikelyWatermark(text: string, existingContent: string): boolean {
    if (text.length < 3) {
      return true
    }

    const watermarkPatterns = [
      /confidential/i,
      /draft/i,
      /watermark/i,
      /copyright/i,
      /©/,
      /®/,
      /™/,
      /proprietary/i,
      /do not (copy|distribute)/i,
    ]

    const isWatermarkPattern = watermarkPatterns.some((pattern) => pattern.test(text))

    if (existingContent.length > 0) {
      const occurrences = (existingContent.match(new RegExp(this.escapeRegex(text), 'g')) || [])
        .length
      if (occurrences > 3 && text.length < 50) {
        return true
      }
    }

    return isWatermarkPattern
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
}
