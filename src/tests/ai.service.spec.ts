import { Test, TestingModule } from '@nestjs/testing'
import { AIService, AIResponse } from 'socket/ai.service'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('AIService', () => {
    let service: AIService
    let configService: ConfigService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AIService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            switch (key) {
                                case 'OPENAI_API_URL':
                                    return 'https://api.openai.com/v1/chat/completions'
                                case 'OPENAI_MODEL':
                                    return 'gpt-3.5-turbo'
                                case 'OPENAI_API_KEY':
                                    return 'fake-api-key'
                                case 'BACKEND_URL':
                                    return 'http://localhost:3000'
                                default:
                                    return undefined
                            }
                        }),
                    },
                },
            ],
        }).compile()

        service = module.get<AIService>(AIService)
        configService = module.get<ConfigService>(ConfigService)
    })

    it('should call axios and return AI response', async () => {
        mockedAxios.post.mockResolvedValue({
            data: {
                model: 'gpt-3.5-turbo',
                usage: { total_tokens: 10 },
                choices: [{ message: { content: 'Hello AI' } }],
            },
        })

        const messages = [{ role: 'user', content: 'Hi' }]
        const result: AIResponse = await service.generateResponse(messages, 'text', 0.5)

        expect(result).toEqual({
            content: 'Hello AI',
            model: 'gpt-3.5-turbo',
            usage: { total_tokens: 10 },
        })
        expect(mockedAxios.post).toHaveBeenCalled()
    })

    it('should throw error if axios fails', async () => {
        mockedAxios.post.mockRejectedValue(new Error('Network error'))

        const messages = [{ role: 'user', content: 'Hi' }]
        await expect(service.generateResponse(messages, 'text')).rejects.toThrow('Network error')
    })

    it('should append system message for pdf type', async () => {
        mockedAxios.post.mockResolvedValue({
            data: { model: 'gpt-3.5-turbo', usage: {}, choices: [{ message: { content: 'PDF content' } }] },
        })

        const messages = [{ role: 'user', content: 'Content' }]
        const result = await service.generateResponse(messages, 'pdf')

        expect(result.content).toBe('PDF content')
        expect(mockedAxios.post).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                messages: expect.arrayContaining([
                    expect.objectContaining({ role: 'system', content: expect.stringContaining('processes PDF') }),
                ]),
            }),
            expect.any(Object),
        )
    })
})
