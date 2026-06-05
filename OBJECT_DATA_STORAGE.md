# Object Data Storage Strategy

Based on your architecture, here's how to store different types of data:

## 1. **Structured Data** (PostgreSQL + Prisma)

Already in your database:

```typescript
// Questions with rich content
model Question {
  id           String
  content_json Json      // Block-based content
  options_json Json?     // MCQ/Multiple correct
  answer_key   Json      // Answer structure
  solution_json Json?    // Step-by-step solution
}

// User and Test data
model User { /* ... */ }
model Test { /* ... */ }
model Attempt { /* ... */ }
```

**Use for:** Metadata, relationships, searchable text

## 2. **Binary Files** (Cloudflare R2 + Asset Model)

Store large files on R2, reference in database:

```typescript
model Asset {
  id         String    @id
  file_name  String
  file_size  Int
  mime_type  String
  cdn_url    String    @unique    // https://cdn.yourdomain.com/images/...
  created_at DateTime  @default(now())
}

// Link from Question
model Question {
  content_json Json  // [{ type: 'IMAGE', asset_id: 'asset-123' }]
}
```

**Upload Endpoints:**

- `POST /api/upload/image` → Images, diagrams
- `POST /api/upload/document` → PDFs, handouts
- `POST /api/upload/solution` → Solution images

## 3. **JSON Content Structure**

Questions store content as JSON blocks:

```json
{
  "blocks": [
    { "type": "TEXT", "content": "Solve this equation:" },
    { "type": "LATEX", "content": "x^2 + 2x + 1 = 0" },
    { "type": "IMAGE", "asset_id": "asset-123" },
    { "type": "CODE", "content": "function solve() { ... }" }
  ]
}
```

## 4. **Session Data** (Redis - Optional)

For temporary data during tests:

```typescript
// OTP storage (temporary)
model OtpRecord {
  email      String
  otp_code   String
  expires_at DateTime
}

// Refresh tokens
model RefreshToken {
  user_id  String
  token_hash String @unique
  expires_at DateTime
}
```

## 5. **Attachment/File References**

Questions can include multiple assets:

```typescript
// Option 1: Direct reference
const question = {
  id: "q-123",
  content: [{ type: "IMAGE", asset_id: "asset-456" }],
};

// Option 2: Array of asset IDs
const question = {
  id: "q-123",
  attachments: ["asset-456", "asset-789"],
};
```

## Data Flow Example

### Creating a Question with Image

**Frontend:**

```typescript
// 1. Upload image
const imageUrl = await uploadService.uploadImage(file);
// Returns: "https://cdn.yourdomain.com/images/timestamp-hash-name.jpg"

// 2. Get asset ID from backend
const asset = await getAssetByUrl(imageUrl);

// 3. Create question with asset reference
await createQuestion({
  title: "Geometry Problem",
  content_json: [
    { type: "TEXT", content: "Study the figure:" },
    { type: "IMAGE", asset_id: asset.id },
  ],
});
```

**Backend:**

1. Store file in R2 bucket
2. Create Asset record with CDN URL
3. Question references Asset by ID
4. Return CDN URL to frontend
5. Frontend displays image from CDN

### Database Size Estimation

| Data Type             | Size    | Examples                  |
| --------------------- | ------- | ------------------------- |
| User record           | ~1KB    | 1 million users = 1GB     |
| Question record       | ~10KB   | 10K questions = 100MB     |
| Attempt record        | ~5KB    | 100K attempts = 500MB     |
| **Images (R2)**       | 1MB avg | 1GB storage = 1000 images |
| **Videos (Optional)** | 100MB   | Not in current design     |

## Scalability

### Small Scale (< 10K users)

- Railway: $5-15/month (512MB RAM)
- PostgreSQL: $15/month (managed)
- R2: Minimal cost (~$0.15/month for 10GB)
- **Total: ~$20-30/month**

### Medium Scale (10K - 100K users)

- Railway: $25/month (2GB RAM)
- PostgreSQL: $50/month (50GB storage)
- R2: ~$1-5/month (50-100GB)
- **Total: ~$75-80/month**

### Large Scale (> 100K users)

Consider:

- Database: PostgreSQL read replicas
- Cache: Redis cluster
- Storage: Multiple R2 buckets with optimization
- CDN: Cloudflare full setup
- **Total: $200+/month**

## Migration Path (If needed)

If data grows too large:

1. **Archives old questions** to cheaper storage
2. **Compress images** with Cloudflare Image Optimization
3. **Add caching layer** with Redis
4. **Shard database** if > 1 million questions
5. **Use S3 instead of R2** for more features (but more expensive)

## Summary

```
┌─────────────────────────┐
│   Frontend (Vercel)     │
│  Next.js + React        │
└──────────────┬──────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼──────────┐  ┌──────▼────────────┐
│ Rails API    │  │ File Upload API   │
│ (NestJS)     │  │ (UploadService)   │
└───┬──────────┘  └──────┬────────────┘
    │                     │
    │          ┌──────────┴──────┐
    │          │                 │
┌───▼──────────▼──┐        ┌─────▼──────┐
│  PostgreSQL     │        │ Cloudflare │
│  (Structured)   │        │    R2      │
└─────────────────┘        └────────────┘
     Users
     Questions
     Tests
     Attempts          Images, PDFs, Documents
```

## Implementation Checklist

- [ ] Setup R2 bucket with custom domain
- [ ] Install AWS SDK (`@aws-sdk/client-s3`)
- [ ] Create `UploadService` in backend
- [ ] Create `UploadController` with endpoints
- [ ] Import `UploadModule` in AppModule
- [ ] Create `FileUpload` component for frontend
- [ ] Test upload locally
- [ ] Deploy to Railway
- [ ] Update environment variables
- [ ] Test production uploads
- [ ] Setup image optimization (optional)
