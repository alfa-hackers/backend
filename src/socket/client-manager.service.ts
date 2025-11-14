import { Injectable } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class ClientManagerService {
  private clients = new Map<string, Set<string>>()
  private socketUserMap = new Map<string, string>()

  async createUser(socketId: string): Promise<string> {
    if (!this.socketUserMap.has(socketId)) {
      const userId = `user_temp-${uuidv4()}`
      this.socketUserMap.set(socketId, userId)
      return userId
    }
    return this.socketUserMap.get(socketId)
  }

  async getUserBySocketId(socketId: string): Promise<string | undefined> {
    return this.socketUserMap.get(socketId)
  }

  async addUserToRoom(userId: string, roomId: string): Promise<void> {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set())
    }
    this.clients.get(userId).add(roomId)
  }

  async removeUserFromRoom(userId: string, roomId: string): Promise<void> {
    if (this.clients.has(userId)) {
      this.clients.get(userId).delete(roomId)
    }
  }

  async getUserRooms(userId: string): Promise<Set<string> | undefined> {
    return this.clients.get(userId)
  }

  async removeUser(userId: string): Promise<Set<string> | undefined> {
    const rooms = this.clients.get(userId)
    if (rooms) {
      this.clients.delete(userId)
    }
    return rooms
  }

  async removeSocketMapping(socketId: string): Promise<string | undefined> {
    const userId = this.socketUserMap.get(socketId)
    if (userId) {
      this.socketUserMap.delete(socketId)
    }
    return userId
  }
}
