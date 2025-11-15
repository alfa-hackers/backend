import { Test, TestingModule } from '@nestjs/testing'
import { MessageService } from 'socket/services/message.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Message } from 'domain/message.entity'
import { Repository } from 'typeorm'
import { LoadContextService } from 'socket/services/load-context.service'
import { SaveMinioService } from 'socket/services/save-minio.service'
import { AttachmentProcessorService } from 'socket/services/messages/attachment-processor.service'
import { ResponseGeneratorService } from 'socket/services/messages/response-generator.service'
describe('MessageService', () => {
  let service: MessageService
  let repo: Repository<Message>
  let loadContext: LoadContextService
  let saveMinio: SaveMinioService
  let attachmentProcessor: AttachmentProcessorService
  let responseGenerator: ResponseGeneratorService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        {
          provide: getRepositoryToken(Message),
          useValue: { save: jest.fn() },
        },
        { provide: LoadContextService, useValue: { loadContext: jest.fn() } },
        { provide: SaveMinioService, useValue: { saveFile: jest.fn() } },
        { provide: AttachmentProcessorService, useValue: { processAttachment: jest.fn() } },
        { provide: ResponseGeneratorService, useValue: { generateResponseByFlag: jest.fn() } },
      ],
    }).compile()

    service = module.get<MessageService>(MessageService)
    repo = module.get<Repository<Message>>(getRepositoryToken(Message))
    loadContext = module.get<LoadContextService>(LoadContextService)
    saveMinio = module.get<SaveMinioService>(SaveMinioService)
    attachmentProcessor = module.get<AttachmentProcessorService>(AttachmentProcessorService)
    responseGenerator = module.get<ResponseGeneratorService>(ResponseGeneratorService)
  })

  it('should return error if user not identified', async () => {
    const socket = { id: '1', rooms: new Set(), data: {} } as any
    const result = await service.handleMessage(
      { roomId: 'r1', message: 'hi' } as any,
      socket,
      { getUserBySocketId: () => null } as any,
      { to: () => ({ emit: jest.fn() }) } as any,
      {} as any,
    )
    expect(result).toEqual({ success: false, error: 'User not identified' })
  })

  it('should return error if user not in room', async () => {
    const socket = { id: '1', rooms: new Set(), data: {} } as any
    const clientManager = { getUserBySocketId: () => 'user1' } as any
    const result = await service.handleMessage(
      { roomId: 'r1', message: 'hi' } as any,
      socket,
      clientManager,
      { to: () => ({ emit: jest.fn() }) } as any,
      {} as any,
    )
    expect(result).toEqual({ success: false, error: 'You must join the room first' })
  })

  it('should handle message with attachments and AI response', async () => {
    const socket = {
      id: '1',
      rooms: new Set(['r1']),
      data: { userTempId: 'temp1', dbUserId: 'db1' },
    } as any
    const clientManager = { getUserBySocketId: () => 'user1' } as any
    const server = { to: () => ({ emit: jest.fn() }) } as any

    jest.spyOn(attachmentProcessor, 'processAttachment').mockResolvedValue('extracted text')
    jest.spyOn(saveMinio, 'saveFile').mockResolvedValue('file-url')
    jest
      .spyOn(loadContext, 'loadContext')
      .mockResolvedValue([{ role: 'user', content: 'hi\n\nextracted text' }])
    jest
      .spyOn(responseGenerator, 'generateResponseByFlag')
      .mockResolvedValue({ formattedResponse: 'AI reply', responseFileUrl: 'ai-file-url' })
    jest.spyOn(repo, 'save').mockResolvedValue({} as any)

    const payload = {
      roomId: 'r1',
      message: 'hi',
      attachments: [{ filename: 'file.txt', data: '', mimeType: 'text/plain' }],
    } as any
    const aiService = {
      generateResponse: jest.fn().mockResolvedValue({ content: 'AI content' }),
    } as any

    const result = await service.handleMessage(payload, socket, clientManager, server, aiService)

    expect(result).toEqual({
      success: true,
      responseType: 'text',
      fileUrl: 'ai-file-url',
    })
  })
})
