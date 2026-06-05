# Quick Setup: Railway + Cloudflare R2

## Step 1: Setup Cloudflare R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. **R2** → **Create bucket**
3. Name: `study-platform` (or your choice)
4. **Create bucket**

## Step 2: Generate R2 API Token

1. **R2** → **Settings** (or your bucket → **Settings**)
2. Scroll to **API Tokens**
3. **Create API token**
4. Select scope: **Object Read & Write**
5. **Create API token**
6. Copy and save:
   - Access Key ID
   - Secret Access Key

## Step 3: Setup R2 Custom Domain (CDN)

1. In your bucket → **Settings**
2. Scroll to **Custom Domains**
3. Click **Connect Domain**
4. Enter subdomain: `cdn.yourdomain.com` (or `r2.yourdomain.com`)
5. Verify DNS record (Cloudflare auto-creates it)
6. Note the public URL

## Step 4: Update Backend Dependencies

```bash
cd backend
npm install @aws-sdk/client-s3 @aws-sdk/credential-providers
npm install -D @types/express multer @types/multer
```

## Step 5: Create .env.production (Railway)

Copy this to Railway Dashboard → Variables:

```env
# Database (Railway auto-generates this)
DATABASE_URL=

# Auth
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRATION=3600

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=study-platform
R2_PUBLIC_URL=https://cdn.yourdomain.com

# Email (Brevo)
BREVO_API_KEY=your-api-key
BREVO_SENDER_EMAIL=noreply@yourdomain.com

# App
NODE_ENV=production
API_PORT=3001
```

## Step 6: Update Backend app.module.ts

```typescript
import { Module } from "@nestjs/common";
import { AuthModule } from "./modules/auth/auth.module";
import { UploadModule } from "./modules/upload/upload.module";
// ... other imports

@Module({
  imports: [
    AuthModule,
    UploadModule, // Add this
    // ... other modules
  ],
})
export class AppModule {}
```

## Step 7: Deploy to Railway

```bash
# Commit changes
git add .
git commit -m "Add file upload with R2 storage"
git push origin main

# Railway auto-deploys on git push
# Check Dashboard → Deployments tab
```

## Step 8: Test Upload API

```bash
curl -X POST http://localhost:3001/api/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.jpg"
```

Response:

```json
{
  "success": true,
  "url": "https://cdn.yourdomain.com/images/1717598400000-abc123-test.jpg"
}
```

## Step 9: Update Frontend API URL

**frontend/.env.production:**

```env
NEXT_PUBLIC_API_URL=https://your-railway-app.up.railway.app/api
```

Or if using custom domain:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

## Usage in Your Components

```typescript
import { FileUpload } from '@/components/FileUpload';

export function QuestionForm() {
  return (
    <FileUpload
      type="image"
      onUploadSuccess={(url) => {
        console.log('Uploaded:', url);
        // Store URL in your form state
      }}
    />
  );
}
```

## Troubleshooting

### "R2_ACCOUNT_ID not found"

- Check Railway Variables tab
- Make sure you copied Account ID correctly

### Upload returns 401

- Check JWT token is valid
- Verify Authorization header in request

### CORS errors

- Add CORS headers to your NestJS app:

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

### File shows 404 on CDN

- Check R2 custom domain is connected
- Verify file exists in R2 bucket
- Wait ~60s for DNS to propagate

## Cost Breakdown (Monthly)

| Service          | Cost       | Notes                  |
| ---------------- | ---------- | ---------------------- |
| Railway Compute  | $5-15      | Depends on RAM         |
| Railway Database | $15        | Managed PostgreSQL     |
| Cloudflare R2    | $0.015/GB  | 1GB = $0.015           |
| R2 Downloads     | $0.02/GB   | CDN traffic            |
| **Estimate**     | **$20-25** | For small-medium usage |

## Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Setup R2 bucket and CDN
3. ✅ Implement file uploads
4. Setup domain + SSL (Cloudflare)
5. Add image optimization (Cloudflare Image Optimization)
6. Monitor logs and errors (Railway + Sentry)

## Useful Links

- [Railway Docs](https://docs.railway.app)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/)
- [NestJS File Upload](https://docs.nestjs.com/techniques/file-upload)
