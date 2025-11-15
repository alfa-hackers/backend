import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from 'controllers/rooms/rooms.controller';
import { RoomsService } from 'controllers/rooms/services/rooms.service';
import { AuthService } from 'controllers/auth/services';
import { FastifyRequest } from 'fastify';

describe('RoomsController', () => {
    let controller: RoomsController;
    let roomsService: Partial<RoomsService>;
    let authService: Partial<AuthService>;

    beforeEach(async () => {
        roomsService = {
            extractUserId: jest.fn(),
            getRoomsByUserId: jest.fn(),
            deleteRoom: jest.fn(),
        };

        authService = {};

        const module: TestingModule = await Test.createTestingModule({
            controllers: [RoomsController],
            providers: [
                { provide: RoomsService, useValue: roomsService },
                { provide: AuthService, useValue: authService },
            ],
        }).compile();

        controller = module.get<RoomsController>(RoomsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getUserRooms', () => {
        it('should return empty array if no userId', async () => {
            (roomsService.extractUserId as jest.Mock).mockResolvedValue(null);

            const result = await controller.getUserRooms({} as FastifyRequest);

            expect(result).toEqual([]);
            expect(roomsService.extractUserId).toHaveBeenCalled();
        });

        it('should return rooms for user', async () => {
            const mockUserId = '123';
            const mockRooms = [{ id: 'room1' }, { id: 'room2' }];

            (roomsService.extractUserId as jest.Mock).mockResolvedValue(mockUserId);
            (roomsService.getRoomsByUserId as jest.Mock).mockReturnValue(mockRooms);

            const result = await controller.getUserRooms({} as FastifyRequest);

            expect(result).toEqual(mockRooms);
            expect(roomsService.extractUserId).toHaveBeenCalled();
            expect(roomsService.getRoomsByUserId).toHaveBeenCalledWith(mockUserId);
        });

        it('should handle error and return empty array', async () => {
            (roomsService.extractUserId as jest.Mock).mockRejectedValue(new Error('fail'));

            const result = await controller.getUserRooms({} as FastifyRequest);

            expect(result).toEqual([]);
        });
    });

    describe('deleteRoom', () => {
        it('should call roomsService.deleteRoom with id', async () => {
            const mockId = 'room1';
            (roomsService.deleteRoom as jest.Mock).mockReturnValue({ success: true });

            const result = await controller.deleteRoom(mockId);

            expect(result).toEqual({ success: true });
            expect(roomsService.deleteRoom).toHaveBeenCalledWith(mockId);
        });
    });
});
