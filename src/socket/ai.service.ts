import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

export interface AIResponse {
  content: string
  model: string
  usage: any
}

@Injectable()
export class AIService {
  constructor(private configService: ConfigService) {}

  async generateResponse(
    messages: Array<{ role: string; content: string }>,
    messageType:
      | 'text'
      | 'pdf'
      | 'word'
      | 'excel'
      | 'powerpoint'
      | 'checklist'
      | 'business'
      | 'analytics',
    temperature: number = 0.7,
    topP?: number,
    frequencyPenalty?: number,
    presencePenalty?: number,
    stopSequences?: string[],
    maxTokens?: number,
  ): Promise<AIResponse> {
    const apiUrl =
      this.configService.get<string>('OPENAI_API_URL') ||
      'https://openrouter.ai/api/v1/chat/completions'
    const model = this.configService.get<string>('OPENAI_MODEL') || 'openai/gpt-3.5-turbo'
    const apiKey = this.configService.get<string>('OPENAI_API_KEY')
    const backendUrl = this.configService.get<string>('BACKEND_URL') || 'http://localhost:3000'

    const payload: Array<{ role: string; content: string }> = [
      { role: 'system', content: 'You are a helpful AI assistant.' },
      ...messages,
    ]

    switch (messageType) {
      case 'pdf':
        payload.push({
          role: 'system',
          content: `You are an AI that processes PDF documents.
Generate ONLY plain text summary from the PDF content.
Do NOT include explanations, comments, extra words, or formatting.
Output must be clean, readable text with no extra content.`,
        })
        break
      case 'word':
        payload.push({
          role: 'system',
          content: `You are an AI that processes Word documents.
Generate ONLY plain text summary from the Word content.
Do NOT include explanations, comments, extra words, or formatting.
Output must be clean, readable text with no extra content.`,
        })
        break
      case 'excel':
        payload.push({
          role: 'system',
          content: `You are an AI that processes Excel data.
Generate ONLY raw CSV text from the Excel content.
Do NOT include explanations, comments, extra words, or formatting.
Output must be pure CSV, with commas separating values and newlines separating rows.`,
        })
        break
      case 'powerpoint':
        payload.push({
          role: 'system',
          content: `You are an AI that creates PowerPoint presentations.
Generate ONLY plain text content for slides.
Each slide content should be separated by double newlines.
Do NOT include explanations, comments, slide numbers, or formatting instructions.
Output must be clean, presentation-ready text with no extra content.`,
        })
        break
      case 'checklist':
        payload.push({
          role: 'system',
          content: `You are an AI that creates checklists.
Generate ONLY a list of checklist items, one per line.
Do NOT include explanations, comments, checkboxes, or formatting.
Output must be plain text items with no extra content.`,
        })
        break
      case 'business':
        payload.push({
          role: 'system',
          content: `You are an AI that creates business content.
Generate professional, concise, and structured business text.
Do NOT include explanations, comments, or extra formatting.
Focus on clarity, actionable insights, and business relevance.
Output must be plain text with no extra content.`,
        })
        break

      case 'analytics':
        payload.push({
          role: 'system',
          content: `You are an AI that performs market and financial analysis.
Analyze market trends, financial transactions, investment opportunities, and economic indicators.
Provide data-driven insights with quantitative metrics when possible.
Structure analysis with key findings, risk assessment, and actionable recommendations.
Use clear financial terminology and industry-standard metrics.
Output must be professional analytical text with no extra content.`,
        })
        break
      case 'text':
      default:
        payload.push({ role: 'system', content: '' })
        break
    }

    try {
      const response = await axios.post(
        apiUrl,
        {
          model,
          messages: payload,
          temperature,
          top_p: topP,
          frequency_penalty: frequencyPenalty,
          presence_penalty: presencePenalty,
          stop: stopSequences,
          max_tokens: maxTokens,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': backendUrl,
            'X-Title': 'NestJS WebSocket Chat',
          },
          timeout: 30000,
        },
      )

      const rawContent = response.data.choices?.[0]?.message?.content || 'No response from AI.'
      const content = rawContent.trim()

      return {
        content,
        model: response.data.model,
        usage: response.data.usage,
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message
      throw new Error(errorMessage)
    }
  }
}
