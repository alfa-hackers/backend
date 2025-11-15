import { Test, TestingModule } from '@nestjs/testing'
import { ClientManagerService } from 'socket/client-manager.service'

describe('ClientManagerService', () => {
    let service: ClientManagerService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ClientManagerService],
        }).compile()

        service = module.get<ClientManagerService>(ClientManagerService)
    })

    it('should create a new user if socketId not mapped', async () => {
        const socketId = 'socket1'
        const userId = await service.createUser(socketId)
        expect(userId).toMatch(/^user_temp-/)
        const sameUserId = await service.createUser(socketId)
        expect(sameUserId).toBe(userId)
    })

    it('should get user by socketId', async () => {
        const socketId = 'socket2'
        const userId = await service.createUser(socketId)
        const fetchedUserId = await service.getUserBySocketId(socketId)
        expect(fetchedUserId).toBe(userId)
    })

    it('should add and remove user from rooms', async () => {
        const socketId = 'socket3'
        const userId = await service.createUser(socketId)
        await service.addUserToRoom(userId, 'room1')
        await service.addUserToRoom(userId, 'room2')

        const rooms = await service.getUserRooms(userId)
        expect(rooms).toEqual(new Set(['room1', 'room2']))

        await service.removeUserFromRoom(userId, 'room1')
        const updatedRooms = await service.getUserRooms(userId)
        expect(updatedRooms).toEqual(new Set(['room2']))
    })

    it('should remove user and return their rooms', async () => {
        const socketId = 'socket4'
        const userId = await service.createUser(socketId)
        await service.addUserToRoom(userId, 'room1')
        await service.addUserToRoom(userId, 'room2')

        const removedRooms = await service.removeUser(userId)
        expect(removedRooms).toEqual(new Set(['room1', 'room2']))
        const roomsAfterRemoval = await service.getUserRooms(userId)
        expect(roomsAfterRemoval).toBeUndefined()
    })

    it('should remove socket mapping', async () => {
        const socketId = 'socket5'
        const userId = await service.createUser(socketId)
        const removedUserId = await service.removeSocketMapping(socketId)
        expect(removedUserId).toBe(userId)
        const afterRemoval = await service.getUserBySocketId(socketId)
        expect(afterRemoval).toBeUndefined()
    })
})
