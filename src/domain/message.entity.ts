import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { User } from 'domain/user.entity'
import { Room } from 'domain/room.entity'

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'text', nullable: true })
  text?: string

  @Column({ type: 'varchar', nullable: true })
  audio_address?: string

  @Column({ type: 'varchar', nullable: true })
  file_address?: string

  @Column({ type: 'varchar', nullable: true })
  file_name?: string

  @Column({ type: 'varchar', default: 'user' })
  messageType: string

  @Column({ type: 'boolean', default: false })
  isAi: boolean

  @Column({ type: 'varchar', nullable: true })
  userTempId?: string

  @ManyToOne(() => User, (user) => user.messages, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User

  @Column({ name: 'user_id', nullable: true })
  userId?: string

  @ManyToOne(() => Room, (room) => room.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room

  @Column({ name: 'room_id' })
  roomId: string

  @CreateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  updatedAt: Date
}
