# Study Platform - Complete Documentation

## 📋 Project Overview

Study Platform is a comprehensive educational application designed to facilitate learning and teaching. It features:

- **OTP-Based Registration**: Secure 2-step registration with email verification using Brevo
- **Password Management**: Secure password reset with token-based verification
- **User Roles**: Support for Students and Pending Teachers with role-based flows
- **Email Integration**: Brevo for transactional emails (OTP and password reset)
- **Comprehensive Database**: Exam platform with 20+ models for complete feature set

### Technology Stack

**Backend**:

- NestJS 11.1.24 - Modern TypeScript backend framework
- Prisma 7.8.0 - Object-relational mapping with schema-first approach
- PostgreSQL - Relational database (Neon serverless in production)
- Brevo API v1.0.0 - Transactional email service
- JWT - JSON Web Token for authentication
- Bcrypt - Password hashing with 10 salt rounds

**Frontend**:

- Next.js 14+ - React framework with App Router
- TypeScript - Type-safe development
- Tailwind CSS - Utility-first CSS framework
- Axios - HTTP client for API calls
- Lucide React - Beautiful icon library
- React Hooks - State management

### Project Structure

```
/Volumes/NIKHIL/Study/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/          # Authentication module
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── otp.service.ts
│   │   │   │   ├── password-reset.service.ts
│   │   │   │   └── dto/
│   │   │   │       └── auth.dto.ts
│   │   │   └── email/         # Email module
│   │   │       ├── brevo.service.ts
│   │   │       └── email.module.ts
│   │   ├── jobs/
│   │   │   └── cleanup.service.ts
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── prisma.service.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── globals.css
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── components/
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   └── ResetPasswordForm.tsx
│   │   ├── hooks/
│   │   │   ├── useFormState.ts
│   │   │   └── useOtpTimer.ts
│   │   ├── services/
│   │   │   └── auth.service.ts
│   │   └── types/
│   │       └── auth.ts
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── package.json
│   ├── .env.example
│   ├── .env.local
│   └── README.md
├── .gitignore
└── README.md
```

---

## 🔐 Authentication System

### Registration Flow (2-Step OTP Verification)

**Endpoint**: `POST /api/auth/register`

**Request**:

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT"
}
```

**Response**:

```json
{
  "message": "OTP sent to your email",
  "email_masked": "j***@example.com",
  "otp_expiry_minutes": 10
}
```

**Process**:

1. Backend validates email and password strength
2. Generates cryptographically secure 6-digit OTP
3. Sends OTP via Brevo email template
4. Stores OTP record with 10-minute expiry and 3-attempt limit
5. Returns masked email for UI display

**Verification Endpoint**: `POST /api/auth/register/verify-otp`

**Request**:

```json
{
  "email": "user@example.com",
  "otp": "123456",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT"
}
```

**Response**:

```json
{
  "message": "Account created successfully",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "role": "STUDENT"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Process**:

1. Backend validates OTP (checks expiry, attempts, code match)
2. Creates User record with email_verified_at timestamp
3. Hashes password with bcrypt (10 salt rounds)
4. Creates UserStats and TeacherApplication (if PENDING_TEACHER)
5. Generates JWT tokens (access: 1 hour, refresh: 7 days)
6. Logs authentication event to AuditLog
7. Returns tokens and user information

### Password Reset Flow

**Step 1 - Request Reset**: `POST /api/auth/forgot-password`

**Request**:

```json
{
  "email": "user@example.com"
}
```

**Response**:

```json
{
  "message": "Reset link sent to your email",
  "email_masked": "u***@example.com"
}
```

**Process**:

1. Finds user by email (returns generic message if not found for security)
2. Generates 32-byte random token
3. Creates SHA256 hash of token for storage
4. Stores token with 60-minute expiry
5. Sends reset URL via Brevo email template with plaintext token
6. Token format: `reset_token={plaintext_token}`

**Step 2 - Reset Password**: `POST /api/auth/reset-password`

**Request**:

```json
{
  "token": "random_32_byte_token_from_email",
  "newPassword": "NewSecurePassword456",
  "confirmPassword": "NewSecurePassword456"
}
```

**Response**:

```json
{
  "message": "Password reset successfully"
}
```

**Process**:

1. Hashes input token and looks up in database
2. Validates token not expired (60 minutes)
3. Validates token not already used
4. Updates user password with bcrypt hash
5. Marks token as used
6. Invalidates all user's refresh tokens (forces re-login on all devices)
7. Logs password reset to AuditLog
8. Returns success message

---

## 📧 Email Service (Brevo)

### Configuration

**Environment Variables**:

```env
BREVO_API_KEY=your_api_key_here
BREVO_SENDER_EMAIL=noreply@study.app
BREVO_SENDER_NAME=Study Platform
BREVO_OTP_TEMPLATE_ID=1
BREVO_PASSWORD_RESET_TEMPLATE_ID=2
```

### Template Setup in Brevo Dashboard

**OTP Template (ID: 1)**:

- Name: "Study Platform - OTP"
- Parameters: `{firstName}`, `{otp}`
- Body: "Hi {firstName}, your OTP is {otp}. Valid for 10 minutes."

**Password Reset Template (ID: 2)**:

- Name: "Study Platform - Password Reset"
- Parameters: `{firstName}`, `{resetUrl}`
- Body: "Hi {firstName}, click here to reset password: {resetUrl}. Valid for 60 minutes."

### Brevo Setup Steps

1. Create Brevo account at https://www.brevo.com
2. Get API key from Settings > Account
3. Verify sender email in Settings > Senders
4. Create email templates in Campaigns > Templates
5. Copy template IDs to `.env` file
6. Test with API call or platform flows

---

## 🗄️ Database Schema

### Core Authentication Models

**User**:

```prisma
model User {
  id                  String    @id @default(cuid())
  email               String    @unique
  password_hash       String
  first_name          String
  last_name           String?
  role                UserRole  @default(STUDENT)
  email_verified_at   DateTime?
  created_at          DateTime  @default(now())
  updated_at          DateTime  @updatedAt
  last_login_at       DateTime?
}
```

**OtpRecord**:

```prisma
model OtpRecord {
  id          String    @id @default(cuid())
  email       String    @unique
  otp_code    String    @db.VarChar(6)
  attempts    Int       @default(0)
  created_at  DateTime  @default(now())
  expires_at  DateTime
  verified_at DateTime?
}
```

**PasswordResetToken**:

```prisma
model PasswordResetToken {
  id          String    @id @default(cuid())
  user_id     String
  token_hash  String    @unique
  created_at  DateTime  @default(now())
  expires_at  DateTime
  used_at     DateTime?
  ip_address  String?
}
```

**RefreshToken**:

```prisma
model RefreshToken {
  id          String    @id @default(cuid())
  user_id     String
  token_hash  String    @unique
  expires_at  DateTime
  created_at  DateTime  @default(now())
  revoked_at  DateTime?
}
```

**AuditLog**:

```prisma
model AuditLog {
  id           String    @id @default(cuid())
  actor_id     String?
  action       String
  entity_type  String
  entity_id    String
  before_json  Json?
  after_json   Json?
  ip_address   String?
  user_agent   String?
  created_at   DateTime  @default(now())
}
```

### Additional Models (Exam Platform)

- TeacherApplication
- Subject
- Chapter
- Topic
- Question
- Test
- Attempt
- Response
- Challenge
- UserStats
- DailyActivity
- NotificationEvent

---

## 🚀 Setup and Deployment

### Backend Setup

1. **Install Dependencies**:

```bash
cd backend
npm install
```

2. **Configure Environment**:

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Setup Database**:

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. **Start Development Server**:

```bash
npm run dev
```

5. **Production Build**:

```bash
npm run build
npm start
```

### Frontend Setup

1. **Install Dependencies**:

```bash
cd frontend
npm install
```

2. **Configure Environment**:

```bash
cp .env.example .env.local
# Edit .env.local if needed
```

3. **Start Development Server**:

```bash
npm run dev
```

4. **Production Build**:

```bash
npm run build
npm start
```

---

## 🧪 Testing the System

### Manual Testing Checklist

**Registration Flow**:

- [ ] Navigate to `/register`
- [ ] Enter valid email and password
- [ ] Verify OTP sent to email
- [ ] Enter 6-digit OTP
- [ ] Account created and redirected to dashboard
- [ ] Tokens stored in localStorage

**Password Reset Flow**:

- [ ] Navigate to `/forgot-password`
- [ ] Enter registered email
- [ ] Check email for reset link
- [ ] Click reset link
- [ ] Enter new password
- [ ] Confirm old password no longer works
- [ ] Login with new password

**Error Cases**:

- [ ] Invalid email format
- [ ] Password too short
- [ ] Password mismatch
- [ ] Expired OTP
- [ ] Invalid OTP (attempt limit)
- [ ] Non-existent email (forgot password)
- [ ] Expired reset token

### Testing with curl

**Register**:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "firstName": "Test",
    "role": "STUDENT"
  }'
```

**Verify OTP**:

```bash
curl -X POST http://localhost:3001/api/auth/register/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456",
    "password": "TestPassword123",
    "firstName": "Test"
  }'
```

**Forgot Password**:

```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

---

## 🔒 Security Features

### Password Security

- Bcrypt hashing with 10 salt rounds
- Minimum 8 characters required
- No plaintext storage

### Token Security

- JWT tokens with cryptographic signing
- Access tokens: 1-hour expiry
- Refresh tokens: 7-day expiry
- Token hashing before database storage
- Token revocation on password reset

### OTP Security

- Cryptographically secure 6-digit code
- 10-minute expiry
- 3-attempt limit (prevents brute force)
- Email verification before account creation

### Email Security

- Masked email display (protects user privacy)
- Token-based password reset (no direct link)
- 60-minute reset token expiry
- IP address and user agent logging

### Data Protection

- SQL injection prevention via Prisma ORM
- XSS protection via React
- CSRF protection headers
- Rate limiting (to be added)

---

## 📊 Database Cleanup

### Scheduled Jobs

**Cleanup Expired OTPs**:

- Runs hourly
- Deletes OtpRecords with expires_at < now()
- Prevents data bloat

**Cleanup Expired Tokens**:

- Runs daily at 2:00 AM UTC
- Deletes unused PasswordResetTokens with expires_at < now()
- Maintains database performance

---

## 🚦 API Rate Limiting (To Be Added)

Will implement using `@nestjs/throttler`:

- 5 register attempts per 15 minutes per IP
- 10 OTP verifications per 15 minutes per email
- 5 forgot password attempts per 30 minutes per IP
- 5 reset password attempts per 30 minutes per token

---

## 📈 Performance Considerations

### Optimization Strategies

1. **Database Indexes**:
   - Unique indices on email, token_hash
   - Foreign key indices for lookups

2. **Caching**:
   - JWT tokens in memory (user side)
   - Session tokens in localStorage (frontend)

3. **Query Optimization**:
   - Prisma select to fetch only needed fields
   - Eager loading for relationships

4. **Rate Limiting**:
   - Prevent brute force attacks
   - Protect against DoS attacks

---

## 🐛 Common Issues and Solutions

### Issue: OTP Not Received

**Solutions**:

1. Verify Brevo API key in `.env`
2. Check template IDs match configuration
3. Verify sender email is verified in Brevo
4. Check spam folder in email client
5. Check backend logs for errors

### Issue: Token Expired

**Solutions**:

1. Access token (1 hour): Make new request to get new token
2. Refresh token (7 days): User must login again
3. Reset token (60 minutes): Request new password reset

### Issue: CORS Errors

**Solutions**:

1. Verify `APP_URL` in backend `.env`
2. Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
3. Ensure URLs match (http/https, domain, port)

---

## 📚 Future Enhancements

### Phase 2:

- [ ] Social login (Google, GitHub)
- [ ] Two-factor authentication
- [ ] Session management per device
- [ ] Login history and device tracking

### Phase 3:

- [ ] Email verification flow
- [ ] Password strength meter
- [ ] Account security settings
- [ ] IP whitelist/blacklist

### Phase 4:

- [ ] Account recovery options
- [ ] Security questions
- [ ] Email change verification
- [ ] Notification preferences

---

## 📞 Support and Contribution

For issues, questions, or contributions:

1. Check existing documentation
2. Review error messages in logs
3. Test with curl/Postman
4. Check GitHub issues
5. Create detailed bug reports

---

## 📄 License

This project is licensed under the ISC License.

---

**Last Updated**: 2024
**Version**: 1.0.0
