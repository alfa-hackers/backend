import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AuthService } from 'controllers/auth/services'
import { User } from 'domain/user.entity'
import { ForbiddenException, ConflictException, HttpStatus } from '@nestjs/common'
import { FastifyRequest, FastifyReply } from 'fastify'
import axios from 'axios'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('AuthService', () => {
    let service: AuthService
    let userRepository: Repository<User>

    const mockUser = {
        id: 'kratos-id-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        avatar_url: null,
        temp: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    const mockKratosIdentity = {
        id: 'kratos-id-123',
        traits: {
            username: 'testuser',
            email: 'test@example.com',
        },
    }

    const mockFlow = {
        id: 'flow-id-123',
        ui: {
            nodes: [
                {
                    attributes: {
                        name: 'csrf_token',
                        value: 'csrf-token-123',
                    },
                },
            ],
        },
    }

    const mockRequest = {
        headers: {
            cookie: 'session=test-session',
        },
    } as FastifyRequest

    const mockResponse = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        header: jest.fn().mockReturnThis(),
    } as unknown as FastifyReply

    beforeEach(async () => {
        process.env.KRATOS_PUBLIC_URL = 'http://localhost:4433'
        process.env.KRATOS_ADMIN_URL = 'http://localhost:4434'

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                    },
                },
            ],
        }).compile()

        service = module.get<AuthService>(AuthService)
        userRepository = module.get<Repository<User>>(getRepositoryToken(User))

        jest.clearAllMocks()
    })

    describe('getCurrentUser', () => {
        it('should return null if no cookie provided', async () => {
            const req = { headers: {} } as FastifyRequest
            const result = await service.getCurrentUser(req)
            expect(result).toBeNull()
        })

        it('should return user from session', async () => {
            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    identity: mockKratosIdentity,
                },
            })

            jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(mockUser as User)

            const result = await service.getCurrentUser(mockRequest)

            expect(result).toEqual(mockUser)
            expect(mockedAxios.get).toHaveBeenCalledWith(
                'http://localhost:4433/sessions/whoami',
                expect.objectContaining({
                    headers: { cookie: 'session=test-session' },
                }),
            )
        })

        it('should sync user if not found in database', async () => {
            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    identity: mockKratosIdentity,
                },
            })

            jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null)
            jest.spyOn(userRepository, 'create').mockReturnValueOnce(mockUser as User)
            jest.spyOn(userRepository, 'save').mockResolvedValueOnce(mockUser as User)

            const result = await service.getCurrentUser(mockRequest)

            expect(result).toEqual(mockUser)
            expect(userRepository.save).toHaveBeenCalled()
        })

        it('should return error on exception', async () => {
            const error = new Error('Network error')
            mockedAxios.get.mockRejectedValueOnce(error)

            const result = await service.getCurrentUser(mockRequest)

            expect(result).toEqual(error)
        })
    })

    describe('handleSignup', () => {
        const signupDto = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
        }

        it('should successfully register a new user', async () => {
            mockedAxios.get.mockResolvedValueOnce({
                data: mockFlow,
                headers: { 'set-cookie': ['cookie1=value1'] },
            })

            mockedAxios.post.mockResolvedValueOnce({
                data: {
                    identity: mockKratosIdentity,
                    session: { id: 'session-123' },
                },
                headers: { 'set-cookie': ['session=new-session'] },
            })

            jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null)
            jest.spyOn(userRepository, 'create').mockReturnValueOnce(mockUser as User)
            jest.spyOn(userRepository, 'save').mockResolvedValueOnce(mockUser as User)

            await service.handleSignup(signupDto, mockRequest, mockResponse)

            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED)
            expect(mockResponse.send).toHaveBeenCalledWith({
                message: 'User successfully registered',
                session: { id: 'session-123' },
                user: {
                    id: mockUser.id,
                    username: mockUser.username,
                    email: mockUser.email,
                    role: mockUser.role,
                },
            })
        })

        it('should throw ConflictException if username exists', async () => {
            mockedAxios.get.mockResolvedValueOnce({
                data: mockFlow,
                headers: { 'set-cookie': ['cookie1=value1'] },
            })

            mockedAxios.post.mockResolvedValueOnce({
                data: {
                    identity: mockKratosIdentity,
                    session: { id: 'session-123' },
                },
                headers: { 'set-cookie': ['session=new-session'] },
            })

            jest.spyOn(userRepository, 'findOne')
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ ...mockUser, id: 'different-id' } as User)

            await expect(
                service.handleSignup(signupDto, mockRequest, mockResponse),
            ).rejects.toThrow(ConflictException)
        })

        it('should throw ForbiddenException on axios error', async () => {
            mockedAxios.get.mockRejectedValueOnce({
                response: {
                    data: {
                        ui: {
                            messages: [{ text: 'Registration error' }],
                        },
                    },
                },
            })

            await expect(
                service.handleSignup(signupDto, mockRequest, mockResponse),
            ).rejects.toThrow(ForbiddenException)
        })
    })

    describe('handleLogin', () => {
        const loginDto = {
            email: 'test@example.com',
            username: 'testuser',
            password: 'password123',
        }
        it('should successfully log in a user', async () => {
            mockedAxios.get
                .mockResolvedValueOnce({
                    data: mockFlow,
                    headers: { 'set-cookie': ['cookie1=value1'] },
                })
                .mockResolvedValueOnce({
                    data: {
                        identity: mockKratosIdentity,
                    },
                })

            mockedAxios.post.mockResolvedValueOnce({
                data: {
                    session: { id: 'session-123' },
                },
                headers: { 'set-cookie': ['session=new-session'] },
            })

            jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(mockUser as User)
            jest.spyOn(userRepository, 'save').mockResolvedValueOnce(mockUser as User)

            await service.handleLogin(loginDto, mockRequest, mockResponse)

            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK)
            expect(mockResponse.send).toHaveBeenCalledWith({
                message: 'User successfully logged in',
                session: expect.any(Object),
                user: expect.objectContaining({
                    id: mockUser.id,
                    username: mockUser.username,
                    email: mockUser.email,
                }),
            })
        })

        it('should throw ForbiddenException if identity not found', async () => {
            mockedAxios.get.mockResolvedValueOnce({
                data: mockFlow,
                headers: { 'set-cookie': ['cookie1=value1'] },
            })

            mockedAxios.post.mockResolvedValueOnce({
                data: {
                    session: { id: 'session-123' },
                },
                headers: { 'set-cookie': ['session=new-session'] },
            })

            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    identity: null,
                },
            })

            await expect(
                service.handleLogin(loginDto, mockRequest, mockResponse),
            ).rejects.toThrow(ForbiddenException)
        })
    })

    describe('handleLogout', () => {
        it('should successfully log out a user', async () => {
            mockedAxios.get
                .mockResolvedValueOnce({
                    data: {
                        logout_url: 'http://localhost:4433/self-service/logout?token=token123',
                    },
                })
                .mockResolvedValueOnce({
                    headers: { 'set-cookie': ['session=; Max-Age=0'] },
                })

            await service.handleLogout(mockRequest, mockResponse)

            expect(mockResponse.send).toHaveBeenCalledWith({
                message: 'User successfully logged out',
            })
        })

        it('should return 400 if no cookie provided', async () => {
            const req = { headers: {} } as FastifyRequest

            await service.handleLogout(req, mockResponse)

            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
            expect(mockResponse.send).toHaveBeenCalledWith({
                message: 'No session cookie provided',
            })
        })

        it('should throw ForbiddenException on error', async () => {
            mockedAxios.get.mockRejectedValueOnce({
                message: 'Logout error',
            })

            await expect(service.handleLogout(mockRequest, mockResponse)).rejects.toThrow(
                ForbiddenException,
            )
        })
    })

    describe('handleGetCurrentUser', () => {
        it('should return current user', async () => {
            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    identity: mockKratosIdentity,
                },
            })

            jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(mockUser as User)

            await service.handleGetCurrentUser(mockRequest, mockResponse)

            expect(mockResponse.send).toHaveBeenCalledWith({
                user: expect.objectContaining({
                    id: mockUser.id,
                    username: mockUser.username,
                    email: mockUser.email,
                }),
            })
        })

        it('should return 401 if no cookie provided', async () => {
            const req = { headers: {} } as FastifyRequest

            await service.handleGetCurrentUser(req, mockResponse)

            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
        })

        it('should sync user if not found in database', async () => {
            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    identity: mockKratosIdentity,
                },
            })

            jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null)
            jest.spyOn(userRepository, 'create').mockReturnValueOnce(mockUser as User)
            jest.spyOn(userRepository, 'save').mockResolvedValueOnce(mockUser as User)

            await service.handleGetCurrentUser(mockRequest, mockResponse)

            expect(mockResponse.send).toHaveBeenCalledWith({
                user: expect.objectContaining({
                    id: mockUser.id,
                }),
            })
        })

        it('should throw ForbiddenException on error', async () => {
            mockedAxios.get.mockRejectedValueOnce(new Error('Network error'))

            await expect(
                service.handleGetCurrentUser(mockRequest, mockResponse),
            ).rejects.toThrow(ForbiddenException)
        })
    })

    describe('handleGetCurrentUserId', () => {
        it('should return current user id', async () => {
            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    identity: mockKratosIdentity,
                },
            })

            jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(mockUser as User)

            await service.handleGetCurrentUserId(mockRequest, mockResponse)

            expect(mockResponse.send).toHaveBeenCalledWith({
                userId: mockUser.id,
            })
        })

        it('should return 401 if no cookie provided', async () => {
            const req = { headers: {} } as FastifyRequest

            await service.handleGetCurrentUserId(req, mockResponse)

            expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
        })

        it('should throw ForbiddenException on error', async () => {
            mockedAxios.get.mockRejectedValueOnce(new Error('Network error'))

            await expect(
                service.handleGetCurrentUserId(mockRequest, mockResponse),
            ).rejects.toThrow(ForbiddenException)
        })
    })

    describe('updateUserProfile', () => {
        it('should update user avatar_url', async () => {
            jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(mockUser as User)
            jest.spyOn(userRepository, 'save').mockResolvedValueOnce({
                ...mockUser,
                avatar_url: 'http://example.com/avatar.jpg',
            } as User)

            const result = await service.updateUserProfile('kratos-id-123', {
                avatar_url: 'http://example.com/avatar.jpg',
            })

            expect(result.avatar_url).toBe('http://example.com/avatar.jpg')
            expect(userRepository.save).toHaveBeenCalled()
        })

        it('should update user role', async () => {
            jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(mockUser as User)
            jest.spyOn(userRepository, 'save').mockResolvedValueOnce({
                ...mockUser,
                role: 'admin',
            } as User)

            const result = await service.updateUserProfile('kratos-id-123', {
                role: 'admin',
            })

            expect(result.role).toBe('admin')
        })

        it('should throw ForbiddenException if user not found', async () => {
            jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null)

            await expect(
                service.updateUserProfile('non-existent-id', { avatar_url: 'url' }),
            ).rejects.toThrow(ForbiddenException)
        })
    })

    describe('syncUserToPostgres', () => {
        it('should throw ForbiddenException if no kratos identity', async () => {
            await expect((service as any).syncUserToPostgres(null)).rejects.toThrow(
                ForbiddenException,
            )
        })

        it('should update existing user', async () => {
            jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce({
                ...mockUser,
                temp: true,
            } as User)
            jest.spyOn(userRepository, 'save').mockResolvedValueOnce(mockUser as User)

            const result = await (service as any).syncUserToPostgres(mockKratosIdentity)

            expect(result.temp).toBe(false)
            expect(userRepository.save).toHaveBeenCalled()
        })

        it('should create new user if not exists', async () => {
            jest.spyOn(userRepository, 'findOne')
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
            jest.spyOn(userRepository, 'create').mockReturnValueOnce(mockUser as User)
            jest.spyOn(userRepository, 'save').mockResolvedValueOnce(mockUser as User)

            const result = await (service as any).syncUserToPostgres(mockKratosIdentity)

            expect(result).toEqual(mockUser)
            expect(userRepository.create).toHaveBeenCalled()
        })

        it('should throw ConflictException if username exists with different id', async () => {
            jest.spyOn(userRepository, 'findOne')
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ ...mockUser, id: 'different-id' } as User)

            await expect(
                (service as any).syncUserToPostgres(mockKratosIdentity),
            ).rejects.toThrow(ConflictException)
        })

        it('should throw ConflictException if email exists with different id', async () => {
            jest.spyOn(userRepository, 'findOne')
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ ...mockUser, id: 'different-id' } as User)

            await expect(
                (service as any).syncUserToPostgres(mockKratosIdentity),
            ).rejects.toThrow(ConflictException)
        })
    })

    describe('getUserFromSession', () => {
        it('should return user by kratos identity id', async () => {
            jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(mockUser as User)

            const result = await service.getUserFromSession('kratos-id-123')

            expect(result).toEqual(mockUser)
            expect(userRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'kratos-id-123' },
            })
        })

        it('should return null if user not found', async () => {
            jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null)

            const result = await service.getUserFromSession('non-existent-id')

            expect(result).toBeNull()
        })
    })
})
