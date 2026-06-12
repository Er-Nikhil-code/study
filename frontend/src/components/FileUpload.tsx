// frontend/src/components/FileUpload.tsx
"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader } from "lucide-react";
import uploadService from "@/services/upload.service";

interface FileUploadProps {
  onUploadSuccess?: (url: string) => void;
  accept?: string;
  type?: "image" | "document" | "solution";
  maxSize?: number; // in MB
}

export function FileUpload({
  onUploadSuccess,
  accept = "image/*",
  type = "image",
  maxSize = 50,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError("");

    // Check file size
    if (selectedFile.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    setFile(selectedFile);

    // Create preview for images
    if (type === "image") {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let url: string;

      if (type === "image") {
        url = await uploadService.uploadImage(file);
      } else if (type === "document") {
        url = await uploadService.uploadDocument(file);
      } else {
        url = await uploadService.uploadSolution(file);
      }

      setUploadedUrl(url);
      onUploadSuccess?.(url);
      setFile(null);
      setPreview(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setError("");
    setUploadedUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Show uploaded result
  if (uploadedUrl) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-800">
              Upload successful
            </p>
            <p className="text-sm text-green-700 mt-1 break-all">
              {uploadedUrl}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="p-2 hover:bg-green-100 rounded"
          >
            <X className="w-4 h-4 text-green-600" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-red-400 transition">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={loading}
        />

        {preview ? (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Preview"
              className="max-h-48 mx-auto rounded"
            />
            <p className="text-sm text-gray-600 text-center">{file?.name}</p>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="text-center cursor-pointer"
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500">Max {maxSize}MB</p>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {file && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleUpload}
            disabled={loading}
            className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {loading && null}
            {loading ? "Uploading..." : "Upload"}
          </button>
          <button
            onClick={handleReset}
            disabled={loading}
            className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
