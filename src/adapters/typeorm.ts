import 'reflect-metadata'
import { Message } from 'domain/message.entity'
import { Room } from 'domain/room.entity'
import { UserRoom } from 'domain/user-room.entity'
import { User } from 'domain/user.entity'
import { DataSource } from 'typeorm'

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true,
  migrationsRun: true,
  logging: true,
  entities: [User, Message, Room, UserRoom],
  migrations: ['dist/migrations/*.js'],
  ssl: false,
})

export const initializeDatabase = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
    }
    console.log('✅ Database connected')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  }
}
