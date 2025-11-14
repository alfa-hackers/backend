export interface SendMessagePayload {
  roomId: string
  message: string
  messageId?: string
  chatId?: string
  attachments?: FileAttachment[]
  messageFlag?:
    | 'text'
    | 'pdf'
    | 'word'
    | 'excel'
    | 'powerpoint'
    | 'checklist'
    | 'business'
    | 'analytics'
  temperature?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stopSequences?: string[]
  maxTokens: number
}

export interface JoinRoomPayload {
  roomId: string
  roomName?: string
}

export interface ConnectionInfo {
  socketId: string
  userId: string
}

export interface MessageEvent {
  userId: string
  message: string
  chatId?: string
  attachments?: FileAttachment[]
  fileUrl?: string
  responseType?: string
}

export interface JoinRoomResponse {
  success: boolean
  roomId?: string
  userId?: string
  message?: string
  error?: string
}

export interface SendMessageResponse {
  success: boolean
  aiResponse?: string
  model?: string
  usage?: any
  error?: string
  details?: any
  responseType?: string
  fileUrl?: string
}

export interface FileAttachment {
  filename: string
  mimeType:
    | 'application/pdf'
    | 'application/msword'
    | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    | 'application/vnd.ms-excel'
    | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    | 'application/vnd.oasis.opendocument.spreadsheet'
    | 'application/vnd.ms-powerpoint'
    | 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    | 'text/plain'
    | 'text/markdown'
  data: string
  size: number
}
