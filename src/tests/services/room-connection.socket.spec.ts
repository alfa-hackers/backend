import { Test, TestingModule } from '@nestjs/testing'
import { RoomConnectionService } from 'socket/services/room/room-connection.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { User } from 'domain/user.entity'
import { Repository } from 'typeorm'

describe('RoomConnectionService', () => {
    let service: RoomConnectionService
    let userRepo: Repository<User>

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoomConnectionService,
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        findOne: jest.fn(),
                        create: jest.fn((data) => data),
                        save: jest.fn((user) => Promise.resolve(user)),
                    },
                },
            ],
        }).compile()

        service = module.get<RoomConnectionService>(RoomConnectionService)
        userRepo = module.get<Repository<User>>(getRepositoryToken(User))
    })

    it('should throw error if userTempId is missing', async () => {
        const socket = { id: 'socket1' } as any
        await expect(service.handleConnection(socket, null)).rejects.toThrow('userTempId is required')
    })

    it('should return existing user if found', async () => {
        const socket = { id: 'socket1' } as any
        const existingUser = { id: 'temp123', username: 'temp_user', userTempId: 'temp123', role: 'temp', temp: true }

        jest.spyOn(userRepo, 'findOne').mockResolvedValue(existingUser as any)

        const result = await service.handleConnection(socket, 'temp123')

        expect(result.user).toEqual(existingUser)
        expect(result.userTempId).toBe('temp123')
    })

    it('should create and save new temp user if not found', async () => {
        const socket = { id: 'socket1' } as any
        jest.spyOn(userRepo, 'findOne').mockResolvedValue(null)
        const createSpy = jest.spyOn(userRepo, 'create')
        const saveSpy = jest.spyOn(userRepo, 'save')

        const userTempId = 'temp456'
        const result = await service.handleConnection(socket, userTempId)

        expect(createSpy).toHaveBeenCalledWith({
            id: userTempId,
            username: `temp_${userTempId.slice(0, 8)}`,
            userTempId,
            role: 'temp',
            temp: true,
        })
        expect(saveSpy).toHaveBeenCalled()
        expect(result.user.id).toBe(userTempId)
        expect(result.userTempId).toBe(userTempId)
    })
})
