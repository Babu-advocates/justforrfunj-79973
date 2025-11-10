import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://iyizrpyjtkmpefaqzeth.supabase.co";

export interface UploadResult {
  success: boolean;
  path: string;
  publicUrl: string;
  size: number;
}

export interface DownloadResult {
  success: boolean;
  signedUrl: string;
}

/**
 * Upload a file to Cloudflare R2 storage
 * Bucket is always "babuadvocate" with directories: application-documents/, opinion-documents/, query-attachments/, signed-documents/
 * @param bucket - Always "babuadvocate" (kept for backward compatibility)
 * @param filePath - The full path including directory (e.g., 'application-documents/APP123/file.pdf')
 * @param file - The File object to upload
 * @returns Upload result with public URL
 */
export async function uploadToR2(
  bucket: string,
  filePath: string,
  file: File
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  // Some deployments of the edge function expect a separate 'folder' field. Derive it from filePath.
  const derivedFolder = filePath.includes('/') ? filePath.split('/')[0] : '';
  if (derivedFolder) formData.append('folder', derivedFolder);
  formData.append('filePath', filePath);

  const { data, error } = await supabase.functions.invoke('r2-upload', {
    body: formData,
  });

  if (error) {
    console.error('Error uploading to R2:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  return data as UploadResult;
}

/**
 * Get a signed URL for downloading a file from Cloudflare R2
 * Bucket is always "babuadvocate" with directories: application-documents/, opinion-documents/, query-attachments/, signed-documents/
 * @param bucket - Always "babuadvocate" (kept for backward compatibility)
 * @param filePath - The full path including directory (e.g., 'application-documents/APP123/file.pdf')
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL for download
 */
export async function getR2SignedUrl(
  bucket: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('r2-download', {
    body: { filePath, expiresIn },
  });

  if (error) {
    console.error('Error getting signed URL from R2:', error);
    throw new Error(`Failed to get signed URL: ${error.message}`);
  }

  const result = data as DownloadResult;
  return result.signedUrl;
}

/**
 * Helper to get public URL (for public buckets)
 * Note: For private buckets, use getR2SignedUrl instead
 */
export function getR2PublicUrl(bucket: string, filePath: string): string {
  // This assumes you've configured a public domain for your R2 bucket
  // You'll need to update this with your actual R2 public domain
  return `https://pub-yourdomain.r2.dev/${bucket}/${filePath}`;
}
