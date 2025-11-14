import { Test, TestingModule } from '@nestjs/testing';
import { RoomsService } from './rooms.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Room } from 'domain/room.entity';
import { User } from 'domain/user.entity';
import { AuthService } from 'controllers/auth/services';
import { FastifyRequest } from 'fastify';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

describe('RoomsService', () => {
    let service: RoomsService;
    let roomRepository: Partial<Repository<Room>>;
    let userRepository: Partial<Repository<User>>;
    let authService: Partial<AuthService>;

    beforeEach(async () => {
        roomRepository = {
            findOne: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
        };

        userRepository = {
            findOne: jest.fn(),
        };

        authService = {
            getCurrentUser: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoomsService,
                { provide: getRepositoryToken(Room), useValue: roomRepository },
                { provide: getRepositoryToken(User), useValue: userRepository },
            ],
        }).compile();

        service = module.get<RoomsService>(RoomsService);
    });

    describe('extractUserId', () => {
        it('should return user id from AuthService if cookie exists', async () => {
            const mockRequest = {
                headers: { cookie: 'token=abc' },
                session: {},
            } as unknown as FastifyRequest;

            (authService.getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user123' });

            const result = await service.extractUserId(mockRequest, authService as AuthService);

            expect(result).toBe('user123');
            expect(authService.getCurrentUser).toHaveBeenCalledWith(mockRequest);
        });

        it('should return user_temp_id from session if no cookie', async () => {
            const mockRequest = {
                headers: {},
                session: { user_temp_id: 'temp456' },
            } as unknown as FastifyRequest;

            const result = await service.extractUserId(mockRequest, authService as AuthService);

            expect(result).toBe('temp456');
        });

        it('should return null if no user found', async () => {
            const mockRequest = {
                headers: { cookie: 'token=abc' },
                session: {},
            } as unknown as FastifyRequest;

            (authService.getCurrentUser as jest.Mock).mockResolvedValue(null);

            const result = await service.extractUserId(mockRequest, authService as AuthService);

            expect(result).toBeNull();
        });
    });

    describe('getRoomsByUserId', () => {
        it('should throw UnauthorizedException if userId is not provided', async () => {
            await expect(service.getRoomsByUserId('')).rejects.toThrow(UnauthorizedException);
        });

        it('should throw NotFoundException if user does not exist', async () => {
            (userRepository.findOne as jest.Mock).mockResolvedValue(null);

            await expect(service.getRoomsByUserId('user123')).rejects.toThrow(NotFoundException);
        });

        it('should return rooms for valid userId', async () => {
            const mockUser = { id: 'user123', email: 'test@test.com' };
            const mockRooms = [
                { id: 'room1', name: 'Room 1', owner: mockUser },
                { id: 'room2', name: 'Room 2', owner: mockUser },
            ];

            (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

            const queryBuilder = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                leftJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockRooms),
            };

            (roomRepository.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilder);

            const result = await service.getRoomsByUserId('user123');

            expect(result).toEqual({ data: mockRooms, meta: { total: 2 } });
            expect(queryBuilder.where).toHaveBeenCalledWith('userRoom.userId = :userId', { userId: 'user123' });
        });
    });

    describe('deleteRoom', () => {
        it('should throw NotFoundException if room does not exist', async () => {
            (roomRepository.findOne as jest.Mock).mockResolvedValue(null);

            await expect(service.deleteRoom('room123')).rejects.toThrow(NotFoundException);
        });

        it('should delete room successfully', async () => {
            const mockRoom = { id: 'room123', name: 'Test Room', owner: { id: 'user123' } };

            (roomRepository.findOne as jest.Mock).mockResolvedValue(mockRoom);
            (roomRepository.remove as jest.Mock).mockResolvedValue(mockRoom);

            const result = await service.deleteRoom('room123');

            expect(result).toEqual({ success: true, message: 'Room deleted successfully' });
            expect(roomRepository.remove).toHaveBeenCalledWith(mockRoom);
        });
    });
});
