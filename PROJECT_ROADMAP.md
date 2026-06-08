# 📋 Exam Platform - Complete Project Roadmap

**Project**: Professional Exam Platform with Role-Based Admin Controls  
**Tech Stack**: NestJS + Next.js + PostgreSQL (Railway)  
**Status**: Phase 2 Foundation Complete ✅ | Building → Phase 3  
**Last Updated**: 2026-06-08

---

## 📑 Table of Contents

1. [Project Overview](#-project-overview)
2. [Phase 1: Completed ✅](#phase-1-backend-security--dynamic-roles--complete-)
3. [Phase 2: Foundation Complete ✅](#phase-2-questions--tests-backend--foundation-complete-)
4. [Phase 3-9: Upcoming](#-phase-3-9-upcoming-roadmap)
5. [Full Project Structure](#-complete-project-structure)
6. [Database Schema](#-database-schema)
7. [API Endpoints Summary](#-api-endpoints-summary)
8. [Deployment Guide](#-deployment-guide)

---

## 🎯 Project Overview

### Problem Solved

- ❌ **Before**: Hardcoded roles, no admin controls, missing question/test backends, no authorization
- ✅ **After**: Database-driven roles, full admin panel, complete question lifecycle, secure authorization

### Key Features

- 🔐 **Dynamic Role Management**: Create/edit/delete roles with custom permissions
- 📝 **6 Question Types**: Single MCQ, Multiple MCQ, True/False, Fill Blank, Matching, Passage
- 📊 **Question Versioning**: Audit trail of all changes with restore capability
- 👥 **Teacher Management**: Approve/reject teacher applications
- 📈 **Analytics**: System health, user stats, audit logs
- ⏰ **Server Keep-Alive**: Prevent Railway sleep during exams
- 🎨 **LaTeX Support**: Mathematical equations in questions and solutions
- 🔒 **Security**: JWT authentication, role-based access control, rate limiting

---

# Phase 1: Backend Security & Dynamic Roles | ✅ COMPLETE

## ✅ What's Implemented

### 1. Authorization Guards & Decorators

**Location**: `/backend/src/modules/common/`

- ✅ **JwtAuthGuard** (`guards/jwt-auth.guard.ts`)
  - Extracts JWT from `Authorization: Bearer` header or cookies
  - Validates token signature using JWT_SECRET
  - Stores decoded payload in `request.user`
  - Error: 401 Unauthorized if token invalid/expired

- ✅ **RolesGuard** (`guards/roles.guard.ts`)
  - Reads `@Roles()` decorator metadata from route handler
  - Compares user's role against required roles
  - Error: 403 Forbidden if role doesn't match

- ✅ **@Roles() Decorator** (`decorators/roles.decorator.ts`)
  - Marks endpoints with required role(s): `@Roles("ADMIN")` or `@Roles("TEACHER", "ADMIN")`
  - Used in conjunction with RolesGuard

### 2. Dynamic Roles System

**Location**: `/backend/src/modules/roles/`

#### Files Created:

- `roles.module.ts` - NestJS module with imports/exports
- `roles.controller.ts` - HTTP endpoints for role management
- `roles.service.ts` - Business logic for role CRUD
- `dto/role.dto.ts` - Zod validation schemas

#### Roles Controller Endpoints:

```
GET    /api/admin/roles              - List all roles (paginated)
POST   /api/admin/roles              - Create new role
GET    /api/admin/roles/:id          - Get role details
PATCH  /api/admin/roles/:id          - Update role
DELETE /api/admin/roles/:id          - Delete role
```

All endpoints require: `@Roles("ADMIN")`

#### System Roles (Immutable):

| Role                | Permissions                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **STUDENT**         | take_test, view_results, submit_challenge                                                                                       |
| **TEACHER**         | create_question, edit_question, delete_question, create_test, edit_test, publish_test, review_challenge                         |
| **ADMIN**           | manage_users, manage_roles, manage_questions, manage_tests, approve_teachers, manage_challenges, view_audit_logs, system_health |
| **PENDING_TEACHER** | view_profile, edit_profile                                                                                                      |

#### Roles Service Methods:

- `createRole(data)` - Create new role with permissions
- `findAllRoles(skip, take)` - Paginated list
- `findRoleById(id)` - Get single role
- `updateRole(id, data)` - Update role (prevents name conflicts)
- `deleteRole(id)` - Delete role (prevents deletion of system roles)
- `seedDefaultRoles()` - Populate default 4 roles

### 3. Updated Authentication

**Location**: `/backend/src/modules/auth/`

- ✅ **auth.dto.ts** - Updated to accept `role: string` (was hardcoded enum)
- ✅ **auth.service.ts** - verifyOtpAndCreateUser accepts dynamic role parameter
  - Validates role against whitelist: `["STUDENT", "PENDING_TEACHER"]`
  - Only TEACHER/ADMIN can be assigned manually
- ✅ **auth.controller.ts** - No role enum casting needed

### 4. Database Schema Updates

**Location**: `/backend/prisma/schema.prisma`

New Role Model:

```prisma
model Role {
  id              String    @id @default(cuid())
  name            String    @unique
  description     String    @default("")
  permissions_json Json      @default("[]")
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  @@index([name])
}
```

### 5. Seed Script & Build Verification

- ✅ **prisma/seed.ts** - Auto-populates 4 default roles on migration
- ✅ **package.json** - Added `prisma:seed` script
- ✅ **Build Status**: `npm run build` → ✅ 0 TypeScript errors

### 6. App Module Configuration

**Updated**: `/backend/src/app.module.ts`

- Global JWT module with 1h expiration
- RolesModule imported and available
- Rate limiting configured for auth endpoints

## 🚀 Phase 1 Deployment Steps

### Step 1: Set Environment Variables

```bash
export DATABASE_URL="postgresql://user:password@railway.app:5432/db"
export JWT_SECRET="your-secret-key-min-32-chars"
```

### Step 2: Apply Migration

```bash
cd /Volumes/NIKHIL/Study/backend
npx prisma migrate deploy
```

### Step 3: Seed Default Roles

```bash
npm run prisma:seed
```

### Step 4: Verify

```bash
# Check build
npm run build

# Start dev server
npm run dev

# Test authorization
curl -X GET http://localhost:3000/api/admin/roles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

# Phase 2: Questions & Tests Backend | ✅ FOUNDATION COMPLETE

## ✅ What's Implemented

### 1. Question DTO with All 6 Types

**Location**: `/backend/src/modules/questions/dto/question.dto.ts`

Comprehensive Zod validation schemas for all question types:

#### Question Type Schemas:

**ContentBlockSchema** (reusable for any content):

```typescript
{
  type: "TEXT" | "LATEX" | "IMAGE",
  content?: string,           // Text or LaTeX code
  asset_id?: string          // Asset ID for images
}
```

**SingleCorrectMCQSchema**:

```typescript
{
  type: "SINGLE_CORRECT",
  content_json: [ContentBlock],    // Question text
  options_json: {
    options: [{id: string, text: string}]  // Min 2 options
  },
  answer_key: {
    correct_option: "opt1"          // Single correct ID
  }
}
```

**MultipleCorrectMCQSchema**:

```typescript
{
  type: "MULTIPLE_CORRECT",
  content_json: [ContentBlock],
  options_json: {options: [{id, text}]},
  answer_key: {
    correct_options: ["opt1", "opt3"]  // Multiple correct IDs
  }
}
```

**TrueFalseSchema**:

```typescript
{
  type: "TRUE_FALSE",
  content_json: [ContentBlock],
  answer_key: {answer: true | false}
}
```

**FillBlankSchema**:

```typescript
{
  type: "FILL_BLANK",
  content_json: [ContentBlock],  // May contain {blank} placeholders
  answer_key: {
    blanks: [
      {position: 1, answer: "word", case_sensitive: false},
      {position: 2, answer: "WORD2", case_sensitive: true}
    ]
  }
}
```

**MatchingSchema**:

```typescript
{
  type: "MATCHING",
  content_json: [ContentBlock],
  options_json: {
    left_column: [{id, text}],
    right_column: [{id, text}]
  },
  answer_key: {
    pairs: [
      {left_id: "l1", right_id: "r1"},
      {left_id: "l2", right_id: "r2"}
    ]
  }
}
```

**PassageSchema**:

```typescript
{
  type: "PASSAGE",
  content_json: [ContentBlock],  // Full passage text
  options_json: {
    sub_questions: [
      {
        id: "sq1",
        question_text: "First question",
        question_type: "SINGLE_CORRECT" | "MULTIPLE_CORRECT" | "TRUE_FALSE",
        options: [{id, text}]
      }
    ]
  },
  answer_key: {
    answers: {
      "sq1": {type: "SINGLE_CORRECT", answer: "opt1"},
      "sq2": {type: "MULTIPLE_CORRECT", answer: ["opt1", "opt2"]}
    }
  }
}
```

All schemas include:

- `difficulty`: "EASY" | "MEDIUM" | "HARD" (default: MEDIUM)
- `marks`: number (default: 1)
- `negative_marks`: number (default: 0)
- `solution_json`: [ContentBlock] (optional)

### 2. Questions Service - Full CRUD & Versioning

**Location**: `/backend/src/modules/questions/questions.service.ts`

#### Service Methods:

**`createQuestion(userId, data)`**

- Validates topic exists
- Creates question with all JSON fields
- Returns created question with relations

**`findAllQuestions(filters?, skip, take)`**

- Filter by: topic_id, question_type, difficulty, created_by
- Teachers see only own questions
- Admins see all questions
- Paginated results

**`findQuestionById(id)`**

- Returns question with topic and version history (latest 10)
- Error: NotFoundException if not found

**`updateQuestion(id, data)`**

- If answer_key changes: creates version snapshot first
- Updates only provided fields (PATCH semantics)
- Increments version_number
- Error: NotFoundException if question doesn't exist

**`deleteQuestion(id)`**

- Checks if question used in PUBLISHED/ONGOING tests
- Prevents deletion if in active tests
- Cascades to versions
- Error: BadRequestException if in active test

**`getQuestionVersions(id, limit?)`**

- Returns version snapshots
- Ordered by version_number descending
- Default limit: 20

**`restoreQuestionVersion(id, versionNumber)`**

- Snapshots current version first
- Restores to target version
- Increments version_number after restore
- Error: NotFoundException if version doesn't exist

### 3. Questions Controller - 7 Protected Endpoints

**Location**: `/backend/src/modules/questions/questions.controller.ts`

All endpoints protected with `@UseGuards(JwtAuthGuard, RolesGuard)`

```
POST   /api/admin/questions              - Create question
GET    /api/admin/questions              - List questions (with filters)
GET    /api/admin/questions/:id          - Get question detail
PATCH  /api/admin/questions/:id          - Update question
DELETE /api/admin/questions/:id          - Delete question
GET    /api/admin/questions/:id/versions - Get version history
POST   /api/admin/questions/:id/restore/:version - Restore version
```

**Access Control**:

- Require roles: TEACHER, ADMIN
- Teachers can only access their own questions
- Admins have full access

**Validation**:

- POST/PATCH: Zod schema validation
- Path parameters: ID validation
- Query parameters: Type coercion

### 4. Questions Module - Wiring & Exports

**Location**: `/backend/src/modules/questions/questions.module.ts`

- Imports: JwtModule
- Providers: QuestionsService, PrismaService
- Controllers: QuestionsController
- Exports: QuestionsService

### 5. App Module Integration

**Updated**: `/backend/src/app.module.ts`

- Added QuestionsModule to imports
- Questions endpoints now available

### 6. Build Verification

```bash
npm run build
✅ TypeScript compilation: 0 errors
```

---

# 🚀 Phase 3-9: Upcoming Roadmap

## Phase 3: Tests Module & Scoring Engine (NOT STARTED)

### Tasks:

1. **Create Tests DTO** (`src/modules/tests/dto/test.dto.ts`)
   - CreateTestDto: name, description, subject_id, total_time (minutes)
   - UpdateTestDto: partial fields
   - AddQuestionsDto: array of {question_id, section_id, order}

2. **Create Tests Service** (`src/modules/tests/tests.service.ts`)
   - `createTest(userId, data)` - Create draft test
   - `findAllTests(filters, skip, take)` - List with status filter
   - `findTestById(id)` - Detail with questions
   - `updateTest(id, data)` - Update metadata
   - `addQuestionsToTest(testId, questions)` - Add questions in sections
   - `publishTest(id)` - Status DRAFT → PUBLISHED
   - `deleteTest(id)` - Prevent if ONGOING/COMPLETED
   - `getTestPayload(id)` - Full test (no answers) for students
   - `getTestResults(id)` - Results aggregation

3. **Create Tests Controller** (`src/modules/tests/tests.controller.ts`)

   ```
   POST   /api/admin/tests              - Create test
   GET    /api/admin/tests              - List tests
   GET    /api/admin/tests/:id          - Get test metadata
   PATCH  /api/admin/tests/:id          - Update test
   DELETE /api/admin/tests/:id          - Delete test
   POST   /api/admin/tests/:id/questions - Add questions
   PATCH  /api/admin/tests/:id/publish  - Publish test
   GET    /tests/:id/payload            - Get full payload (public)
   POST   /attempts                     - Start attempt
   GET    /attempts/:id                 - Get attempt (for resume)
   POST   /attempts/:id/responses       - Submit response
   POST   /attempts/:id/submit          - Submit attempt
   ```

4. **Create Scoring Service** (`src/modules/scoring/scoring.service.ts`)
   - `scoreResponse(questionType, answerKey, userResponse)` → score
   - Per-type scoring logic:
     - SINGLE_CORRECT: exact match → marks or 0
     - MULTIPLE_CORRECT: exact set match → marks or 0
     - TRUE_FALSE: boolean match → marks or 0
     - FILL_BLANK: case-sensitive string match → marks or 0
     - MATCHING: all pairs correct → marks or 0
     - PASSAGE: score each sub-question independently → sum marks
   - `calculateAttemptScore(attempt, responses)` → total
   - `applyNegativeMarks(score, negativeMarks)` → final

5. **Create Tests Module** (`src/modules/tests/tests.module.ts`)
   - Wire all above together
   - Export to AppModule

### Expected Outcome:

- ✅ Full test CRUD with question composition
- ✅ Publish/draft status management
- ✅ Full test payload delivery to students
- ✅ Scoring with negative marks support
- ✅ Build: 0 errors

---

## Phase 4: Admin Management APIs (NOT STARTED)

### Tasks:

1. **Create Admin Module** (`src/modules/admin/`)
   - admin.controller.ts
   - admin.service.ts
   - admin.module.ts

2. **Admin Endpoints**:

   ```
   GET    /api/admin/users              - Search users
   PATCH  /api/admin/users/:id/role     - Change user role
   DELETE /api/admin/users/:id          - Delete user
   GET    /api/admin/teachers/pending   - Pending teacher applications
   PATCH  /api/admin/teachers/:id/approve - Approve teacher
   PATCH  /api/admin/teachers/:id/reject  - Reject teacher
   GET    /api/admin/audit-logs         - View audit trail
   GET    /api/admin/system/health      - System health metrics
   ```

3. **User Search & Filtering**:
   - Search by email, name, role
   - Filter by registration_date, status
   - Pagination support

4. **Teacher Management**:
   - Approve/reject pending teachers
   - Track approval status
   - Audit trail

### Expected Outcome:

- ✅ Full admin management dashboard backend
- ✅ User/role/teacher CRUD
- ✅ Build: 0 errors

---

## Phase 5: Frontend Question Components (NOT STARTED)

### Tasks:

1. **Question Type Components** - Create 6 question components:
   - `SingleCorrectQuestion.tsx` - Radio buttons + LaTeX rendering
   - `MultipleCorrectQuestion.tsx` - Checkboxes + LaTeX rendering
   - `TrueFalseQuestion.tsx` - Binary toggle
   - `FillBlankQuestion.tsx` - Text inputs with blanks
   - `MatchingQuestion.tsx` - Drag-drop pairing
   - `PassageQuestion.tsx` - Passage + sub-questions

2. **LaTeX Rendering**:
   - Install KaTeX: `npm install katex react-katex`
   - Wrap math in `$...$` or `$$...$$`
   - Auto-render on question load

3. **Question Display Hook**:
   - `useQuestionRenderer(questionType, data)`
   - Returns formatted question component

4. **Results Display**:
   - Display user answer vs correct answer
   - Show score breakdown
   - Highlight correct/incorrect

### Expected Outcome:

- ✅ All 6 question types render correctly
- ✅ LaTeX equations render in questions/solutions
- ✅ Interactive attempt flow

---

## Phase 6: Frontend Integration & API Calls (NOT STARTED)

### Tasks:

1. **API Service Layer Updates**:
   - Update `services/questions.service.ts` - Real API calls instead of mock
   - Update `services/tests.service.ts` - Real test endpoints
   - Create `services/admin.service.ts` - Admin management calls

2. **Pages Implementation**:
   - Admin Questions Page - Full CRUD UI
   - Admin Tests Page - Test builder
   - Admin Users Page - User management
   - Attempt Page - Interactive test taking
   - Results Page - Score display

3. **Real-time Updates** (WebSocket):
   - Question updates push via Socket.io
   - Live scoring if needed
   - System notifications

### Expected Outcome:

- ✅ Frontend fully integrated with backend
- ✅ All CRUD operations working
- ✅ Attempt flow complete

---

## Phase 7: Server Keep-Alive Implementation (NOT STARTED)

### Tasks:

1. **Backend Health Endpoint**:

   ```typescript
   // src/modules/health/health.controller.ts
   @Get('/health')
   health() {
     return {status: 'ok', timestamp: new Date()};
   }
   ```

2. **Frontend Keep-Alive Hook**:

   ```typescript
   // src/hooks/useKeepAlive.ts
   useEffect(() => {
     const interval = setInterval(
       () => {
         fetch("/api/health").catch(console.error);
       },
       5 * 60 * 1000,
     ); // Every 5 minutes
     return () => clearInterval(interval);
   }, []);
   ```

3. **Home Page Integration**:
   - Add useKeepAlive hook to main layout
   - Logs ping status to console

### Expected Outcome:

- ✅ Server stays awake during student exams
- ✅ No Railway sleep interruptions

---

## Phase 8: Testing & QA (NOT STARTED)

### Tasks:

1. **Unit Tests**:
   - Services: scoring, questions, tests
   - Guards: JWT, Roles
   - DTOs: Validation schemas

2. **Integration Tests**:
   - Question CRUD flow
   - Test composition + scoring
   - Role access control

3. **E2E Tests**:
   - Full exam attempt flow
   - Admin CRUD operations
   - Role-based access

4. **Manual Testing**:
   - Question rendering across browsers
   - LaTeX equations
   - Responsive design

### Expected Outcome:

- ✅ >80% test coverage
- ✅ Zero known bugs
- ✅ All features verified

---

## Phase 9: Deployment & Monitoring (NOT STARTED)

### Tasks:

1. **Railway Deployment**:
   - Database migration
   - Environment variables setup
   - Build verification
   - Deploy backend

2. **Vercel Deployment**:
   - Next.js build
   - Environment variables
   - Deploy frontend

3. **Monitoring**:
   - Error tracking (Sentry)
   - Uptime monitoring
   - Performance metrics
   - Audit log review

4. **Documentation**:
   - API documentation (Swagger)
   - Deployment guide
   - Admin manual
   - User guide

### Expected Outcome:

- ✅ Production-ready deployment
- ✅ Monitored & observable system
- ✅ Complete documentation

---

# 📁 Complete Project Structure

```
/Volumes/NIKHIL/Study/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema (PostgreSQL)
│   │   └── seed.ts                 # Seed script (default roles)
│   ├── src/
│   │   ├── main.ts                 # Entry point
│   │   ├── app.module.ts           # Root module
│   │   │
│   │   ├── modules/
│   │   │   ├── auth/               # Authentication
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── otp.service.ts
│   │   │   │   ├── password-reset.service.ts
│   │   │   │   └── dto/
│   │   │   │       └── auth.dto.ts
│   │   │   │
│   │   │   ├── common/             # Shared utilities
│   │   │   │   ├── guards/
│   │   │   │   │   ├── jwt-auth.guard.ts  ✅ PHASE 1
│   │   │   │   │   └── roles.guard.ts     ✅ PHASE 1
│   │   │   │   ├── decorators/
│   │   │   │   │   └── roles.decorator.ts ✅ PHASE 1
│   │   │   │   └── pipes/
│   │   │   │
│   │   │   ├── roles/              # Role management ✅ PHASE 1
│   │   │   │   ├── roles.controller.ts
│   │   │   │   ├── roles.service.ts
│   │   │   │   ├── roles.module.ts
│   │   │   │   └── dto/
│   │   │   │       └── role.dto.ts
│   │   │   │
│   │   │   ├── questions/          # Questions CRUD ✅ PHASE 2
│   │   │   │   ├── questions.controller.ts
│   │   │   │   ├── questions.service.ts
│   │   │   │   ├── questions.module.ts
│   │   │   │   └── dto/
│   │   │   │       └── question.dto.ts
│   │   │   │
│   │   │   ├── tests/              # Tests module (TODO PHASE 3)
│   │   │   │   ├── tests.controller.ts
│   │   │   │   ├── tests.service.ts
│   │   │   │   ├── tests.module.ts
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── scoring/            # Scoring engine (TODO PHASE 3)
│   │   │   │   ├── scoring.service.ts
│   │   │   │   └── scoring.module.ts
│   │   │   │
│   │   │   ├── admin/              # Admin management (TODO PHASE 4)
│   │   │   │   ├── admin.controller.ts
│   │   │   │   ├── admin.service.ts
│   │   │   │   └── admin.module.ts
│   │   │   │
│   │   │   ├── email/              # Email service
│   │   │   │   ├── brevo.service.ts
│   │   │   │   └── email.module.ts
│   │   │   │
│   │   │   ├── upload/             # File uploads
│   │   │   │   ├── upload.controller.ts
│   │   │   │   ├── upload.service.ts
│   │   │   │   └── upload.module.ts
│   │   │   │
│   │   │   ├── health/             # Health check (TODO PHASE 7)
│   │   │   │   └── health.controller.ts
│   │   │   │
│   │   │   └── prisma/
│   │   │       └── prisma.service.ts
│   │   │
│   │   ├── config/                 # Config files
│   │   ├── jobs/                   # Scheduled tasks
│   │   │   └── cleanup.service.ts
│   │   │
│   │   └── types/                  # TypeScript types
│   │
│   ├── dist/                       # Compiled output
│   ├── package.json
│   ├── tsconfig.json
│   ├── PHASE_1_COMPLETE.md         # Phase 1 documentation
│   ├── PHASE_2_PROGRESS.md         # Phase 2 documentation
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── ApprovalQueue.tsx
│   │   │   │   ├── AuditLogTable.tsx
│   │   │   │   ├── SystemHealthPanel.tsx
│   │   │   │   ├── UserTable.tsx
│   │   │   │   ├── approvals/
│   │   │   │   ├── challenges/
│   │   │   │   ├── system/
│   │   │   │   └── users/
│   │   │   ├── dashboard/
│   │   │   ├── forgot-password/
│   │   │   ├── register/
│   │   │   ├── reset-password/
│   │   │   ├── leaderboard/
│   │   │   ├── results/
│   │   │   ├── study-plan/
│   │   │   ├── teacher/
│   │   │   └── tests/
│   │   │
│   │   ├── components/
│   │   │   ├── FileUpload.tsx
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── ResetPasswordForm.tsx
│   │   │   ├── layout/
│   │   │   ├── leaderboard/
│   │   │   ├── realtime/
│   │   │   ├── results/
│   │   │   ├── tests/
│   │   │   │   ├── SingleCorrectQuestion.tsx        (TODO PHASE 5)
│   │   │   │   ├── MultipleCorrectQuestion.tsx      (TODO PHASE 5)
│   │   │   │   ├── TrueFalseQuestion.tsx            (TODO PHASE 5)
│   │   │   │   ├── FillBlankQuestion.tsx            (TODO PHASE 5)
│   │   │   │   ├── MatchingQuestion.tsx             (TODO PHASE 5)
│   │   │   │   └── PassageQuestion.tsx              (TODO PHASE 5)
│   │   │   └── ui/
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useFormState.ts
│   │   │   ├── useOtpTimer.ts
│   │   │   ├── useRole.ts
│   │   │   ├── useSocket.ts
│   │   │   ├── useToast.ts
│   │   │   └── useKeepAlive.ts                      (TODO PHASE 7)
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── mock-data.ts
│   │   │   └── toast.ts
│   │   │
│   │   ├── providers/
│   │   │   ├── auth-provider.tsx
│   │   │   ├── query-provider.tsx
│   │   │   ├── socket-provider.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   └── toast-provider.tsx
│   │   │
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── challenges.service.ts
│   │   │   ├── questions.service.ts            (Update PHASE 6)
│   │   │   ├── results.service.ts
│   │   │   ├── tests.service.ts                (Update PHASE 6)
│   │   │   ├── upload.service.ts
│   │   │   └── admin.service.ts                (Create PHASE 6)
│   │   │
│   │   ├── store/
│   │   │   ├── auth.store.ts
│   │   │   ├── test.store.ts
│   │   │   └── theme.store.ts
│   │   │
│   │   ├── types/
│   │   │   └── auth.ts
│   │   │
│   │   ├── middleware.ts
│   │   └── globals.css
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── README.md
│
├── LICENSE
├── package.json
├── README.md
└── PROJECT_ROADMAP.md               # This file

```

---

# 🗄️ Database Schema

## Core Models (Implemented)

### Users Table

```sql
-- Stores user accounts
id (cuid, PK)
email (unique)
password_hash
phone
first_name
last_name
role (FK to Role table)
status (ACTIVE, INACTIVE, BANNED)
profile_pic_url
created_at
updated_at
```

### Role Table (✅ PHASE 1)

```sql
id (cuid, PK)
name (unique) - STUDENT, TEACHER, ADMIN, PENDING_TEACHER, or custom
description
permissions_json (JSON array)
created_at
updated_at
```

### Question Table (✅ PHASE 2)

```sql
id (cuid, PK)
title
type (SINGLE_CORRECT, MULTIPLE_CORRECT, TRUE_FALSE, FILL_BLANK, MATCHING, PASSAGE)
topic_id (FK)
content_json (JSON) - Text/LaTeX/Image blocks
options_json (JSON) - Type-specific options
answer_key (JSON) - Type-specific correct answer
solution_json (JSON, nullable) - Solution content blocks
difficulty (EASY, MEDIUM, HARD)
marks (default 1)
negative_marks (default 0)
created_by (FK to User)
version_number (default 1)
created_at
updated_at
```

### QuestionVersion Table (✅ PHASE 2)

```sql
id (cuid, PK)
question_id (FK)
version_number
content_json (JSON snapshot)
options_json (JSON snapshot)
answer_key (JSON snapshot)
solution_json (JSON snapshot, nullable)
created_at
```

### Test Table (TODO PHASE 3)

```sql
id (cuid, PK)
title
description
subject_id (FK)
created_by (FK to User)
status (DRAFT, PUBLISHED, ONGOING, COMPLETED)
total_time (minutes)
passing_percentage (default 40)
created_at
updated_at
```

### TestQuestion Table (TODO PHASE 3)

```sql
id (cuid, PK)
test_id (FK)
question_id (FK)
section_id
order (sequence in test)
marks (override question marks if set)
negative_marks (override if set)
```

### Attempt Table (TODO PHASE 3)

```sql
id (cuid, PK)
test_id (FK)
user_id (FK)
start_time
end_time (nullable until submitted)
status (STARTED, IN_PROGRESS, SUBMITTED)
total_score (calculated)
created_at
```

### Response Table (TODO PHASE 3)

```sql
id (cuid, PK)
attempt_id (FK)
question_id (FK)
user_answer (JSON) - Type-specific answer format
score
is_correct
created_at
updated_at
```

### Other Tables

- OtpRecord - One-time passwords
- PasswordResetToken - Token-based password resets
- RefreshToken - JWT refresh tokens
- Subject, Chapter, Topic - Content hierarchy
- Asset - Uploaded images/files
- TeacherApplication - Teacher approval workflow
- UserStats, DailyActivity - Analytics
- NotificationEvent, AuditLog - Logging

---

# 🔌 API Endpoints Summary

## Authentication (Existing)

```
POST   /api/auth/register              - Register with OTP
POST   /api/auth/verify-otp            - Verify OTP
POST   /api/auth/login                 - Login with email/password
POST   /api/auth/refresh               - Refresh access token
POST   /api/auth/forgot-password       - Request password reset
POST   /api/auth/reset-password        - Reset password with token
POST   /api/auth/logout                - Logout
```

## Roles Management (✅ PHASE 1)

```
GET    /api/admin/roles                - List all roles
POST   /api/admin/roles                - Create role
GET    /api/admin/roles/:id            - Get role details
PATCH  /api/admin/roles/:id            - Update role
DELETE /api/admin/roles/:id            - Delete role (not system roles)
```

## Questions Management (✅ PHASE 2)

```
POST   /api/admin/questions            - Create question
GET    /api/admin/questions            - List questions (with filters)
GET    /api/admin/questions/:id        - Get question
PATCH  /api/admin/questions/:id        - Update question
DELETE /api/admin/questions/:id        - Delete question
GET    /api/admin/questions/:id/versions - Get version history
POST   /api/admin/questions/:id/restore/:version - Restore version
```

## Tests Management (TODO PHASE 3)

```
POST   /api/admin/tests                - Create test
GET    /api/admin/tests                - List tests
GET    /api/admin/tests/:id            - Get test
PATCH  /api/admin/tests/:id            - Update test
DELETE /api/admin/tests/:id            - Delete test
POST   /api/admin/tests/:id/questions  - Add questions
PATCH  /api/admin/tests/:id/publish    - Publish test
GET    /tests/:id/payload              - Get full test payload (public)
POST   /attempts                       - Start attempt
GET    /attempts/:id                   - Get attempt
POST   /attempts/:id/responses         - Submit response
POST   /attempts/:id/submit            - Submit attempt
```

## Admin Management (TODO PHASE 4)

```
GET    /api/admin/users                - Search users
PATCH  /api/admin/users/:id/role       - Change user role
DELETE /api/admin/users/:id            - Delete user
GET    /api/admin/teachers/pending     - Pending teachers
PATCH  /api/admin/teachers/:id/approve - Approve teacher
PATCH  /api/admin/teachers/:id/reject  - Reject teacher
GET    /api/admin/audit-logs           - Audit trail
GET    /api/admin/system/health        - System health
```

## Health Check (TODO PHASE 7)

```
GET    /api/health                     - Server health status
```

---

# 🚀 Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (Railway or local)
- npm or yarn
- Railway CLI (for deployment)
- Vercel CLI (for frontend)

## Backend Deployment

### Step 1: Set Up Environment Variables

Create `.env.local` in `/backend/`:

```env
DATABASE_URL="postgresql://user:password@railway.app:5432/exam_db"
JWT_SECRET="your-secret-key-minimum-32-characters"
JWT_EXPIRES_IN="1h"
REFRESH_TOKEN_EXPIRES_IN="7d"
BREVO_API_KEY="your-brevo-key"
BREVO_FROM_EMAIL="noreply@yourapp.com"
NODE_ENV="production"
PORT=3000
```

### Step 2: Install Dependencies & Build

```bash
cd /Volumes/NIKHIL/Study/backend
npm install
npm run build
```

### Step 3: Run Migrations

```bash
npx prisma migrate deploy
npm run prisma:seed
```

### Step 4: Start Server

```bash
npm run start          # Production
# or
npm run dev            # Development with hot reload
```

### Step 5: Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Deploy
railway up
```

## Frontend Deployment

### Step 1: Set Up Environment Variables

Create `.env.local` in `/frontend/`:

```env
NEXT_PUBLIC_API_URL="https://your-backend-url.railway.app"
NEXT_PUBLIC_SOCKET_URL="https://your-backend-url.railway.app"
```

### Step 2: Build & Test Locally

```bash
cd /Volumes/NIKHIL/Study/frontend
npm install
npm run build
npm run dev
```

### Step 3: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables via Vercel dashboard
```

## Database Backup & Restore

### Backup

```bash
pg_dump -Fc "postgresql://user:password@railway.app:5432/exam_db" > backup.dump
```

### Restore

```bash
pg_restore -d "postgresql://user:password@localhost:5432/exam_db" backup.dump
```

---

# 📊 Current Metrics

| Component                        | Status      | Files           | Tests    |
| -------------------------------- | ----------- | --------------- | -------- |
| **Phase 1: Security & Roles**    | ✅ Complete | 8 files created | 0 (TODO) |
| **Phase 2: Questions Backend**   | ✅ Complete | 4 files created | 0 (TODO) |
| **Phase 3: Tests & Scoring**     | ⏳ TODO     | -               | -        |
| **Phase 4: Admin APIs**          | ⏳ TODO     | -               | -        |
| **Phase 5: Frontend Components** | ⏳ TODO     | -               | -        |
| **Phase 6: API Integration**     | ⏳ TODO     | -               | -        |
| **Phase 7: Keep-Alive**          | ⏳ TODO     | -               | -        |
| **Phase 8: Testing & QA**        | ⏳ TODO     | -               | -        |
| **Phase 9: Deployment**          | ⏳ TODO     | -               | -        |
| **TypeScript Build**             | ✅ 0 errors | -               | -        |
| **Database Migrations**          | ⏳ Pending  | -               | -        |

---

# 📝 Quick Commands Reference

```bash
# Backend
cd /Volumes/NIKHIL/Study/backend

# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Create migration
npx prisma migrate dev --name <migration_name>

# Apply migrations
npx prisma migrate deploy

# Seed database
npm run prisma:seed

# Open Prisma Studio
npm run prisma:studio

# Build TypeScript
npm run build

# Start development server
npm run dev

# Start production server
npm run start

# Lint & format
npm run lint
npm run format

# Run tests (when available)
npm test


# Frontend
cd /Volumes/NIKHIL/Study/frontend

# Install dependencies
npm install

# Start development
npm run dev

# Build
npm run build

# Start production
npm run start
```

---

# 🎓 Key Architecture Decisions

1. **JWT Authentication**: Stateless, scalable, suitable for API
2. **Role-Based Access Control**: Database-driven, flexible, auditable
3. **Question Versioning**: Full audit trail, allows rollback
4. **JSON Fields**: Flexible data model, supports heterogeneous question types
5. **Modular NestJS**: Separates concerns, easy testing, scalable
6. **Prisma ORM**: Type-safe, migrations, excellent DX
7. **Next.js Frontend**: SSR, API routes, built-in optimization
8. **PostgreSQL**: ACID compliance, JSON support, reliable

---

# ⚠️ Known Limitations & TODOs

- [ ] Tests module not started (Phase 3)
- [ ] Scoring engine not implemented (Phase 3)
- [ ] Admin management APIs incomplete (Phase 4)
- [ ] Question type frontend components missing (Phase 5)
- [ ] LaTeX rendering not integrated (Phase 5)
- [ ] Server keep-alive not implemented (Phase 7)
- [ ] Unit/integration tests not written (Phase 8)
- [ ] Deployment not finalized (Phase 9)
- [ ] Error tracking (Sentry) not configured
- [ ] Performance monitoring not setup

---

# 🔗 Related Documentation

- [PHASE_1_COMPLETE.md](./backend/PHASE_1_COMPLETE.md) - Phase 1 details
- [PHASE_2_PROGRESS.md](./backend/PHASE_2_PROGRESS.md) - Phase 2 details
- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)

---

**Last Updated**: June 8, 2026  
**Next Milestone**: Phase 3 - Tests Module & Scoring Engine  
**Target Completion**: Phase 2 Completion → Full Backend Ready
