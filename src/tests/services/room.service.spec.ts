import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { RoomsService } from '../../controllers/rooms/services/rooms.service'
import { Room } from 'domain/room.entity'
import { User } from 'domain/user.entity'
import { AuthService } from 'controllers/auth/services'
import { NotFoundException, UnauthorizedException } from '@nestjs/common'
import { FastifyRequest } from 'fastify'

describe('RoomsService', () => {
    let service: RoomsService
    let roomRepository: Repository<Room>
    let userRepository: Repository<User>
    let authService: AuthService

    const mockRoomRepository = {
        findOne: jest.fn(),
        createQueryBuilder: jest.fn(),
        remove: jest.fn(),
    }

    const mockUserRepository = {
        findOne: jest.fn(),
    }

    const mockAuthService = {
        getCurrentUser: jest.fn(),
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoomsService,
                {
                    provide: getRepositoryToken(Room),
                    useValue: mockRoomRepository,
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepository,
                },
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
            ],
        }).compile()

        service = module.get<RoomsService>(RoomsService)
        roomRepository = module.get<Repository<Room>>(getRepositoryToken(Room))
        userRepository = module.get<Repository<User>>(getRepositoryToken(User))
        authService = module.get<AuthService>(AuthService)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('extractUserId', () => {
        it('should return user id from authenticated user', async () => {
            const mockRequest = {
                headers: { cookie: 'session=123' },
                session: {},
            } as FastifyRequest

            mockAuthService.getCurrentUser.mockResolvedValue({ id: 'user-123' })

            const result = await service.extractUserId(mockRequest, authService)

            expect(result).toBe('user-123')
            expect(mockAuthService.getCurrentUser).toHaveBeenCalledWith(mockRequest)
        })

        it('should return temp user id from session', async () => {
            const mockRequest = {
                headers: {},
                session: { user_temp_id: 'temp-123' },
            } as any

            const result = await service.extractUserId(mockRequest, authService)

            expect(result).toBe('temp-123')
        })

        it('should return null if no user id available', async () => {
            const mockRequest = {
                headers: {},
                session: {},
            } as any

            const result = await service.extractUserId(mockRequest, authService)

            expect(result).toBeNull()
        })
    })

    describe('getRoomsByUserId', () => {
        it('should throw UnauthorizedException if userId is not provided', async () => {
            await expect(service.getRoomsByUserId('')).rejects.toThrow(UnauthorizedException)
        })

        it('should throw NotFoundException if user does not exist', async () => {
            mockUserRepository.findOne.mockResolvedValue(null)

            await expect(service.getRoomsByUserId('user-123')).rejects.toThrow(NotFoundException)
        })

        it('should return rooms for valid user', async () => {
            const mockUser = { id: 'user-123' }
            const mockRooms = [
                { id: 'room-1', name: 'Room 1' },
                { id: 'room-2', name: 'Room 2' },
            ]

            mockUserRepository.findOne.mockResolvedValue(mockUser)
            mockRoomRepository.createQueryBuilder.mockReturnValue({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                leftJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockRooms),
            })

            const result = await service.getRoomsByUserId('user-123')

            expect(result).toEqual({
                data: mockRooms,
                meta: { total: 2 },
            })
        })
    })

    describe('deleteRoom', () => {
        it('should throw NotFoundException if room does not exist', async () => {
            mockRoomRepository.findOne.mockResolvedValue(null)

            await expect(service.deleteRoom('room-123')).rejects.toThrow(NotFoundException)
        })

        it('should delete room successfully', async () => {
            const mockRoom = { id: 'room-123', name: 'Test Room' }
            mockRoomRepository.findOne.mockResolvedValue(mockRoom)
            mockRoomRepository.remove.mockResolvedValue(mockRoom)

            const result = await service.deleteRoom('room-123')

            expect(result).toEqual({
                success: true,
                message: 'Room deleted successfully',
            })
            expect(mockRoomRepository.remove).toHaveBeenCalledWith(mockRoom)
        })
    })
})