import { Test, TestingModule } from '@nestjs/testing'
import { LoadContextService } from 'socket/services/load-context.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Message } from 'domain/message.entity'
import { Repository } from 'typeorm'

describe('LoadContextService', () => {
    let service: LoadContextService
    let repo: Repository<Message>

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LoadContextService,
                {
                    provide: getRepositoryToken(Message),
                    useValue: {
                        find: jest.fn(),
                    },
                },
            ],
        }).compile()

        service = module.get<LoadContextService>(LoadContextService)
        repo = module.get<Repository<Message>>(getRepositoryToken(Message))
    })

    it('should load context messages', async () => {
        const messages = [
            { messageType: 'user', text: 'Hello', createdAt: new Date() },
            { messageType: 'assistant', text: 'Hi', createdAt: new Date() },
        ]

        jest.spyOn(repo, 'find').mockResolvedValue(messages as any)

        const result = await service.loadContext('room1')

        expect(result).toEqual([
            { role: 'assistant', content: 'Hi' },
            { role: 'user', content: 'Hello' },
        ])
    })

    it('should include user message if provided', async () => {
        jest.spyOn(repo, 'find').mockResolvedValue([] as any)

        const result = await service.loadContext('room1', 'test message')

        expect(result).toEqual([{ role: 'user', content: 'test message' }])
    })
})
