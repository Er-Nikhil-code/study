import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./user.entity";

@Entity("otp_records")
@Index(["email"])
@Index(["expires_at"])
export class OtpRecord {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  email!: string;

  @Column()
  otp_code!: string;

  @Column({ default: 0 })
  attempts!: number;

  @CreateDateColumn()
  created_at!: Date;

  @Column()
  expires_at!: Date;

  @Column({ nullable: true })
  verified_at?: Date;

  @Column({ nullable: true })
  user_id?: string;

  @ManyToOne(() => User, (user) => user.otp_records, { onDelete: "SET NULL" })
  @JoinColumn({ name: "user_id" })
  user?: User;
}
