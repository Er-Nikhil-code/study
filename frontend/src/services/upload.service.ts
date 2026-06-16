// frontend/src/services/upload.service.ts
import { api } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

class UploadService {
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(`/upload/image`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.url;
  }

  async uploadDocument(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(`/upload/document`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.url;
  }

  async uploadSolution(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(`/upload/solution`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.url;
  }

  async getAssets() {
    const response = await api.get(`/upload/assets`);
    return response.data;
  }

  async deleteAsset(assetId: string) {
    const response = await api.delete(`/upload/assets/${assetId}`);
    return response.data;
  }
}

export default new UploadService();
