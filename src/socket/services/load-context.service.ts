import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Message } from 'domain/message.entity'

@Injectable()
export class LoadContextService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

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
}
