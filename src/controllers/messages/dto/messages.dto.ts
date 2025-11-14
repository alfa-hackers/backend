import {
  getUserMessagesSchema,
  GetUserMessagesType,
  getRoomMessagesSchema,
  GetRoomMessagesType,
} from 'controllers/messages/dto/messages.schema'

export class GetUserMessagesDto implements GetUserMessagesType {
  static schema = getUserMessagesSchema

  roomId?: string
  limit?: number
  offset?: number

  constructor(data: GetUserMessagesType) {
    Object.assign(this, GetUserMessagesDto.schema.parse(data))
  }
}

export class GetRoomMessagesDto implements GetRoomMessagesType {
  static schema = getRoomMessagesSchema

  roomId: string
  limit?: number
  offset?: number

  constructor(data: GetRoomMessagesType) {
    Object.assign(this, GetRoomMessagesDto.schema.parse(data))
  }
}
