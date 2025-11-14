import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SocketGateway } from './socket.gateway'
import { ClientManagerService } from './client-manager.service'
import { AIService } from './ai.service'
import { RoomService } from './services/room/room.service'
import { MessageService } from './services/message.service'
import { User } from 'domain/user.entity'
import { Message } from 'domain/message.entity'
import { Room } from 'domain/room.entity'
import { UserRoom } from 'domain/user-room.entity'
import { MessagesService } from 'controllers/messages/services/messages.service'
import { MinioService } from 'adapters/minio/minio.service'
import { LoadContextService } from './services/load-context.service'
import { SaveMinioService } from './services/save-minio.service'
import { ExcelResponseService } from './services/responses/excel-response.service'
import { PdfResponseService } from './services/responses/pdf-response.service'
import { WordResponseService } from './services/responses/word-response.service'
import { WordProcessService } from './services/payloads/word-process.service'
import { PdfProcessService } from './services/payloads/pdf-process.service'
import { ExcelProcessService } from './services/payloads/excel-process.service'
import { RoomConnectionService } from './services/room/room-connection.service'
import { AuthModule } from 'controllers/auth/auth.module'
import { PowerpointResponseService } from './services/responses/powerpoint-reponse.service'
import { ChecklistResponseService } from './services/responses/checklist-response.service'
import { PowerPointProcessService } from './services/payloads/powerpoint-process.service'
import { ResponseGeneratorService } from './services/messages/response-generator.service'
import { AttachmentProcessorService } from './services/messages/attachment-processor.service'

@Module({
  imports: [TypeOrmModule.forFeature([User, Message, Room, UserRoom]), AuthModule],
  providers: [
    SocketGateway,
    ClientManagerService,
    AIService,
    RoomService,
    MessageService,
    MessagesService,
    MinioService,
    LoadContextService,
    SaveMinioService,
    ExcelResponseService,
    PdfResponseService,
    WordResponseService,
    WordProcessService,
    PdfProcessService,
    ExcelProcessService,
    RoomConnectionService,
    PowerpointResponseService,
    ChecklistResponseService,
    PowerPointProcessService,
    ResponseGeneratorService,
    AttachmentProcessorService,
  ],
  exports: [ClientManagerService],
})
export class SocketModule {}
