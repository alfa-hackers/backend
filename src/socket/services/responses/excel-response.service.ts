import { Injectable } from '@nestjs/common'
import { SaveMinioService } from '../save-minio.service'
import * as ExcelJS from 'exceljs'

@Injectable()
export class ExcelResponseService {
  constructor(private readonly saveMinioService: SaveMinioService) {}

  private extractCsvData(content: string): string[][] {
    const lines = content.split('\n')
    const potentialData: string[][] = []

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine || trimmedLine.length < 3) continue

      if (this.isObviousJunk(trimmedLine)) continue
      if (this.isSeparatorLine(trimmedLine)) continue

      if (this.looksLikeTableRow(trimmedLine)) {
        const delimiter = this.detectDelimiter(trimmedLine)
        const cells = this.parseCsvLine(trimmedLine, delimiter)

        const nonEmpty = cells.filter((c) => c.trim().length > 0)
        if (nonEmpty.length >= 2) {
          potentialData.push(cells)
        }
      }
    }

    return this.filterAndAlignTable(potentialData)
  }

  private isObviousJunk(line: string): boolean {
    const junkPatterns = [
      /^```/,
      /^#{1,6}\s/,
      /^\[.*\]\(.*\)$/,
      /^(Here is|This is|Below is|Above is|I've created|I've generated)/i,
      /^(Вот|Это|Ниже|Выше|Я создал|Я сгенерировал)/i,
    ]

    return junkPatterns.some((pattern) => pattern.test(line))
  }

  private isSeparatorLine(line: string): boolean {
    const trimmed = line.trim().replace(/\s/g, '')
    return /^[-=_:*|]+$/.test(trimmed) && trimmed.length > 2
  }

  private looksLikeTableRow(line: string): boolean {
    const delimiters = [',', ';', '\t', '|']
    const hasDelimiter = delimiters.some((d) => line.includes(d))
    if (!hasDelimiter) return false

    let delimiterCount = 0
    for (const delimiter of delimiters) {
      const count = (line.match(new RegExp(`\\${delimiter}`, 'g')) || []).length
      delimiterCount = Math.max(delimiterCount, count)
    }

    return delimiterCount >= 1
  }

  private detectDelimiter(line: string): string {
    const delimiters = ['|', '\t', ';', ',']
    let maxCount = 0
    let detectedDelimiter = ','

    for (const delimiter of delimiters) {
      const count = (line.match(new RegExp(`\\${delimiter}`, 'g')) || []).length
      if (count > maxCount) {
        maxCount = count
        detectedDelimiter = delimiter
      }
    }

    return detectedDelimiter
  }

  private parseCsvLine(line: string, delimiter: string): string[] {
    const cells: string[] = []
    let currentCell = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"' || char === "'") {
        inQuotes = !inQuotes
      } else if (char === delimiter && !inQuotes) {
        cells.push(currentCell.trim())
        currentCell = ''
      } else {
        currentCell += char
      }
    }

    cells.push(currentCell.trim())

    return cells.map((cell) =>
      cell
        .replace(/^["'`|]+|["'`|]+$/g, '')
        .replace(/^-+$/, '')
        .trim(),
    )
  }

  private filterAndAlignTable(data: string[][]): string[][] {
    if (data.length === 0) return []

    const filteredData = data.filter((row) => {
      if (this.isEmptyRow(row)) return false
      if (this.isSeparatorRow(row)) return false
      return true
    })

    if (filteredData.length === 0) return []

    const columnCounts = filteredData.map((row) => row.filter((c) => c.length > 0).length)
    const mostCommonColumnCount = this.getMostCommon(columnCounts)

    let headerIndex = -1
    let headerRow: string[] = []

    for (let i = 0; i < Math.min(filteredData.length, 5); i++) {
      const row = filteredData[i]
      const nonEmptyCount = row.filter((c) => c.length > 0).length

      if (nonEmptyCount === mostCommonColumnCount && this.looksLikeHeader(row)) {
        headerIndex = i
        headerRow = row
        break
      }
    }

    if (headerIndex === -1) {
      for (let i = 0; i < Math.min(filteredData.length, 3); i++) {
        const nonEmptyCount = filteredData[i].filter((c) => c.length > 0).length
        if (nonEmptyCount === mostCommonColumnCount) {
          headerIndex = i
          headerRow = filteredData[i]
          break
        }
      }
    }

    if (headerIndex === -1) return []

    const result: string[][] = []
    const targetColumnCount = headerRow.filter((c) => c.length > 0).length

    for (let i = headerIndex; i < filteredData.length; i++) {
      const row = filteredData[i]
      const nonEmpty = row.filter((c) => c.length > 0).length

      if (this.isEmptyRow(row)) continue
      if (this.isSeparatorRow(row)) continue
      if (nonEmpty < Math.max(1, targetColumnCount - 1)) continue
      if (this.isExplanationRow(row, targetColumnCount)) continue

      const alignedRow = [...row]
      while (alignedRow.length < targetColumnCount) {
        alignedRow.push('')
      }

      result.push(alignedRow.slice(0, targetColumnCount))

      if (result.length >= 1000) break
    }

    return this.removeDuplicateHeaders(result)
  }

  private isEmptyRow(row: string[]): boolean {
    return row.every((cell) => cell.trim().length === 0)
  }

  private getMostCommon(numbers: number[]): number {
    const counts = new Map<number, number>()

    for (const num of numbers) {
      counts.set(num, (counts.get(num) || 0) + 1)
    }

    let maxCount = 0
    let mostCommon = numbers[0] || 3

    counts.forEach((count, num) => {
      if (count > maxCount) {
        maxCount = count
        mostCommon = num
      }
    })

    return mostCommon
  }

  private looksLikeHeader(row: string[]): boolean {
    const nonEmpty = row.filter((c) => c.length > 0)
    if (nonEmpty.length === 0) return false

    const hasTextCells = nonEmpty.some((cell) => /[a-zа-яё]/i.test(cell) && cell.length < 50)

    const allNumbers = nonEmpty.every((cell) => /^\d+(\.\d+)?$/.test(cell))

    return hasTextCells && !allNumbers
  }

  private isSeparatorRow(row: string[]): boolean {
    const nonEmpty = row.filter((c) => c.length > 0)
    if (nonEmpty.length === 0) return false

    return nonEmpty.every((cell) => /^[-:=_*]+$/.test(cell))
  }

  private isExplanationRow(row: string[], expectedColumns: number): boolean {
    const text = row.join(' ').toLowerCase()

    const hasLongCell = row.some((cell) => cell.length > 200)
    if (hasLongCell) return true

    const explanationPhrases = [
      'это более',
      'данная таблица',
      'в этой таблице',
      'приведенная таблица',
      'you can use',
      'this table',
      'the table shows',
      'как видно из',
    ]

    return explanationPhrases.some((phrase) => text.includes(phrase))
  }

  private removeDuplicateHeaders(data: string[][]): string[][] {
    if (data.length <= 1) return data

    const result: string[][] = [data[0]]
    const headerStr = data[0]
      .filter((c) => c.length > 0)
      .join('|')
      .toLowerCase()
      .replace(/\s+/g, '')

    for (let i = 1; i < data.length; i++) {
      const currentStr = data[i]
        .filter((c) => c.length > 0)
        .join('|')
        .toLowerCase()
        .replace(/\s+/g, '')

      if (currentStr !== headerStr) {
        result.push(data[i])
      }
    }

    return result
  }

  async generate(content: string, roomId: string): Promise<string> {
    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('AI Response')

      const csvData = this.extractCsvData(content)

      if (csvData.length === 0) {
        worksheet.getCell('A1').value = 'No structured data found'
      } else {
        csvData.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            const excelCell = worksheet.getCell(rowIndex + 1, colIndex + 1)

            const value = this.parseValue(cell)
            excelCell.value = value

            if (rowIndex === 0) {
              excelCell.font = { bold: true }
              excelCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' },
              }
              excelCell.alignment = { vertical: 'middle', horizontal: 'center' }
            }
          })
        })

        worksheet.columns.forEach((column) => {
          let maxLength = 10
          column.eachCell({ includeEmpty: false }, (cell) => {
            const cellLength = cell.value ? cell.value.toString().length : 0
            maxLength = Math.max(maxLength, cellLength)
          })
          column.width = Math.min(maxLength + 2, 50)
        })

        worksheet.eachRow({ includeEmpty: false }, (row) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            }
          })
        })
      }

      const arrayBuffer = await workbook.xlsx.writeBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const filename = `response_${Date.now()}.xlsx`

      const fileUrl = await this.saveMinioService.saveFile(
        {
          filename,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          data: buffer.toString('base64'),
          size: buffer.byteLength,
        },
        roomId,
      )

      return fileUrl
    } catch (error) {
      throw new Error(`Failed to generate Excel file: ${error}`)
    }
  }

  private parseValue(cell: string): string | number | Date {
    if (!cell || cell.trim() === '') return ''

    const trimmed = cell.trim()

    const num = Number(trimmed.replace(',', '.'))
    if (!isNaN(num) && /^-?\d+([.,]\d+)?$/.test(trimmed)) {
      return num
    }

    const datePatterns = [/^(\d{2})\.(\d{2})\.(\d{4})$/, /^(\d{4})-(\d{2})-(\d{2})$/]

    for (const pattern of datePatterns) {
      const match = trimmed.match(pattern)
      if (match) {
        try {
          let date: Date
          if (pattern === datePatterns[0]) {
            date = new Date(+match[3], +match[2] - 1, +match[1])
          } else {
            date = new Date(+match[1], +match[2] - 1, +match[3])
          }

          if (!isNaN(date.getTime())) {
            return date
          }
        } catch (e) {}
      }
    }

    return trimmed
  }
}
