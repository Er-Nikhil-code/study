import {
  Controller,
  Post,
  Delete,
  Get,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Param,
  UseGuards,
  Query,
  Res,
  Req,
} from "@nestjs/common";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { UploadService } from "./upload.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

@Controller("upload")
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post("image")
  @UseInterceptors(FileInterceptor("file"))
  async uploadImage(@UploadedFile() file: any) {
    const url = await this.uploadService.uploadFile(file, "images");
    return { success: true, url };
  }

  @Post("document")
  @UseInterceptors(FileInterceptor("file"))
  async uploadDocument(@UploadedFile() file: any) {
    const url = await this.uploadService.uploadFile(file, "documents");
    return { success: true, url };
  }

  @Post("solution")
  @UseInterceptors(FileInterceptor("file"))
  async uploadSolution(@UploadedFile() file: any) {
    const url = await this.uploadService.uploadFile(file, "solutions");
    return { success: true, url };
  }

  @Get("secure")
  async getSecureUrl(@Query("key") key: string, @Req() req: any, @Res() res: Response) {
    if (!key) {
      throw new BadRequestException("Key is required");
    }

    try {
      const range = req.headers.range;
      const fileStreamResponse = await this.uploadService.getFileStream(key, range);
      
      if (!fileStreamResponse) {
        // It's a legacy public URL, redirect to it
        return res.redirect(302, key);
      }

      res.set({
        "Content-Type": fileStreamResponse.ContentType || "application/octet-stream",
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      });

      if (fileStreamResponse.ContentLength) {
        res.set("Content-Length", fileStreamResponse.ContentLength.toString());
      }

      if (fileStreamResponse.ContentRange) {
        res.status(206);
        res.set("Content-Range", fileStreamResponse.ContentRange);
      } else {
        res.status(200);
      }

      // Pipe the S3 readable stream to the response
      (fileStreamResponse.Body as any).pipe(res);
    } catch (err) {
      console.error("Secure URL streaming failed:", err);
      // Fallback to presigned URL if streaming fails
      const presignedUrl = await this.uploadService.generatePresignedUrl(key);
      return res.redirect(302, presignedUrl);
    }
  }

  @Get("assets")
  async getAssets() {
    return this.uploadService.getAssets();
  }

  @Delete("assets/:assetId")
  async deleteAsset(@Param("assetId") assetId: string) {
    // In practice, fetch the asset first to get the CDN URL
    const asset = await this.uploadService.getAssets();
    const targetAsset = asset.find((a: any) => a.id === assetId);

    if (!targetAsset) {
      throw new BadRequestException("Asset not found");
    }

    await this.uploadService.deleteFile(targetAsset.cdn_url);
    return { success: true, message: "Asset deleted" };
  }
}
