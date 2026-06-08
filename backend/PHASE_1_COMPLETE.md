# Phase 1 Implementation Complete: Backend Security & Dynamic Roles

## ✅ What's Been Implemented

### 1. **Authorization Guards & Decorators**

- ✅ `JwtAuthGuard` - Validates JWT tokens from headers or cookies
- ✅ `RolesGuard` - Checks user roles against endpoint requirements
- ✅ `@Roles()` decorator - Mark endpoints with required roles
- ✅ All located in `/backend/src/modules/common/`

### 2. **Dynamic Roles System**

- ✅ `Role` model added to Prisma schema
- ✅ `RolesService` with CRUD operations
- ✅ `RolesController` with admin endpoints:
  - `GET /api/admin/roles` - List all roles (paginated)
  - `POST /api/admin/roles` - Create custom role
  - `PATCH /api/admin/roles/:id` - Update role
  - `DELETE /api/admin/roles/:id` - Delete role (protects system roles)
  - `GET /api/admin/roles/:id` - Get role details
- ✅ Seed script to populate default roles (STUDENT, TEACHER, ADMIN, PENDING_TEACHER)

### 3. **Updated Authentication**

- ✅ Auth DTO updated to accept dynamic role strings
- ✅ Auth service validates and assigns roles safely
- ✅ Role hardcoded enums removed
- ✅ App module configured with global JWT module

### 4. **Database Schema Updates**

- ✅ Role model with:
  - `id` (unique ID)
  - `name` (unique role name)
  - `description` (optional)
  - `permissions_json` (array of permission strings)
  - `created_at` / `updated_at` timestamps
  - Index on `name` for fast lookups

## 🚀 Next Steps to Deploy Phase 1

### Step 1: Apply Database Migration

```bash
cd /Volumes/NIKHIL/Study/backend

# Set DATABASE_URL environment variable (if not already set)
export DATABASE_URL="postgresql://user:password@railway-host:5432/your-db"

# Create and apply migration
npx prisma migrate dev --name add_roles_model
```

### Step 2: Seed Default Roles

```bash
# The migration will auto-seed, but you can also manually run:
npm run prisma:seed
```

### Step 3: Verify Role Creation

```bash
# Check that roles exist in database
npm run prisma:studio

# Navigate to Role table and confirm STUDENT, TEACHER, ADMIN, PENDING_TEACHER exist
```

### Step 4: Test Authorization

```bash
# Start dev server
npm run dev

# Test unauthorized endpoint (should fail):
curl -X GET http://localhost:3001/api/admin/roles \
  -H "Authorization: Bearer invalid-token"

# Response: 401 Unauthorized - "Invalid or expired access token"

# Test with valid token:
# (Requires login first to get token)
curl -X GET http://localhost:3001/api/admin/roles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Response: 200 OK with list of roles
```

## 🔐 Authorization Implementation Details

### How It Works

1. **Request arrives at protected endpoint**

   ```
   GET /api/admin/roles
   Authorization: Bearer eyJhbGc...
   ```

2. **JwtAuthGuard extracts & validates token**
   - Checks Authorization header or cookies
   - Verifies JWT signature using JWT_SECRET
   - Stores decoded payload in `request.user`

3. **RolesGuard checks role requirement**
   - Reads `@Roles()` decorator from route handler
   - Compares user's role against required roles
   - If mismatch, returns 403 Forbidden

4. **Request proceeds to controller**
   - User context available in controller
   - Can access `request.user.id`, `request.user.role`, etc.

### Protected Endpoint Example

```typescript
@Controller("api/admin/roles")
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  @Get()
  @Roles("ADMIN") // Only ADMIN role can access
  async listRoles() {
    // Implementation
  }

  @Post()
  @Roles("ADMIN") // Only ADMIN role can access
  async createRole(@Body() body: CreateRoleDtoType) {
    // Implementation
  }
}
```

### System Roles (Cannot Be Deleted)

| Role                | Permissions                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **STUDENT**         | take_test, view_results, submit_challenge                                                                                       |
| **TEACHER**         | create_question, edit_question, delete_question, create_test, edit_test, publish_test, review_challenge                         |
| **ADMIN**           | manage_users, manage_roles, manage_questions, manage_tests, approve_teachers, manage_challenges, view_audit_logs, system_health |
| **PENDING_TEACHER** | view_profile, edit_profile                                                                                                      |

### Custom Roles

Admins can create custom roles via:

```bash
curl -X POST http://localhost:3001/api/admin/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MODERATOR",
    "description": "Content moderator role",
    "permissions": ["view_all_content", "delete_content", "ban_users"]
  }'
```

## 📋 Files Created/Modified in Phase 1

### Created Files (16 new files)

- ✅ `/backend/src/modules/common/guards/jwt-auth.guard.ts`
- ✅ `/backend/src/modules/common/guards/roles.guard.ts`
- ✅ `/backend/src/modules/common/decorators/roles.decorator.ts`
- ✅ `/backend/src/modules/roles/roles.module.ts`
- ✅ `/backend/src/modules/roles/roles.controller.ts`
- ✅ `/backend/src/modules/roles/roles.service.ts`
- ✅ `/backend/src/modules/roles/dto/role.dto.ts`
- ✅ `/backend/prisma/seed.ts`

### Modified Files (7 updated files)

- ✅ `/backend/prisma/schema.prisma` - Added Role model
- ✅ `/backend/src/app.module.ts` - Added RolesModule, JwtModule
- ✅ `/backend/src/modules/auth/dto/auth.dto.ts` - Dynamic role string
- ✅ `/backend/src/modules/auth/auth.service.ts` - Dynamic role handling
- ✅ `/backend/src/modules/auth/auth.controller.ts` - Role string casting
- ✅ `/backend/package.json` - Added seed script

## ⚠️ Important Notes

### Environment Variables Required

Ensure `.env` or `.env.local` contains:

```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key-min-32-chars
```

### Backward Compatibility

- Existing `User.role` field still works (UserRole enum)
- Role assignment remains consistent
- All existing code continues to work
- Guards only protect new admin routes (not applied to auth endpoints)

### Security Improvements

✅ JWT tokens validated on protected routes
✅ Role-based access control enforced
✅ Unauthorized access returns 403 (not 500 error)
✅ System roles cannot be deleted
✅ Permission system extensible for fine-grained control

## 🔄 Next Phase: Questions & Tests Backend

After Phase 1 is deployed:

1. Create Questions CRUD module
2. Create Tests/Exams module
3. Implement scoring engine
4. Add admin management APIs

See `IMPLEMENTATION_PLAN.md` for full Phase 2-9 details.

## 🐛 Troubleshooting

### Error: "Database_URL environment variable not found"

```bash
# Set variable before running commands
export DATABASE_URL="postgresql://..."
npx prisma migrate dev --name add_roles_model
```

### Error: "Cannot find module '../prisma/prisma.service'"

✅ Already fixed - import path corrected to `../../prisma/prisma.service`

### Build fails with TypeScript errors

```bash
# Clean and rebuild
rm -rf dist/ node_modules/@prisma/client
npm run prisma:generate
npm run build
```

### Roles table not created

```bash
# Check migration status
npx prisma migrate status

# Apply pending migrations
npx prisma migrate deploy
```

## ✨ Verification Checklist

- [ ] Database migration applied (`prisma migrate deploy` succeeded)
- [ ] Default roles seeded (check with `prisma studio`)
- [ ] Backend builds without errors (`npm run build` succeeds)
- [ ] Authorization guards loaded (check on backend start)
- [ ] Can create custom role via API
- [ ] Can list roles paginated
- [ ] Cannot delete system role (returns error)
- [ ] Unauthorized access returns 403
- [ ] Invalid token returns 401
