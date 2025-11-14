import '@fastify/session'

declare module 'fastify' {
  interface Session {
    user?: any
    user_card_id?: any
    user_temp_id: any
  }
}
