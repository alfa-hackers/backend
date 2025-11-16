import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ClientManagerService } from 'socket/client-manager.service'
import { AIService } from 'socket/ai.service'
import { User } from 'domain/user.entity'
import { JoinRoomPayload, SendMessagePayload } from 'socket/socket.interface'
import { RoomService } from 'socket/services/room/room.service'
import { MessageService } from 'socket/services/message.service'
import { RoomConnectionService } from './services/room/room-connection.service'
import { Logger } from '@nestjs/common'

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 50 * 1024 * 1024,
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(SocketGateway.name)

  constructor(
    private readonly clientManager: ClientManagerService,
    private readonly aiService: AIService,
    private readonly roomService: RoomService,
    private readonly messageService: MessageService,
    private readonly roomConnectionService: RoomConnectionService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async handleConnection(socket: Socket) {
    try {
      const userTempId = socket.handshake.auth?.user_temp_id as string

      if (!userTempId) {
        socket.emit('error', { message: 'userTempId is required' })
        socket.disconnect()
        return
      }

      const { user } = await this.roomConnectionService.handleConnection(socket, userTempId)
      const userId = await this.clientManager.createUser(socket.id)

      socket.data.userTempId = userTempId
      socket.data.dbUserId = user.id

      socket.emit('connected', { socketId: socket.id, userId, userTempId })
    } catch (error) {
      socket.emit('error', { message: error.message })
      socket.disconnect()
    }
  }

  async handleDisconnect(socket: Socket) {
    try {
      const userId = await this.clientManager.getUserBySocketId(socket.id)
      if (userId) {
        await this.roomService.broadcastDisconnection(userId, this.clientManager, this.server)
        await this.clientManager.removeUser(userId)
        await this.clientManager.removeSocketMapping(socket.id)
      }
    } catch {}
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@MessageBody() payload: JoinRoomPayload, @ConnectedSocket() socket: Socket) {
    return this.roomService.joinRoom(payload, socket, this.clientManager, this.server)
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() payload: JoinRoomPayload,
    @ConnectedSocket() socket: Socket,
  ) {
    return this.roomService.leaveRoom(payload, socket, this.clientManager, this.server)
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() payload: SendMessagePayload,
    @ConnectedSocket() socket: Socket,
  ) {
    return this.messageService.handleMessage(
      payload,
      socket,
      this.clientManager,
      this.server,
      this.aiService,
    )
  }
}
