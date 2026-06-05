// src/modules/upload/upload.service.ts
import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
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

      // Generate CDN URL
      const cdnUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

      // Store metadata in database
      const asset = await this.prisma.asset.create({
        data: {
          file_name: file.originalname,
          file_size: file.size,
          mime_type: file.mimetype,
          cdn_url: cdnUrl,
        },
      });

      return asset.cdn_url;
    } catch (error) {
      console.error("File upload error:", error);
      throw new BadRequestException("Failed to upload file");
    }
  }

  async deleteFile(cdnUrl: string): Promise<void> {
    try {
      // Extract key from CDN URL
      const baseUrl = process.env.R2_PUBLIC_URL!;
      const key = cdnUrl.replace(`${baseUrl}/`, "");

      const command = new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      });

      await this.s3Client.send(command);

      // Delete from database
      await this.prisma.asset.delete({
        where: { cdn_url: cdnUrl },
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
}
