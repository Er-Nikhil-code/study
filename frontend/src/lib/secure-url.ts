// frontend/src/lib/secure-url.ts

/**
 * Transforms a raw S3 object key or legacy URL into an authenticated proxy URL.
 * The proxy URL automatically attaches the current JWT token as a query parameter
 * so that the backend can generate a temporary presigned URL for secure access.
 */
export function getSecureUrl(key: string | null | undefined): string {
  if (!key) return "";

  // If it's already a full HTTP URL (legacy files), return it as is
  if (key.startsWith("http://") || key.startsWith("https://")) {
    // We can also route it through the secure endpoint if we want to support legacy,
    // but typically it's better to let legacy URLs load directly or fail.
    // However, the backend is configured to let legacy URLs pass through generatePresignedUrl unharmed.
  }

  let token = "";
  if (typeof window !== "undefined") {
    token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || "";
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  
  // Return the proxy endpoint with the token attached.
  // The backend will verify the token and redirect to the presigned R2 URL.
  return `${apiUrl}/upload/secure?key=${encodeURIComponent(key)}&token=${encodeURIComponent(token)}`;
}
