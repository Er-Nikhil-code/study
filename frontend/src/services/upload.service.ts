// frontend/src/services/upload.service.ts
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

class UploadService {
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(`${API_URL}/upload/image`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    return response.data.url;
  }

  async uploadDocument(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(`${API_URL}/upload/document`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    return response.data.url;
  }

  async uploadSolution(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(`${API_URL}/upload/solution`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    return response.data.url;
  }

  async getAssets() {
    const response = await axios.get(`${API_URL}/upload/assets`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    return response.data;
  }

  async deleteAsset(assetId: string) {
    const response = await axios.delete(`${API_URL}/upload/assets/${assetId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    return response.data;
  }
}

export default new UploadService();
