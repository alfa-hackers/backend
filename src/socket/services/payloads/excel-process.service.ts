import { Injectable } from '@nestjs/common'
import { FileAttachment } from '../../socket.interface'
import * as ExcelJS from 'exceljs'

@Injectable()
export class ExcelProcessService {
  async process(attachment: FileAttachment): Promise<string> {
    try {
      const buffer = Buffer.from(attachment.data, 'base64')
      const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      )

      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(arrayBuffer)

      let result = `File: ${attachment.filename}\n\n`

      workbook.eachSheet((worksheet) => {
        result += `Sheet: ${worksheet.name}\n`
        result += this.worksheetToCsv(worksheet)
        result += '\n'
      })

      return result.trim()
    } catch (error) {
      throw new Error(`Failed to process Excel file: ${error.message}`)
    }
  }

  private worksheetToCsv(worksheet: ExcelJS.Worksheet): string {
    const rows: string[] = []
    let hasData = false

    worksheet.eachRow((row) => {
      const cells: string[] = []
      let rowHasData = false

      row.eachCell({ includeEmpty: true }, (cell) => {
        const value = this.getCellValue(cell)
        cells.push(value)
        if (value) rowHasData = true
      })

      if (rowHasData) {
        while (cells.length > 0 && !cells[cells.length - 1]) {
          cells.pop()
        }
        rows.push(cells.join(','))
        hasData = true
      }
    })

    if (!hasData) {
      return '(empty sheet)\n'
    }

    return rows.join('\n') + '\n'
  }

  private getCellValue(cell: ExcelJS.Cell): string {
    if (!cell.value) return ''

    if (typeof cell.value === 'object') {
      if ('result' in cell.value) {
        return this.formatValue(cell.value.result)
      }
      if ('text' in cell.value) {
        return this.formatValue(cell.value.text)
      }
      if ('richText' in cell.value) {
        return cell.value.richText
          .map((rt: any) => rt.text)
          .join('')
          .trim()
      }
      if (cell.value instanceof Date) {
        return cell.value.toISOString().split('T')[0]
      }
    }

    return this.formatValue(cell.value)
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) return ''

    const stringValue = String(value).trim()

    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      const escaped = stringValue.replace(/"/g, '""')
      return `"${escaped}"`
    }

    return stringValue
  }
}
