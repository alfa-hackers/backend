import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Message } from 'domain/message.entity'
import { pipeline } from '@xenova/transformers'

@Injectable()
export class LoadContextService implements OnModuleInit {
  private summarizer: any

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async onModuleInit() {
    try {
      this.summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6')
    } catch (error) {
      console.error('Failed to initialize summarizer:', error)
    }
  }

  async loadContext(
    roomId: string,
    userMessage?: string,
    limit: number = 50,
  ): Promise<Array<{ role: string; content: string }>> {
    const messages = await this.messageRepository.find({
      where: { roomId },
      order: { createdAt: 'DESC' },
      take: limit,
    })

    const context = messages.reverse().map((msg) => ({
      role: msg.messageType === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }))

    if (userMessage) {
      context.push({ role: 'user', content: userMessage })
    }

    return context
  }

  async loadContextWithTokenLimit(
    roomId: string,
    userMessage?: string,
    maxTokens: number = 10000,
  ): Promise<Array<{ role: string; content: string }>> {
    const messages = await this.messageRepository.find({
      where: { roomId },
      order: { createdAt: 'DESC' },
      take: 100,
    })

    let context = messages.reverse().map((msg) => ({
      role: msg.messageType === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }))

    const estimateTokens = (text: string) => Math.ceil(text.length / 4)

    let totalTokens = 0
    let index = context.length - 1

    while (index >= 0 && totalTokens < maxTokens * 0.7) {
      totalTokens += estimateTokens(context[index].content)
      index--
    }

    if (index > 0 && this.summarizer) {
      const oldMessages = context.slice(0, index + 1)
      const recentMessages = context.slice(index + 1)

      const textToSummarize = oldMessages.map((msg) => `${msg.role}: ${msg.content}`).join('\n')

      try {
        const summary = await this.summarizer(textToSummarize, {
          max_length: 400,
          min_length: 30,
        })

        context = [
          {
            role: 'system',
            content: `Previous conversation summary: ${summary[0].summary_text}`,
          },
          ...recentMessages,
        ]
      } catch (error) {
        console.error('Summarization error:', error)
        context = recentMessages
      }
    } else if (index > 0) {
      context = context.slice(index + 1)
    }

    if (userMessage) {
      context.push({ role: 'user', content: userMessage })
    }

    return context
  }
}
