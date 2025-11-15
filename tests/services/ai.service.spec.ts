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

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('generateResponse - basic functionality', () => {
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

        it('should use default values when config is not provided', async () => {
            const moduleWithNoConfig: TestingModule = await Test.createTestingModule({
                providers: [
                    AIService,
                    {
                        provide: ConfigService,
                        useValue: {
                            get: jest.fn(() => undefined),
                        },
                    },
                ],
            }).compile()

            const serviceWithNoConfig = moduleWithNoConfig.get<AIService>(AIService)

            mockedAxios.post.mockResolvedValue({
                data: {
                    model: 'openai/gpt-3.5-turbo',
                    usage: {},
                    choices: [{ message: { content: 'Response' } }],
                },
            })

            const messages = [{ role: 'user', content: 'Test' }]
            await serviceWithNoConfig.generateResponse(messages, 'text')

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://openrouter.ai/api/v1/chat/completions',
                expect.objectContaining({
                    model: 'openai/gpt-3.5-turbo',
                }),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'HTTP-Referer': 'http://localhost:3000',
                    }),
                }),
            )
        })

        it('should trim whitespace from response content', async () => {
            mockedAxios.post.mockResolvedValue({
                data: {
                    model: 'gpt-3.5-turbo',
                    usage: {},
                    choices: [{ message: { content: '  Response with spaces  \n' } }],
                },
            })

            const messages = [{ role: 'user', content: 'Test' }]
            const result = await service.generateResponse(messages, 'text')

            expect(result.content).toBe('Response with spaces')
        })

        it('should return default message when AI returns no content', async () => {
            mockedAxios.post.mockResolvedValue({
                data: {
                    model: 'gpt-3.5-turbo',
                    usage: {},
                    choices: [{ message: { content: '' } }],
                },
            })

            const messages = [{ role: 'user', content: 'Test' }]
            const result = await service.generateResponse(messages, 'text')

            expect(result.content).toBe('No response from AI.')
        })
    })

    describe('generateResponse - message types', () => {
        it('should append system message for pdf type', async () => {
            mockedAxios.post.mockResolvedValue({
                data: {
                    model: 'gpt-3.5-turbo',
                    usage: {},
                    choices: [{ message: { content: 'PDF content' } }]
                },
            })

            const messages = [{ role: 'user', content: 'Content' }]
            await service.generateResponse(messages, 'pdf')

            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    messages: expect.arrayContaining([
                        expect.objectContaining({
                            role: 'system',
                            content: expect.stringContaining('processes PDF')
                        }),
                    ]),
                }),
                expect.any(Object),
            )
        })

        it('should append system message for word type', async () => {
            mockedAxios.post.mockResolvedValue({
                data: {
                    model: 'gpt-3.5-turbo',
                    usage: {},
                    choices: [{ message: { content: 'Word content' } }]
                },
            })

            const messages = [{ role: 'user', content: 'Content' }]
            await service.generateResponse(messages, 'word')

            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    messages: expect.arrayContaining([
                        expect.objectContaining({
                            role: 'system',
                            content: expect.stringContaining('processes Word')
                        }),
                    ]),
                }),
                expect.any(Object),
            )
        })

        it('should append system message for excel type', async () => {
            mockedAxios.post.mockResolvedValue({
                data: {
                    model: 'gpt-3.5-turbo',
                    usage: {},
                    choices: [{ message: { content: 'CSV data' } }]
                },
            })

            const messages = [{ role: 'user', content: 'Content' }]
            await service.generateResponse(messages, 'excel')

            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    messages: expect.arrayContaining([
                        expect.objectContaining({
                            role: 'system',
                            content: expect.stringContaining('processes Excel')
                        }),
                    ]),
                }),
                expect.any(Object),
            )
        })

        it('should append system message for powerpoint type', async () => {
            mockedAxios.post.mockResolvedValue({
                data: {
                    model: 'gpt-3.5-turbo',
                    usage: {},
                    choices: [{ message: { content: 'Slide content' } }]
                },
            })

            const messages = [{ role: 'user', content: 'Content' }]
            await service.generateResponse(messages, 'powerpoint')

            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    messages: expect.arrayContaining([
                        expect.objectContaining({
                            role: 'system',
                            content: expect.stringContaining('creates PowerPoint')
                        }),
                    ]),
                }),
                expect.any(Object),
            )
        })

        it('should append system message for checklist type', async () => {
            mockedAxios.post.mockResolvedValue({
                data: {
                    model: 'gpt-3.5-turbo',
                    usage: {},
                    choices: [{ message: { content: 'Checklist items' } }]
                },
            })

            const messages = [{ role: 'user', content: 'Content' }]
            await service.generateResponse(messages, 'checklist')

            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    messages: expect.arrayContaining([
                        expect.objectContaining({
                            role: 'system',
                            content: expect.stringContaining('creates checklists')
                        }),
                    ]),
                }),
                expect.any(Object),
            )
        })

        it('should append system message for business type', async () => {
            mockedAxios.post.mockResolvedValue({
                data: {
                    model: 'gpt-3.5-turbo',
                    usage: {},
                    choices: [{ message: { content: 'Business content' } }]
                },
            })

            const messages = [{ role: 'user', content: 'Content' }]
            await service.generateResponse(messages, 'business')

            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    messages: expect.arrayContaining([
                        expect.objectContaining({
                            role: 'system',
                            content: expect.stringContaining('creates business content')
                        }),
                    ]),
                }),
                expect.any(Object),
            )
        })

        it('should append system message for analytics type', async () => {
            mockedAxios.post.mockResolvedValue({
                data: {
                    model: 'gpt-3.5-turbo',
                    usage: {},
                    choices: [{ message: { content: 'Analytics content' } }]
                },
            })

            const messages = [{ role: 'user', content: 'Content' }]
            await service.generateResponse(messages, 'analytics')

            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    messages: expect.arrayContaining([
                        expect.objectContaining({
                            role: 'system',
                            content: expect.stringContaining('performs market and financial analysis')
                        }),
                    ]),
                }),
                expect.any(Object),
            )
        })

        it('should handle text type with empty system message', async () => {
            mockedAxios.post.mockResolvedValue({
                data: {
                    model: 'gpt-3.5-turbo',
                    usage: {},
                    choices: [{ message: { content: 'Text response' } }]
                },
            })

            const messages = [{ role: 'user', content: 'Content' }]
            await service.generateResponse(messages, 'text')

            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    messages: expect.arrayContaining([
                        expect.objectContaining({
                            role: 'system',
                            content: ''
                        }),
                    ]),
                }),
                expect.any(Object),
            )
        })
    })

    describe('generateResponse - optional parameters', () => {
        it('should pass all optional parameters to axios', async () => {
            mockedAxios.post.mockResolvedValue({
                data: {
                    model: 'gpt-3.5-turbo',
                    usage: {},
                    choices: [{ message: { content: 'Response' } }],
                },
            })

            const messages = [{ role: 'user', content: 'Test' }]
            await service.generateResponse(
                messages,
                'text',
                0.8,
                0.9,
                0.5,
                0.6,
                ['STOP'],
                2000
            )

            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    temperature: 0.8,
                    top_p: 0.9,
                    frequency_penalty: 0.5,
                    presence_penalty: 0.6,
                    stop: ['STOP'],
                    max_tokens: 2000,
                }),
                expect.any(Object),
            )
        })

        it('should use default temperature when not provided', async () => {
            mockedAxios.post.mockResolvedValue({
                data: {
                    model: 'gpt-3.5-turbo',
                    usage: {},
                    choices: [{ message: { content: 'Response' } }],
                },
            })

            const messages = [{ role: 'user', content: 'Test' }]
            await service.generateResponse(messages, 'text')

            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    temperature: 0.7,
                }),
                expect.any(Object),
            )
        })

        it('should pass undefined optional parameters as undefined', async () => {
            mockedAxios.post.mockResolvedValue({
                data: {
                    model: 'gpt-3.5-turbo',
                    usage: {},
                    choices: [{ message: { content: 'Response' } }],
                },
            })

            const messages = [{ role: 'user', content: 'Test' }]
            await service.generateResponse(messages, 'text', 0.5)

            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    top_p: undefined,
                    frequency_penalty: undefined,
                    presence_penalty: undefined,
                    stop: undefined,
                    max_tokens: undefined,
                }),
                expect.any(Object),
            )
        })
    })

    describe('generateResponse - axios configuration', () => {
        it('should include correct headers in axios request', async () => {
            mockedAxios.post.mockResolvedValue({
                data: {
                    model: 'gpt-3.5-turbo',
                    usage: {},
                    choices: [{ message: { content: 'Response' } }],
                },
            })

            const messages = [{ role: 'user', content: 'Test' }]
            await service.generateResponse(messages, 'text')

            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Object),
                expect.objectContaining({
                    headers: {
                        Authorization: 'Bearer fake-api-key',
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'http://localhost:3000',
                        'X-Title': 'NestJS WebSocket Chat',
                    },
                    timeout: 30000,
                }),
            )
        })

        it('should include user messages in payload', async () => {
            mockedAxios.post.mockResolvedValue({
                data: {
                    model: 'gpt-3.5-turbo',
                    usage: {},
                    choices: [{ message: { content: 'Response' } }],
                },
            })

            const messages = [
                { role: 'user', content: 'First message' },
                { role: 'assistant', content: 'First response' },
                { role: 'user', content: 'Second message' },
            ]
            await service.generateResponse(messages, 'text')

            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    messages: expect.arrayContaining([
                        { role: 'system', content: 'You are a helpful AI assistant.' },
                        { role: 'user', content: 'First message' },
                        { role: 'assistant', content: 'First response' },
                        { role: 'user', content: 'Second message' },
                    ]),
                }),
                expect.any(Object),
            )
        })
    })

    describe('generateResponse - error handling', () => {
        it('should throw error if axios fails with network error', async () => {
            mockedAxios.post.mockRejectedValue(new Error('Network error'))

            const messages = [{ role: 'user', content: 'Hi' }]
            await expect(service.generateResponse(messages, 'text')).rejects.toThrow('Network error')
        })

        it('should throw error with API error message when available', async () => {
            mockedAxios.post.mockRejectedValue({
                response: {
                    data: {
                        error: {
                            message: 'API rate limit exceeded',
                        },
                    },
                },
                message: 'Request failed',
            })

            const messages = [{ role: 'user', content: 'Test' }]
            await expect(service.generateResponse(messages, 'text')).rejects.toThrow(
                'API rate limit exceeded'
            )
        })

        it('should throw generic error message when API error message is not available', async () => {
            mockedAxios.post.mockRejectedValue({
                message: 'Request timeout',
            })

            const messages = [{ role: 'user', content: 'Test' }]
            await expect(service.generateResponse(messages, 'text')).rejects.toThrow('Request timeout')
        })

        it('should handle missing choices in response', async () => {
            mockedAxios.post.mockResolvedValue({
                data: {
                    model: 'gpt-3.5-turbo',
                    usage: {},
                },
            })

            const messages = [{ role: 'user', content: 'Test' }]
            const result = await service.generateResponse(messages, 'text')

            expect(result.content).toBe('No response from AI.')
        })

        it('should handle missing message in choices', async () => {
            mockedAxios.post.mockResolvedValue({
                data: {
                    model: 'gpt-3.5-turbo',
                    usage: {},
                    choices: [{}],
                },
            })

            const messages = [{ role: 'user', content: 'Test' }]
            const result = await service.generateResponse(messages, 'text')

            expect(result.content).toBe('No response from AI.')
        })
    })
})
