import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from 'controllers/auth/auth.controller';
import { AuthService } from 'controllers/auth/services/auth.service';
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthDto, LoginDto } from 'controllers/auth/dto';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: AuthService;

    const mockAuthService = {
        handleSignup: jest.fn(),
        handleLogin: jest.fn(),
        handleLogout: jest.fn(),
        handleGetCurrentUser: jest.fn(),
    };

    const mockRequest = {} as FastifyRequest;
    const mockReply = {
        send: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
        cookie: jest.fn().mockReturnThis(),
        clearCookie: jest.fn().mockReturnThis(),
    } as unknown as FastifyReply;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [{ provide: AuthService, useValue: mockAuthService }],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('signup', () => {
        it('should call authService.handleSignup with correct params', async () => {
            const dto: AuthDto = { username: 'testuser', email: 'test@test.com', password: '123456' };
            mockAuthService.handleSignup.mockResolvedValue('signed up');

            const result = await controller.signup(dto, mockRequest, mockReply);

            expect(mockAuthService.handleSignup).toHaveBeenCalledWith(dto, mockRequest, mockReply);
            expect(result).toBe('signed up');
        });
    });

    describe('login', () => {
        it('should call authService.handleLogin with correct params', async () => {
            const dto: LoginDto = { email: 'test@test.com', password: '123456' };
            mockAuthService.handleLogin.mockResolvedValue('logged in');

            const result = await controller.login(dto, mockRequest, mockReply);

            expect(mockAuthService.handleLogin).toHaveBeenCalledWith(dto, mockRequest, mockReply);
            expect(result).toBe('logged in');
        });
    });

    describe('logout', () => {
        it('should call authService.handleLogout with correct params', async () => {
            mockAuthService.handleLogout.mockResolvedValue('logged out');

            const result = await controller.logout(mockRequest, mockReply);

            expect(mockAuthService.handleLogout).toHaveBeenCalledWith(mockRequest, mockReply);
            expect(result).toBe('logged out');
        });
    });

    describe('getCurrentUser', () => {
        it('should call authService.handleGetCurrentUser with correct params', async () => {
            mockAuthService.handleGetCurrentUser.mockResolvedValue({ id: 1, email: 'test@test.com' });

            const result = await controller.getCurrentUser(mockRequest, mockReply);

            expect(mockAuthService.handleGetCurrentUser).toHaveBeenCalledWith(mockRequest, mockReply);
            expect(result).toEqual({ id: 1, email: 'test@test.com' });
        });
    });
});
