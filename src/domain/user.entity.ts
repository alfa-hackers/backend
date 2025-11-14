import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm'
import { Room } from 'domain/room.entity'
import { UserRoom } from 'domain/user-room.entity'
import { Message } from 'domain/message.entity'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true, type: 'varchar' })
  username: string

  @Column({ type: 'varchar', nullable: true })
  email?: string

  @Column({ type: 'varchar', default: 'user' })
  role: string

  @Column({ type: 'varchar', nullable: true })
  avatar_url?: string

  @Column({ type: 'boolean', default: false })
  temp: boolean

  @Column({ type: 'varchar', unique: true, nullable: true })
  userTempId?: string

  @OneToMany(() => Room, (room) => room.owner, { cascade: true })
  ownedRooms: Room[]

  @OneToMany(() => UserRoom, (userRoom) => userRoom.user, { cascade: true })
  userRooms: UserRoom[]

  @OneToMany(() => Message, (message) => message.user)
  messages: Message[]

  @CreateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  updatedAt: Date
}
