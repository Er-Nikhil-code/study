// src/modules/upload/upload.service.ts
import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private s3Client: S3Client;

  constructor(private prisma: PrismaService) {
    this.s3Client = new S3Client({
      region: "auto",
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    });
  }

  async uploadFile(file: any, context?: string): Promise<string> {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    // Validate file size (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException("File size exceeds 50MB limit");
    }

    // Validate mime type
    const ALLOWED_TYPES = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
    ];
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
      );
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const key = `${context || "uploads"}/${timestamp}-${random}-${file.originalname}`;

    try {
      // Upload to R2
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          "original-name": file.originalname,
          "upload-date": new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      // Store metadata in database (storing the raw S3 key in cdn_url field)
      const asset = await this.prisma.asset.create({
        data: {
          file_name: file.originalname,
          file_size: file.size,
          mime_type: file.mimetype,
          cdn_url: key, // Store raw key here since public URLs are removed
        },
      });

      return asset.cdn_url;
    } catch (error) {
      console.error("File upload error:", error);
      throw new BadRequestException("Failed to upload file");
    }
  }

  async deleteFile(keyOrUrl: string): Promise<void> {
    try {
      // If it's a legacy public URL, try to extract the key
      let key = keyOrUrl;
      if (keyOrUrl.startsWith("http")) {
         try {
           const urlObj = new URL(keyOrUrl);
           key = urlObj.pathname.substring(1); // remove leading slash
         } catch(e) {}
      }

      const command = new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      });

      await this.s3Client.send(command);

      // Delete from database
      await this.prisma.asset.deleteMany({
        where: { cdn_url: keyOrUrl },
      });
    } catch (error) {
      console.error("File deletion error:", error);
      throw new BadRequestException("Failed to delete file");
    }
  }

  async getAssets() {
    return this.prisma.asset.findMany({
      orderBy: { created_at: "desc" },
    });
  }

  /**
   * Generates a temporary, 5-minute GET URL for an object.
   */
  async generatePresignedUrl(key: string): Promise<string> {
    try {
      // If the key is somehow a legacy HTTP URL, return it as-is to avoid breaking old assets.
      if (key.startsWith("http")) {
        return key;
      }

      const command = new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      });

      // Expires in 5 minutes (300 seconds)
      return await getSignedUrl(this.s3Client, command, { expiresIn: 300 });
    } catch (error) {
      console.error("Failed to generate presigned URL:", error);
      throw new BadRequestException("Could not sign URL");
    }
  }
}
