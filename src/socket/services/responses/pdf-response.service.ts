import { Injectable } from '@nestjs/common'
import { SaveMinioService } from '../save-minio.service'
import * as PDFDocument from 'pdfkit'
import * as path from 'path'
import * as fs from 'fs'

@Injectable()
export class PdfResponseService {
  constructor(private readonly saveMinioService: SaveMinioService) { }

  private extractStructuredContent(
    content: string,
  ): { type: 'paragraph' | 'header' | 'list'; text: string; level?: number }[] {
    const lines = content.split('\n')
    const structured: { type: 'paragraph' | 'header' | 'list'; text: string; level?: number }[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      if (/^#{1,6}\s/.test(trimmed)) {
        const level = trimmed.match(/^(#{1,6})/)?.[0].length || 1
        structured.push({ type: 'header', text: trimmed.replace(/^#{1,6}\s/, ''), level })
      } else if (/^[-*•]\s/.test(trimmed)) {
        structured.push({ type: 'list', text: trimmed.replace(/^[-*•]\s/, '') })
      } else {
        structured.push({ type: 'paragraph', text: trimmed })
      }
    }

    return structured
  }

  private getFontPath(): string | null {
    const fontPaths = [
      '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
      '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
      'C:\\Windows\\Fonts\\arial.ttf',
      path.join(process.cwd(), 'fonts', 'DejaVuSans.ttf'),
    ]

    for (const fontPath of fontPaths) {
      if (fs.existsSync(fontPath)) {
        return fontPath
      }
    }

    return null
  }

  async generate(content: string, roomId: string): Promise<string> {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' })
      const chunks: Buffer[] = []

      doc.on('data', (chunk: Buffer) => chunks.push(chunk))

      const fontPath = this.getFontPath()

      if (fontPath) {
        doc.registerFont('Unicode', fontPath)
        doc.font('Unicode')
      }

      const structured = this.extractStructuredContent(content)

      if (structured.length === 0) {
        doc.fontSize(12).text(content, { align: 'left', lineGap: 5 })
      } else {
        for (const item of structured) {
          switch (item.type) {
            case 'header':
              const headerSize = 18 - (item.level || 1) * 2
              doc.fontSize(headerSize).text(item.text, { lineGap: 8 })
              doc.moveDown(0.5)
              break
            case 'list':
              doc.fontSize(11).text(`• ${item.text}`, { indent: 20, lineGap: 3 })
              break
            case 'paragraph':
              doc.fontSize(12).text(item.text, { align: 'left', lineGap: 5 })
              doc.moveDown(0.5)
              break
          }
        }
      }

      doc.end()

      await new Promise((resolve) => doc.on('end', resolve))

      const fileBuffer = Buffer.concat(chunks)
      const base64Data = fileBuffer.toString('base64')

      const filename = `response_${Date.now()}.pdf`

      const fileUrl = await this.saveMinioService.saveFile(
        {
          filename,
          mimeType: 'application/pdf',
          data: base64Data,
          size: fileBuffer.length,
        },
        roomId,
      )

      return fileUrl
    } catch (error) {
      throw new Error(`Failed to generate PDF file: ${error}`)
    }
  }
}
