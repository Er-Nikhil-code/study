# Study Platform Frontend

This is the frontend application for the Study Platform, built with Next.js, React, TypeScript, and Tailwind CSS.

## 🚀 Features

- **User Registration**: 2-step OTP-based registration with email verification
- **Password Reset**: Secure password reset flow with token-based verification
- **Responsive Design**: Mobile-first UI with Tailwind CSS
- **Form Validation**: Client-side validation using Zod schemas
- **Error Handling**: Comprehensive error messages and user feedback
- **Timer Management**: OTP countdown timer for better UX
- **TypeScript**: Fully typed codebase for better development experience

## 📋 Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Form Management**: React Hook Form + Custom Hooks
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **State Management**: React Hooks + Local Storage

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ or 20+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file with the required environment variables:

```bash
cp .env.example .env.local
```

3. Update the `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build

Build for production:

```bash
npm run build
```

### Production

Start the production server:

```bash
npm start
```

## 📁 Project Structure

```
src/
├── app/              # Next.js App Router pages and layout
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Home page
│   ├── globals.css   # Global styles
│   ├── register/     # Registration page
│   ├── forgot-password/    # Forgot password page
│   └── reset-password/     # Reset password page
├── components/       # React components
│   ├── RegisterForm.tsx         # 2-step registration form
│   ├── ForgotPasswordForm.tsx    # Forgot password form
│   └── ResetPasswordForm.tsx     # Reset password form
├── hooks/           # Custom React hooks
│   ├── useFormState.ts     # Form state management
│   └── useOtpTimer.ts      # OTP countdown timer
├── services/        # API services
│   └── auth.service.ts     # Authentication API calls
├── types/           # TypeScript types and interfaces
│   └── auth.ts      # Auth-related types
└── lib/             # Utility functions (if needed)
```

## 🔐 Authentication Flow

### Registration (2-Step OTP)

1. **Step 1**: User enters email, password, and personal information
   - Email validation
   - Password strength validation
   - Backend sends OTP via Brevo

2. **Step 2**: User enters 6-digit OTP
   - OTP validation (6 digits)
   - Backend verifies OTP and creates user account
   - User receives access and refresh tokens
   - Automatic redirect to dashboard

### Password Reset

1. **Forgot Password**: User enters email
   - Backend sends reset link via Brevo
   - Link contains secure token (expires in 60 minutes)

2. **Reset Password**: User follows link and enters new password
   - Token validation
   - Password strength validation
   - Backend updates password and invalidates all refresh tokens

## 🎨 UI Components

### RegisterForm
- 2-step registration with OTP verification
- Email and password validation
- Role selection (Student/Teacher)
- OTP countdown timer
- Error handling and feedback

### ForgotPasswordForm
- Email input with validation
- Success message with masked email
- Link to create new account

### ResetPasswordForm
- Password input with validation
- Token validation from URL params
- Success message with redirect to login

## 🔗 API Integration

All API calls are handled through `src/services/auth.service.ts`:

- `register()` - POST /auth/register
- `verifyOtp()` - POST /auth/register/verify-otp
- `forgotPassword()` - POST /auth/forgot-password
- `resetPassword()` - POST /auth/reset-password

## 🚦 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3001/api` |

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🧪 Testing

To test the registration flow:

1. Start the backend server (`npm run dev` in the backend folder)
2. Start the frontend server (`npm run dev` in the frontend folder)
3. Navigate to `http://localhost:3000/register`
4. Fill in the registration form
5. Check your email for the OTP (or check backend logs)
6. Enter the OTP to complete registration

### Test OTP

The backend generates real OTPs. During development, you can:
- Check the application logs to see the OTP
- Use Brevo dashboard to see sent emails
- Check your email inbox (if using real Brevo API key)

## 🐛 Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
npm run dev -- -p 3001
```

### API Connection Issues

1. Verify backend is running on `http://localhost:3001`
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Check browser console for CORS errors

### OTP Not Received

1. Verify backend Brevo configuration
2. Check backend logs for OTP generation
3. Verify email template IDs in backend `.env`

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.
