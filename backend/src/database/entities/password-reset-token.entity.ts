import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./user.entity";

@Entity("password_reset_tokens")
@Index(["user_id"])
@Index(["expires_at"])
export class PasswordResetToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  user_id!: string;

  @ManyToOne(() => User, (user) => user.password_resets, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ unique: true })
  token_hash!: string;

  @CreateDateColumn()
  created_at!: Date;

  @Column()
  expires_at!: Date;

  @Column({ nullable: true })
  used_at?: Date;

  @Column({ nullable: true })
  ip_address?: string;

  @DeleteDateColumn()
  deleted_at?: Date;
}
