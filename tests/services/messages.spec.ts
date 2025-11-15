import { Test, TestingModule } from '@nestjs/testing'
import { MessagesService } from 'controllers/messages/services/messages.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Message } from 'domain/message.entity'
import { Room } from 'domain/room.entity'
import { User } from 'domain/user.entity'
import { Repository } from 'typeorm'
import { AuthService } from 'controllers/auth/services'
import { NotFoundException, UnauthorizedException } from '@nestjs/common'

describe('MessagesService', () => {
    let service: MessagesService

    let messageRepo: jest.Mocked<Partial<Repository<Message>>>
    let roomRepo: jest.Mocked<Partial<Repository<Room>>>
    let userRepo: jest.Mocked<Partial<Repository<User>>>
    let authService: jest.Mocked<AuthService>

    const mockMessageRepo = {
        find: jest.fn(),
        findOne: jest.fn(),
    }

    const mockRoomRepo = {
        findOne: jest.fn(),
    }

    const mockUserRepo = {
        findOne: jest.fn(),
    }

    const mockAuthService = {
        getCurrentUser: jest.fn(),
    }

    const mockRequest: any = {
        session: {},
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MessagesService,
                { provide: getRepositoryToken(Message), useValue: mockMessageRepo },
                { provide: getRepositoryToken(Room), useValue: mockRoomRepo },
                { provide: getRepositoryToken(User), useValue: mockUserRepo },
                { provide: AuthService, useValue: mockAuthService },
            ],
        }).compile()

        service = module.get(MessagesService)

        messageRepo = module.get(getRepositoryToken(Message))
        roomRepo = module.get(getRepositoryToken(Room))
        userRepo = module.get(getRepositoryToken(User))
        authService = module.get(AuthService)
    })

    afterEach(() => jest.clearAllMocks())

    describe('getUserId', () => {
        it('should return user id from kratos', async () => {
            authService.getCurrentUser.mockResolvedValue({ id: '123' })

            const result = await (service as any).getUserId(mockRequest)
            expect(result).toBe('123')
        })

        it('should fallback to session user id', async () => {
            authService.getCurrentUser.mockRejectedValue(new Error('kratos down'))
            mockRequest.session.user_temp_id = 'temp-123'

            const result = await (service as any).getUserId(mockRequest)
            expect(result).toBe('temp-123')
        })

        it('should throw if no kratos and no session', async () => {
            authService.getCurrentUser.mockRejectedValue(new Error('fail'))
            mockRequest.session.user_temp_id = undefined

            await expect((service as any).getUserId(mockRequest)).rejects.toThrow(
                UnauthorizedException,
            )
        })
    })

    describe('getMessagesByRoomId', () => {
        const dto = { roomId: 'room1', limit: 10, offset: 0 }

        it('should return messages for room', async () => {
            authService.getCurrentUser.mockResolvedValue({ id: '123' })
            roomRepo.findOne.mockResolvedValue({ id: 'room1' } as Room)
            messageRepo.find.mockResolvedValue([{ id: 'm1' }] as Message[])

            const result = await service.getMessagesByRoomId(dto, mockRequest)

            expect(result.data).toHaveLength(1)
            expect(result.meta.userId).toBe('123')
        })

        it('should throw if room not found', async () => {
            authService.getCurrentUser.mockResolvedValue({ id: '123' })
            roomRepo.findOne.mockResolvedValue(null)

            await expect(service.getMessagesByRoomId(dto, mockRequest)).rejects.toThrow(
                NotFoundException,
            )
        })
    })

    describe('getMessagesByUserId', () => {
        const dto = { roomId: null, limit: 10, offset: 0 }

        it('should return user messages', async () => {
            authService.getCurrentUser.mockResolvedValue({ id: '123' })
            userRepo.findOne.mockResolvedValue({ id: '123' } as User)
            messageRepo.find.mockResolvedValue([{ id: 'm1' }] as Message[])

            const result = await service.getMessagesByUserId(dto, mockRequest)

            expect(result.data).toHaveLength(1)
            expect(result.meta.userId).toBe('123')
        })

        it('should throw if user does not exist', async () => {
            authService.getCurrentUser.mockResolvedValue({ id: '999' })
            userRepo.findOne.mockResolvedValue(null)

            await expect(service.getMessagesByUserId(dto, mockRequest)).rejects.toThrow(
                NotFoundException,
            )
        })
    })

    describe('getMessageById', () => {
        it('should return message', async () => {
            messageRepo.findOne.mockResolvedValue({ id: 'm1' } as Message)

            const result = await service.getMessageById('m1')
            expect(result.id).toBe('m1')
        })

        it('should throw if message not found', async () => {
            messageRepo.findOne.mockResolvedValue(null)

            await expect(service.getMessageById('m1')).rejects.toThrow(NotFoundException)
        })
    })
})
