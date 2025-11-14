import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm'
import { User } from 'domain/user.entity'
import { UserRoom } from 'domain/user-room.entity'
import { Message } from 'domain/message.entity'

@Entity('rooms')
export class Room {
  @PrimaryColumn({ type: 'varchar' })
  id: string

  @Column({ type: 'varchar' })
  name: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'boolean', default: false })
  isPrivate: boolean

  @ManyToOne(() => User, (user) => user.ownedRooms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User

  @Column({ name: 'owner_id' })
  ownerId: string

  @OneToMany(() => UserRoom, (userRoom) => userRoom.room, { cascade: true })
  userRooms: UserRoom[]

  @OneToMany(() => Message, (message) => message.room, { cascade: true })
  messages: Message[]

  @CreateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  updatedAt: Date
}
