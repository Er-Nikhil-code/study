import {
  Controller,
  Post,
  Delete,
  Get,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Param,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UploadService } from "./upload.service";

@Controller("api/upload")
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
