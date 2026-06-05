import { DataSourceOptions } from "typeorm";
import * as dotenv from "dotenv";
import * as path from "path";
import { User } from "./entities/user.entity";
import { RefreshToken } from "./entities/refresh-token.entity";
import { OtpRecord } from "./entities/otp-record.entity";
import { PasswordResetToken } from "./entities/password-reset-token.entity";

// Load .env.local before accessing environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Parse DATABASE_URL environment variable
const getDatabaseConfig = (): DataSourceOptions => {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error(
      "DATABASE_URL environment variable is not set. Check .env.local or .env file.",
    );
  }

  console.log(`📡 Using database URL: ${dbUrl.substring(0, 50)}...`);

  return {
    type: "postgres",
    url: dbUrl,
    entities: [User, RefreshToken, OtpRecord, PasswordResetToken],
    migrations: ["src/database/migrations/*.ts"],
    // AUTO-SYNC IN DEVELOPMENT: Tables created automatically on startup
    // IMPORTANT: Set to false in production and use migrations instead
    synchronize:
      process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test",
    logging: process.env.NODE_ENV !== "production",
    // Enable SSL for all environments (Railway proxy requires it)
    ssl: { rejectUnauthorized: false },
    // Add connection timeout for remote databases
    connectTimeoutMS: 15000,
    extra: {
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    },
  };
};

export const databaseConfig = getDatabaseConfig();
