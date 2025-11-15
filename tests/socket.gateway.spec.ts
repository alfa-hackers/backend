import { Test, TestingModule } from '@nestjs/testing';
import { SocketGateway } from 'socket/socket.gateway';
import { ClientManagerService } from 'socket/client-manager.service';
import { AIService } from 'socket/ai.service';
import { RoomService } from 'socket/services/room/room.service';
import { MessageService } from 'socket/services/message.service';
import { RoomConnectionService } from 'socket/services/room/room-connection.service';
import { Repository } from 'typeorm';
import { User } from 'domain/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Socket } from 'socket.io';

describe('SocketGateway', () => {
    let gateway: SocketGateway;
    let clientManager: ClientManagerService;
    let roomService: RoomService;
    let messageService: MessageService;
    let roomConnectionService: RoomConnectionService;

    const mockSocket = {
        id: 'socket-id',
        handshake: { auth: { user_temp_id: 'temp-id' } },
        data: {},
        emit: jest.fn(),
        disconnect: jest.fn(),
    } as unknown as Socket;

    const mockUser = { id: 'user-id' };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SocketGateway,
                {
                    provide: ClientManagerService, useValue: {
                        createUser: jest.fn().mockResolvedValue('user-id'),
                        getUserBySocketId: jest.fn().mockResolvedValue('user-id'),
                        removeUser: jest.fn(),
                        removeSocketMapping: jest.fn(),
                    }
                },
                { provide: AIService, useValue: {} },
                {
                    provide: RoomService, useValue: {
                        joinRoom: jest.fn(),
                        leaveRoom: jest.fn(),
                        broadcastDisconnection: jest.fn(),
                    }
                },
                { provide: MessageService, useValue: { handleMessage: jest.fn() } },
                {
                    provide: RoomConnectionService, useValue: {
                        handleConnection: jest.fn().mockResolvedValue({ user: mockUser })
                    }
                },
                { provide: getRepositoryToken(User), useValue: {} },
            ],
        }).compile();

        gateway = module.get<SocketGateway>(SocketGateway);
        clientManager = module.get<ClientManagerService>(ClientManagerService);
        roomService = module.get<RoomService>(RoomService);
        messageService = module.get<MessageService>(MessageService);
        roomConnectionService = module.get<RoomConnectionService>(RoomConnectionService);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('handleConnection', () => {
        it('should connect and emit connected event', async () => {
            await gateway.handleConnection(mockSocket);
            expect(mockSocket.data.userTempId).toBe('temp-id');
            expect(mockSocket.data.dbUserId).toBe(mockUser.id);
            expect(mockSocket.emit).toHaveBeenCalledWith('connected', expect.any(Object));
        });

        it('should disconnect if userTempId missing', async () => {
            const badSocket = { ...mockSocket, handshake: { auth: {} }, emit: jest.fn(), disconnect: jest.fn() } as unknown as Socket;
            await gateway.handleConnection(badSocket);
            expect(badSocket.emit).toHaveBeenCalledWith('error', { message: 'userTempId is required' });
            expect(badSocket.disconnect).toHaveBeenCalled();
        });
    });

    describe('handleDisconnect', () => {
        it('should handle disconnect properly', async () => {
            await gateway.handleDisconnect(mockSocket);
            expect(clientManager.removeUser).toHaveBeenCalledWith('user-id');
            expect(clientManager.removeSocketMapping).toHaveBeenCalledWith(mockSocket.id);
            expect(roomService.broadcastDisconnection).toHaveBeenCalledWith('user-id', clientManager, gateway.server);
        });
    });

    describe('handleJoinRoom', () => {
        it('should call roomService.joinRoom', async () => {
            const payload = {
                roomId: 'room1',
                message: 'hi',
                maxTokens: 100
            };
            await gateway.handleJoinRoom(payload, mockSocket);
            expect(roomService.joinRoom).toHaveBeenCalledWith(payload, mockSocket, clientManager, gateway.server);
        });
    });

    describe('handleLeaveRoom', () => {
        it('should call roomService.leaveRoom', async () => {
            const payload = {
                roomId: 'room1',
                message: 'hi',
                maxTokens: 100
            };
            await gateway.handleLeaveRoom(payload, mockSocket);
            expect(roomService.leaveRoom).toHaveBeenCalledWith(payload, mockSocket, clientManager, gateway.server);
        });
    });

    describe('handleMessage', () => {
        it('should call messageService.handleMessage', async () => {
            const payload = {
                roomId: 'room1',
                message: 'hi',
                maxTokens: 100
            };
            await gateway.handleMessage(payload, mockSocket);
            expect(messageService.handleMessage).toHaveBeenCalledWith(payload, mockSocket, clientManager, gateway.server, gateway['aiService']);
        });
    });
});
