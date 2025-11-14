import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { User } from 'domain/user.entity'
import { Room } from 'domain/room.entity'

@Entity('user_rooms')
export class UserRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => User, (user) => user.userRooms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ name: 'user_id' })
  userId: string

  @ManyToOne(() => Room, (room) => room.userRooms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room

  @Column({ name: 'room_id', type: 'varchar' })
  roomId: string

  @CreateDateColumn({ type: 'timestamp', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  joinedAt: Date
}
