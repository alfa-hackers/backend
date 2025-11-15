import { Test, TestingModule } from '@nestjs/testing'
import { RoomService } from 'socket/services/room/room.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Room } from 'domain/room.entity'
import { UserRoom } from 'domain/user-room.entity'
import { Repository } from 'typeorm'

describe('RoomService', () => {
    let service: RoomService
    let roomRepo: Repository<Room>
    let userRoomRepo: Repository<UserRoom>

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoomService,
                {
                    provide: getRepositoryToken(Room),
                    useValue: {
                        findOne: jest.fn(),
                        create: jest.fn((data) => ({
                            ...data,
                            owner: null,
                            userRooms: [],
                        })),
                        save: jest.fn((room) => Promise.resolve({ ...room, owner: null, userRooms: [] })),
                    },
                },
                {
                    provide: getRepositoryToken(UserRoom),
                    useValue: {
                        findOne: jest.fn(),
                        save: jest.fn((userRoom) => Promise.resolve(userRoom)),
                    },
                },
            ],
        }).compile()

        service = module.get<RoomService>(RoomService)
        roomRepo = module.get<Repository<Room>>(getRepositoryToken(Room))
        userRoomRepo = module.get<Repository<UserRoom>>(getRepositoryToken(UserRoom))
    })

    it('should return error if user not identified on joinRoom', async () => {
        const socket = { id: '1', join: jest.fn(), data: {} } as any
        const clientManager = { getUserBySocketId: jest.fn().mockResolvedValue(null) } as any
        const server = { to: jest.fn().mockReturnValue({ emit: jest.fn() }) } as any

        const result = await service.joinRoom(
            { roomId: 'r1', roomName: 'Room' } as any,
            socket,
            clientManager,
            server,
        )

        expect(result).toEqual({ success: false, error: 'User not identified' })
    })

    it('should join existing room', async () => {
        const socket = { id: '1', join: jest.fn(), data: { dbUserId: 'db1' } } as any
        const clientManager = { getUserBySocketId: jest.fn().mockResolvedValue('user1'), addUserToRoom: jest.fn() } as any
        const server = { to: jest.fn().mockReturnValue({ emit: jest.fn() }) } as any

        const room: Room = {
            id: 'r1',
            name: 'Room',
            ownerId: 'db1',
            isPrivate: false,
            owner: null,
            userRooms: [],
        } as Room

        jest.spyOn(roomRepo, 'findOne').mockResolvedValue(room)
        jest.spyOn(userRoomRepo, 'findOne').mockResolvedValue(null)

        const result = await service.joinRoom(
            { roomId: 'r1', roomName: 'Room' } as any,
            socket,
            clientManager,
            server,
        )

        expect(result).toEqual({ success: true, roomId: 'r1', userId: 'user1', message: 'Joined successfully' })
    })

    it('should create new room if not exists', async () => {
        const socket = { id: '1', join: jest.fn(), data: { dbUserId: 'db1' } } as any
        const clientManager = { getUserBySocketId: jest.fn().mockResolvedValue('user1'), addUserToRoom: jest.fn() } as any
        const server = { to: jest.fn().mockReturnValue({ emit: jest.fn() }) } as any

        jest.spyOn(roomRepo, 'findOne').mockResolvedValue(null)

        const result = await service.joinRoom(
            { roomId: 'r2', roomName: 'NewRoom' } as any,
            socket,
            clientManager,
            server,
        )

        expect(result.success).toBe(true)
        expect(result.roomId).toBe('r2')
        expect(result.userId).toBe('user1')
    })

    it('should leave room', async () => {
        const socket = { id: '1', leave: jest.fn() } as any
        const clientManager = { getUserBySocketId: jest.fn().mockResolvedValue('user1'), removeUserFromRoom: jest.fn() } as any
        const server = { to: jest.fn().mockReturnValue({ emit: jest.fn() }) } as any

        const result = await service.leaveRoom({ roomId: 'r1' } as any, socket, clientManager, server)
        expect(result).toEqual({ success: true, roomId: 'r1' })
    })

    it('should broadcast disconnection to all rooms', async () => {
        const clientManager = { getUserRooms: jest.fn().mockResolvedValue(new Set(['r1', 'r2'])) } as any
        const emitMock = jest.fn()
        const server = { to: jest.fn().mockReturnValue({ emit: emitMock }) } as any

        await service.broadcastDisconnection('user1', clientManager, server)

        expect(server.to).toHaveBeenCalledWith('r1')
        expect(server.to).toHaveBeenCalledWith('r2')
        expect(emitMock).toHaveBeenCalledTimes(2)
    })
})
