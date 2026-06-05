import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from "typeorm";
import { RefreshToken } from "./refresh-token.entity";
import { PasswordResetToken } from "./password-reset-token.entity";
import { OtpRecord } from "./otp-record.entity";

export enum UserRole {
  STUDENT = "STUDENT",
  PENDING_TEACHER = "PENDING_TEACHER",
  TEACHER = "TEACHER",
  ADMIN = "ADMIN",
}

@Entity("users")
@Index(["email"], { unique: true })
@Index(["role"])
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password_hash!: string;

  @Column({ nullable: true })
  first_name?: string;

  @Column({ nullable: true })
  last_name?: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role!: UserRole;

  @Column({ nullable: true })
  email_verified_at?: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @Column({ nullable: true })
  last_login_at?: Date;

  @OneToMany(() => RefreshToken, (token) => token.user, { cascade: true })
  refresh_tokens!: RefreshToken[];

  @OneToMany(() => PasswordResetToken, (token) => token.user, { cascade: true })
  password_resets!: PasswordResetToken[];

  @OneToMany(() => OtpRecord, (otp) => otp.user, { cascade: true })
  otp_records!: OtpRecord[];
}
