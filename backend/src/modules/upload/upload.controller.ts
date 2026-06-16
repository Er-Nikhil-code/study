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
  async getSecureUrl(@Query("key") key: string, @Res() res: Response) {
    if (!key) {
      throw new BadRequestException("Key is required");
    }
    const presignedUrl = await this.uploadService.generatePresignedUrl(key);
    // Redirect the browser directly to the securely generated R2 URL
    return res.redirect(302, presignedUrl);
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
