# Study Platform - AI-Ready Competitive Exam Platform

A comprehensive full-stack platform for conducting competitive exams (JEE, NEET, etc.) with OTP-based authentication, real-time test engine, gamification, and AI-powered analytics.

## Project Structure

```
study/
├── backend/                  # NestJS API server
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/        # Authentication (OTP, password reset)
│   │   │   ├── email/       # Brevo email service
│   │   ├── jobs/            # Scheduled cleanup jobs
│   │   └── main.ts          # Application entry point
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── .env.example         # Environment template
│   └── package.json
├── frontend/                 # Next.js web application
│   └── [Coming soon]
└── README.md
```

## Technology Stack

### Backend
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: JWT + Passport.js
- **Email**: Brevo API
- **Validation**: Zod
- **Scheduling**: @nestjs/schedule
- **Logging**: Winston
- **Error Tracking**: Sentry

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand + TanStack Query
- **Offline Support**: Workbox, Dexie.js (IndexedDB)

### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Railway
- **Database**: Neon (PostgreSQL Serverless)
- **Cache**: Upstash Redis
- **Storage**: Cloudflare R2
- **Email**: Brevo
- **Monitoring**: Sentry + Checkly

## Features Implemented

### Phase 1: Foundation ✅
- ✅ OTP-based email registration via Brevo
- ✅ Token-based password reset
- ✅ 4-role model (STUDENT → PENDING_TEACHER → TEACHER → ADMIN)
- ✅ JWT + Refresh token rotation
- ✅ Comprehensive Prisma schema
- ✅ Audit logging

## Quick Start

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Brevo API key, database URL, etc.

# Setup database
npm run prisma:generate
npm run prisma:migrate

# Start development server
npm run dev
```

The API will be available at `http://localhost:3001/api`

**API Endpoints:**
- `POST /api/auth/register` - Register and send OTP
- `POST /api/auth/register/verify-otp` - Verify OTP and create account
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Environment Configuration

Create `.env.local` in the `backend` folder:

```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/study_platform

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-here
JWT_EXPIRY_HOURS=1
JWT_REFRESH_EXPIRY_DAYS=7

# Brevo Email Service
BREVO_API_KEY=your-brevo-api-key-here
BREVO_SENDER_EMAIL=noreply@study.app
BREVO_SENDER_NAME=Study Platform
BREVO_OTP_TEMPLATE_ID=1
BREVO_PASSWORD_RESET_TEMPLATE_ID=2

# Password Reset Token
PASSWORD_RESET_TOKEN_SECRET=your-password-reset-token-secret-min-32-chars-long
PASSWORD_RESET_TOKEN_EXPIRY_MINUTES=60

# OTP Configuration
OTP_VALIDITY_MINUTES=10
OTP_MAX_ATTEMPTS=3

# Application
NODE_ENV=development
APP_URL=http://localhost:3000
API_PORT=3001
```

## Brevo Email Setup

### 1. Get API Key

1. Sign up at [Brevo](https://www.brevo.com/)
2. Go to Settings → SMTP & API
3. Create API key and copy it to `BREVO_API_KEY`

### 2. Verify Sender Email

1. Settings → Sender identities
2. Verify the email that will be sending (e.g., noreply@study.app)

### 3. Create Email Templates

1. Templates → Transactional
2. **OTP Email** (ID: 1)
   ```
   Subject: Your verification code
   Body: Hello {{params.firstName}}, your OTP is {{params.otp}}
   ```
3. **Password Reset** (ID: 2)
   ```
   Subject: Reset your password
   Body: Click here: {{params.resetUrl}}
   ```

## Database Setup

### Local PostgreSQL

```bash
# Install PostgreSQL
# macOS: brew install postgresql
# Ubuntu: sudo apt install postgresql

# Create database
createdb study_platform

# Set DATABASE_URL
export DATABASE_URL="postgresql://localhost:5432/study_platform"

# Run migrations
npm run prisma:migrate
```

### Neon (Serverless PostgreSQL)

1. Create account at [Neon](https://neon.tech/)
2. Create a new project and database
3. Copy the connection string to `DATABASE_URL`
4. Run migrations: `npm run prisma:migrate:deploy`

## API Testing

### Register with OTP

```bash
# Step 1: Send OTP
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John"
  }'

# Step 2: Verify OTP (check Brevo dashboard or email)
curl -X POST http://localhost:3001/api/auth/register/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456",
    "password": "SecurePass123!",
    "firstName": "John",
    "role": "STUDENT"
  }'
```

### Password Reset

```bash
# Step 1: Request reset
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Step 2: Reset password (token from email)
curl -X POST http://localhost:3001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "token-from-email",
    "newPassword": "NewPass123!",
    "confirmPassword": "NewPass123!"
  }'
```

## Project Roadmap

- **Phase 1** ✅ Foundation (Auth, Prisma, Brevo integration)
- **Phase 2** Content Engine (Question bank, Tiptap editor)
- **Phase 3** Test Engine (Offline support, auto-save, timer)
- **Phase 4** Scoring & Results (Score calculation, leaderboards)
- **Phase 5** Gamification (Streaks, badges, notifications)
- **Phase 6** Challenge System (Answer key disputes)
- **Phase 7** Analytics & AI (Dashboards, study plans)
- **Phase 8** Scale & Hardening (Load testing, security audit)

## Documentation

- [Backend README](./backend/README.md) - API documentation, setup guide
- [Brevo Documentation](https://developers.brevo.com/docs) - Email API reference
- [Prisma Documentation](https://www.prisma.io/docs/) - Database ORM guide
- [NestJS Documentation](https://docs.nestjs.com/) - Framework guide

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to GitHub
4. Create a Pull Request

## License

MIT

## Support

- 📧 Email: support@study.app (coming soon)
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions

## Authors

- Nikhil ([@Er-Nikhil-code](https://github.com/Er-Nikhil-code))

---

**Last Updated**: June 5, 2026
