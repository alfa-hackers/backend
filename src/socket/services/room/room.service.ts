import { Injectable } from '@nestjs/common'
import { Socket, Server } from 'socket.io'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Room } from 'domain/room.entity'
import { UserRoom } from 'domain/user-room.entity'
import { ClientManagerService } from 'socket/client-manager.service'
import { JoinRoomPayload } from 'socket/socket.interface'

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(UserRoom)
    private readonly userRoomRepository: Repository<UserRoom>,
  ) {}

  async joinRoom(
    payload: JoinRoomPayload,
    socket: Socket,
    clientManager: ClientManagerService,
    server: Server,
  ) {
    const { roomId, roomName } = payload
    const userId = await clientManager.getUserBySocketId(socket.id)
    const dbUserId = socket.data.dbUserId

    if (!userId) return { success: false, error: 'User not identified' }

    let room = await this.roomRepository.findOne({ where: { id: roomId } })

    if (!room) {
      room = this.roomRepository.create({
        id: roomId,
        name: roomName || roomId.toString(),
        ownerId: dbUserId,
        isPrivate: false,
      })
      await this.roomRepository.save(room)
    }

    socket.join(roomId)
    await clientManager.addUserToRoom(userId, roomId)

    const existingUserRoom = await this.userRoomRepository.findOne({
      where: { userId: dbUserId, roomId },
    })

    if (!existingUserRoom) {
      await this.userRoomRepository.save({
        userId: dbUserId,
        roomId,
      })
    }

    server.to(roomId).emit('message', {
      userId: 'system',
      message: `${userId} joined room ${roomId}`,
    })

    return { success: true, roomId, userId, message: 'Joined successfully' }
  }

  async leaveRoom(
    payload: JoinRoomPayload,
    socket: Socket,
    clientManager: ClientManagerService,
    server: Server,
  ) {
    const { roomId } = payload
    const userId = await clientManager.getUserBySocketId(socket.id)

    if (!userId) return { success: false, error: 'User not identified' }

    socket.leave(roomId)
    await clientManager.removeUserFromRoom(userId, roomId)

    server.to(roomId).emit('message', {
      userId: 'system',
      message: `${userId} left room ${roomId}`,
    })

    return { success: true, roomId }
  }

  async broadcastDisconnection(
    userId: string,
    clientManager: ClientManagerService,
    server: Server,
  ) {
    const rooms = await clientManager.getUserRooms(userId)
    if (!rooms) return

    rooms.forEach((roomId) => {
      server.to(roomId).emit('message', {
        userId: 'system',
        message: `${userId} has disconnected`,
      })
    })
  }
}
