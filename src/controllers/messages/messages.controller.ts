import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common'
import { MessagesService } from 'controllers/messages/services/messages.service'
import { GetUserMessagesDto, GetRoomMessagesDto } from 'controllers/messages/dto/messages.dto'
import { ApiBody } from '@nestjs/swagger'
import { FastifyRequest } from 'fastify'

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('/by-user')
  @ApiBody({
    description: 'Запрос сообщений пользователя',
    type: GetUserMessagesDto,
    examples: {
      example1: {
        summary: 'Пример запроса сообщений',
        value: {
          roomId: 'room123',
          limit: 10,
        },
      },
    },
  })
  async getUserMessages(@Body() body: GetUserMessagesDto, @Req() request: FastifyRequest) {
    return this.messagesService.getMessagesByUserId(body, request)
  }

  @Post('/by-room')
  @ApiBody({
    description: 'Получение всех сообщений конкретной комнаты',
    type: GetRoomMessagesDto,
    examples: {
      example1: {
        summary: 'Запрос сообщений комнаты',
        value: {
          roomId: 'room123',
          limit: 20,
          offset: 0,
        },
      },
    },
  })
  async getRoomMessages(@Body() body: GetRoomMessagesDto, @Req() request: FastifyRequest) {
    return this.messagesService.getMessagesByRoomId(body, request)
  }

  @Get('/:id')
  async getMessageById(@Param('id') id: string) {
    return this.messagesService.getMessageById(id)
  }
}
