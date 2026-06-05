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

@Entity("refresh_tokens")
@Index(["user_id"])
@Index(["expires_at"])
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  user_id!: string;

  @ManyToOne(() => User, (user) => user.refresh_tokens, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ unique: true })
  token_hash!: string;

  @Column()
  expires_at!: Date;

  @CreateDateColumn()
  created_at!: Date;

  @Column({ nullable: true })
  revoked_at?: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}
