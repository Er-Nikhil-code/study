# Railway Deployment Guide for NestJS Backend

## Part 1: Deploy Backend to Railway

### Step 1: Setup Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create a new project

### Step 2: Connect GitHub Repository

```bash
# In Railway Dashboard:
# 1. Click "New" → "GitHub Repo"
# 2. Select your repository
# 3. Give Railway access to your GitHub
```

### Step 3: Configure Environment Variables in Railway

Add these variables in Railway Dashboard (Variables tab):

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=3600

# Redis (if using)
REDIS_URL=redis://user:password@host:port

# Email Service (Brevo)
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@yourdomain.com

# Cloudflare R2 (for file storage)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-bucket.r2.cloudflarecustomdomain.com

# API
NODE_ENV=production
API_PORT=3001
```

### Step 4: Setup PostgreSQL on Railway

1. In Railway Dashboard, click "New" → "Database" → "PostgreSQL"
2. Railway auto-generates `DATABASE_URL` in Variables
3. Get connection string: `postgresql://user:pass@host:port/db`

### Step 5: Deploy Instructions

**Update your backend package.json:**

```json
{
  "scripts": {
    "start": "node dist/main",
    "build": "tsc",
    "dev": "ts-node src/main.ts",
    "prisma:generate": "prisma generate",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prestart": "npm run prisma:generate && npm run prisma:migrate:deploy"
  }
}
```

**Create Procfile (optional, Railway auto-detects):**

```procfile
web: npm run prestart && npm start
```

**Update your main.ts to use PORT env variable:**

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  console.log(`Server running on port ${port}`);
}
bootstrap();
```

### Step 6: Deploy

```bash
# Railway auto-deploys on git push to main
git add .
git commit -m "Deploy to Railway"
git push origin main

# Or manually deploy:
# In Railway Dashboard → Click "Deploy" button
```

### Step 7: Get Your Backend URL

Railway provides a public URL: `https://your-project.up.railway.app`

Update your frontend `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-project.up.railway.app/api
```

---

## Part 2: Object/File Storage Solutions

### Your Current Setup

You have an `Asset` model storing file metadata with Cloudflare R2 URLs:

```prisma
model Asset {
  id              String    @id @default(cuid())
  file_name       String
  file_size       Int
  mime_type       String
  cdn_url         String    @unique  // Cloudflare R2 CDN URL
  created_at      DateTime  @default(now())
}
```

### Option 1: Cloudflare R2 (RECOMMENDED)

**Best for:** Cost-effective, unlimited CDN, works great with frontend

**Pricing:** $0.015/GB storage, $0.02/GB download

**Setup:**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to R2 → Create bucket
3. Generate API token with R2 permissions
4. Install SDK:

```bash
npm install @aws-sdk/client-s3 aws-sdk
```

**Service for uploads (backend):**

```typescript
// src/services/file-upload.service.ts
import { Injectable } from "@nestjs/common";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class FileUploadService {
  private s3Client: S3Client;

  constructor(private prisma: PrismaService) {
    this.s3Client = new S3Client({
      region: "auto",
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const key = `${Date.now()}-${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    const cdnUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    // Store metadata in database
    await this.prisma.asset.create({
      data: {
        file_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
        cdn_url: cdnUrl,
      },
    });

    return cdnUrl;
  }
}
```

### Option 2: AWS S3

**Best for:** Enterprise, more features

**Pricing:** $0.023/GB storage, more expensive downloads

```bash
npm install @aws-sdk/client-s3
```

Setup similar to R2 but use AWS S3 credentials.

### Option 3: Supabase Storage

**Best for:** Integrated with PostgreSQL

**Pricing:** $5/month for 100GB

1. Create Supabase project
2. Go to Storage section
3. Create bucket

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async uploadFile(file: Express.Multer.File) {
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(`${Date.now()}-${file.originalname}`, file.buffer);

  if (error) throw error;
  return data.fullPath;
}
```

### Option 4: Local File System (Development Only)

```typescript
import { writeFile } from 'fs/promises';
import { join } from 'path';

async uploadFile(file: Express.Multer.File) {
  const uploadDir = join(process.cwd(), 'uploads');
  const filePath = join(uploadDir, file.originalname);

  await writeFile(filePath, file.buffer);
  return `/uploads/${file.originalname}`;
}
```

---

## Part 3: Data Storage Strategy

### JSON Data (Already in your schema)

You're storing rich content as JSON:

```prisma
model Question {
  content_json    Json      // Block model
  options_json    Json?     // MCQ options
  answer_key      Json      // Answer structure
  solution_json   Json?     // Step-by-step solution
}
```

**Example structure:**

```typescript
interface ContentBlock {
  type: "TEXT" | "LATEX" | "IMAGE" | "CODE";
  content?: string;
  asset_id?: string; // Reference to Asset model
  metadata?: Record<string, any>;
}

const questionContent: ContentBlock[] = [
  { type: "TEXT", content: "Solve this equation:" },
  { type: "LATEX", content: "x^2 + 2x + 1 = 0" },
  { type: "IMAGE", asset_id: "asset-123" },
];
```

### Binary Data (Files)

1. Store binary in cloud storage (R2/S3)
2. Store reference (URL + metadata) in Asset model
3. Link assets in Question via `asset_id`

---

## Complete Deployment Checklist

- [ ] Create Railway account and project
- [ ] Connect GitHub repository
- [ ] Setup PostgreSQL in Railway
- [ ] Configure environment variables
- [ ] Setup Cloudflare R2 bucket
- [ ] Update backend code for production
- [ ] Deploy to Railway
- [ ] Test API endpoints
- [ ] Update frontend API URL
- [ ] Setup custom domain (optional)

---

## Monitoring & Logs in Railway

```bash
# View logs in Railway Dashboard
# Deployments tab → Click build → View logs

# Or use Railway CLI:
railway login
railway link  # Select project
railway logs  # Stream live logs
```

---

## Cost Estimate (Monthly)

| Service                     | Cost                   |
| --------------------------- | ---------------------- |
| Railway (512MB RAM)         | $5                     |
| PostgreSQL (Managed)        | $15                    |
| Cloudflare R2 (10GB)        | $0.15                  |
| Brevo Email (transactional) | Free ($0.01 per email) |
| **Total**                   | **~$20/month**         |

---

## Quick Links

- Railway Docs: https://docs.railway.app
- Cloudflare R2: https://www.cloudflare.com/products/r2/
- Prisma Docs: https://www.prisma.io/docs
- NestJS Docs: https://docs.nestjs.com
