import { Injectable } from '@nestjs/common'
import { FileAttachment } from '../../socket.interface'
import * as mammoth from 'mammoth'

@Injectable()
export class WordProcessService {
  async processDoc(attachment: FileAttachment): Promise<string> {
    try {
      const buffer = Buffer.from(attachment.data, 'base64')

      const result = await mammoth.extractRawText({ buffer })

      let output = `File: ${attachment.filename}\n\n`
      output += result.value.trim()

      return output
    } catch (error) {
      throw new Error(`Failed to process DOC file: ${error.message}`)
    }
  }

  async processDocx(attachment: FileAttachment): Promise<string> {
    try {
      const buffer = Buffer.from(attachment.data, 'base64')

      const result = await mammoth.extractRawText({ buffer })

      let output = `File: ${attachment.filename}\n\n`
      output += result.value.trim()

      return output
    } catch (error) {
      throw new Error(`Failed to process DOCX file: ${error.message}`)
    }
  }
}
