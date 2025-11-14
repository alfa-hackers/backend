import IORedis from 'ioredis'
import { Logger } from '@nestjs/common'
import * as RedisConstants from 'session/constants'

const logger = new Logger('Redis')

export const redis = new IORedis(RedisConstants.REDIS_URI, {
  lazyConnect: true,
  connectTimeout: RedisConstants.REDIS_CONNECT_TIMEOUT,
  maxRetriesPerRequest: RedisConstants.REDIS_MAX_RETRIES,
})

redis.on('error', (err) => {
  logger.error('Redis connection error:', err)
})

redis.on('connect', () => {
  logger.log('Redis connected successfully!')
})

redis.on('pong', (message) => {
  logger.log('Redis pong response:', message)
})

redis.on('monitor', (time, args) => {
  logger.log('Redis command:', time, args)
})

export const customRedisStore = {
  async get(sid: string, callback: (err?: any, session?: any) => void) {
    try {
      const data = await redis.get(`${RedisConstants.SESSION_PREFIX}${sid}`)
      if (!data) return callback()

      const session = JSON.parse(data)
      callback(null, session)
    } catch (error) {
      logger.error('Error getting session from Redis:', error)
      callback(error)
    }
  },

  async set(sid: string, session: any, callback: (err?: any) => void) {
    try {
      const ttl = session.cookie?.maxAge
        ? Math.floor(session.cookie.maxAge / 1000)
        : RedisConstants.DEFAULT_SESSION_TTL_SECONDS

      await redis.set(`${RedisConstants.SESSION_PREFIX}${sid}`, JSON.stringify(session), 'EX', ttl)
      callback()
    } catch (error) {
      logger.error('Error setting session in Redis:', error)
      callback(error)
    }
  },

  async destroy(sid: string, callback: (err?: any) => void) {
    try {
      await redis.del(`${RedisConstants.SESSION_PREFIX}${sid}`)
      callback()
    } catch (error) {
      logger.error('Error destroying session in Redis:', error)
      callback(error)
    }
  },
}
