import { Injectable } from '@nestjs/common'
import { Socket } from 'socket.io'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Message } from 'domain/message.entity'
import { ClientManagerService } from '../client-manager.service'
import { AIService } from '../ai.service'
import { SendMessagePayload } from '../socket.interface'
import { LoadContextService } from './load-context.service'
import { SaveMinioService } from './save-minio.service'
import { AttachmentProcessorService } from './messages/attachment-processor.service'
import { ResponseGeneratorService } from './messages/response-generator.service'
import {
  temperatureMap,
  topPMap,
  frequencyPenaltyMap,
  stopSequencesMap,
  presencePenaltyMap,
  maxTokensMap,
} from './consts'

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly loadContextService: LoadContextService,
    private readonly saveMinioService: SaveMinioService,
    private readonly attachmentProcessor: AttachmentProcessorService,
    private readonly responseGenerator: ResponseGeneratorService,
  ) {}

  async handleMessage(
    payload: SendMessagePayload,
    socket: Socket,
    clientManager: ClientManagerService,
    server,
    aiService: AIService,
  ) {
    const {
      roomId,
      message,
      attachments,
      messageFlag = 'text',
      temperature: customTemp,
      topP: customTopP,
      frequencyPenalty: customFreqPenalty,
      presencePenalty: customPresPenalty,
      stopSequences: customStopSeq,
      maxTokens: customMaxTokens,
    } = payload
    const userId = clientManager.getUserBySocketId(socket.id)
    const { userTempId, dbUserId } = socket.data

    if (!userId) return { success: false, error: 'User not identified' }
    if (!socket.rooms.has(roomId)) return { success: false, error: 'You must join the room first' }

    let processedContent = message
    let fileUrl: string | null = null

    if (attachments?.length) {
      for (const attachment of attachments) {
        const extractedText = await this.attachmentProcessor.processAttachment(attachment)
        const savedFileUrl = await this.saveMinioService.saveFile(attachment, roomId)

        if (savedFileUrl) fileUrl = savedFileUrl
        if (extractedText) processedContent += `\n\n${extractedText}`
      }
    }

    server.to(roomId).emit('message', { userId, message })

    await this.messageRepository.save({
      text: message,
      roomId,
      userTempId,
      userId: dbUserId,
      isAi: false,
      messageType: 'user',
      file_address: fileUrl,
      file_name: attachments?.length ? attachments[0].filename : null,
    })

    try {
      const combinedMessages = await this.loadContextService.loadContextWithTokenLimit(
        roomId,
        processedContent,
        customMaxTokens ?? maxTokensMap[messageFlag],
      )

      const temperature = customTemp ?? temperatureMap[messageFlag] ?? 1
      const topP = customTopP ?? topPMap[messageFlag] ?? 1
      const frequencyPenalty = customFreqPenalty ?? frequencyPenaltyMap[messageFlag] ?? 0.0
      const presencePenalty = customPresPenalty ?? presencePenaltyMap[messageFlag] ?? 0.0
      const stopSequences = customStopSeq ?? stopSequencesMap[messageFlag]
      const maxTokens = customMaxTokens ?? maxTokensMap[messageFlag]

      const aiResponse = await aiService.generateResponse(
        combinedMessages,
        messageFlag,
        temperature,
        topP,
        frequencyPenalty,
        presencePenalty,
        stopSequences,
        maxTokens,
      )

      const { formattedResponse, responseFileUrl } =
        await this.responseGenerator.generateResponseByFlag(messageFlag, aiResponse, roomId)

      server.to(roomId).emit('message', {
        userId: 'assistant',
        message: formattedResponse,
        fileUrl: responseFileUrl,
        responseType: messageFlag,
      })

      await this.messageRepository.save({
        text: aiResponse.content,
        roomId,
        userTempId,
        userId: dbUserId,
        isAi: true,
        messageType: 'assistant',
        file_address: responseFileUrl,
        response_type: messageFlag,
      })

      return {
        success: true,
        responseType: messageFlag,
        fileUrl: responseFileUrl,
      }
    } catch (error) {
      server.to(roomId).emit('message', {
        userId: 'system',
        message: `AI Error: ${error.message}`,
      })

      return { success: false, error: error.message }
    }
  }
}
