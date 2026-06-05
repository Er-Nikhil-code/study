# Study Platform - Backend API

NestJS backend for the AI-ready competitive exam platform with OTP-based authentication and Brevo email integration.

## Features

- **OTP-based Registration**: Secure email verification via Brevo
- **Password Reset**: Token-based password reset flow
- **JWT Authentication**: Access and refresh token management
- **Role-based Access Control**: STUDENT, PENDING_TEACHER, TEACHER, ADMIN
- **Scheduled Cleanup Jobs**: Automatic OTP and token expiration
- **Comprehensive Logging**: Winston + audit trails
- **Database**: Prisma ORM with PostgreSQL

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Email**: Brevo
- **Authentication**: JWT + Passport.js
- **Validation**: Zod
- **Scheduling**: @nestjs/schedule

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL
- Brevo API key

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Create .env.local from example
cp .env.example .env.local
```

### Configuration

Edit `.env.local` with your credentials:

```
DATABASE_URL=postgresql://user:password@localhost:5432/study_platform
BREVO_API_KEY=your-brevo-api-key
JWT_SECRET=your-super-secret-key-min-32-chars
APP_URL=http://localhost:3000
API_PORT=3001
```

### Running the Application

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start
```

### Database Management

```bash
# Run migrations
npm run prisma:migrate

# Deploy migrations (production)
npm run prisma:migrate:deploy

# Open Prisma Studio
npm run prisma:studio
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Step 1: Register and send OTP
- `POST /api/auth/register/verify-otp` - Step 2: Verify OTP and create account
- `POST /api/auth/forgot-password` - Step 1: Request password reset
- `POST /api/auth/reset-password` - Step 2: Reset password with token

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `BREVO_API_KEY` | Brevo email service API key | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRY_HOURS` | Access token expiry | 1 |
| `JWT_REFRESH_EXPIRY_DAYS` | Refresh token expiry | 7 |
| `OTP_VALIDITY_MINUTES` | OTP validity period | 10 |
| `OTP_MAX_ATTEMPTS` | Max OTP verification attempts | 3 |
| `PASSWORD_RESET_TOKEN_EXPIRY_MINUTES` | Reset token validity | 60 |
| `APP_URL` | Frontend application URL | http://localhost:3000 |
| `API_PORT` | API server port | 3001 |

## Brevo Setup

### Create Email Templates

1. Log in to [Brevo](https://www.brevo.com/)
2. Navigate to Templates > Transactional
3. Create OTP Email Template (Template ID: 1)
   - Subject: `Your OTP is {{params.otp}}`
   - Body: Include `{{params.firstName}}` and `{{params.otp}}`
4. Create Password Reset Template (Template ID: 2)
   - Subject: `Reset Your Password`
   - Body: Include `{{params.resetUrl}}`

### Update Configuration

Update template IDs in `.env.local`:
```
BREVO_OTP_TEMPLATE_ID=1
BREVO_PASSWORD_RESET_TEMPLATE_ID=2
```

## Database Schema

The Prisma schema includes:

- **User Management**: Users, RefreshTokens, AuditLogs
- **Authentication**: OtpRecords, PasswordResetTokens
- **Applications**: TeacherApplication
- **Content**: Subjects, Chapters, Topics, Questions, Assets
- **Assessments**: Tests, TestQuestions, Attempts, Responses
- **Engagement**: UserStats, DailyActivity, NotificationEvents
- **Challenges**: Challenge system for answer key disputes

## Architecture

### Service Layer
- `AuthService`: Authentication logic (register, login, password reset)
- `OtpService`: OTP generation, validation, cleanup
- `PasswordResetService`: Token generation and verification
- `BrevoService`: Email delivery via Brevo API

### Scheduled Jobs
- `CleanupService`: Hourly OTP cleanup, daily token cleanup

### Modules
- `AuthModule`: Authentication endpoints and logic
- `EmailModule`: Email service integration

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **Token Security**: Cryptographically secure OTP and reset tokens
- **Audit Logging**: All state-changing operations logged
- **Email Masking**: Emails partially masked in responses
- **Token Expiry**: All tokens have configurable expiry
- **Rate Limiting**: Ready for integration with @nestjs/throttler

## Testing

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:cov
```

## Deployment

### Vercel (Frontend)
```bash
# Frontend deploys automatically on push to main
```

### Railway (Backend)
```bash
# Create Docker image and deploy
docker build -t study-backend .
```

## License

MIT

## Support

For issues and questions, please create an issue on GitHub.
