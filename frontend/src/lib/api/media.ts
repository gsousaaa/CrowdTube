import { apiRequest } from "./client";

type MediaPurpose = "profile-avatar" | "campaign-image";

export type MediaReadUrl = {
  mediaUrl: string;
  objectKey: string;
  expiresAt: string;
};

export class MediaUploadError extends Error {
  constructor(readonly code: "INVALID_TYPE" | "UPLOAD_FAILED") {
    super(code);
    this.name = "MediaUploadError";
  }
}

async function uploadImage(
  file: File,
  purpose: MediaPurpose,
): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new MediaUploadError("INVALID_TYPE");
  }

  const signedUpload = await apiRequest<{
    uploadUrl: string;
    objectKey: string;
    contentType: string;
  }>("/uploads/media", {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      purpose,
    }),
  });

  // The API signs the PUT; the file itself goes directly from the browser to S3.
  const uploadResponse = await fetch(signedUpload.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": signedUpload.contentType },
    body: file,
    signal: AbortSignal.timeout(60_000),
  });
  if (!uploadResponse.ok) {
    throw new MediaUploadError("UPLOAD_FAILED");
  }

  return signedUpload.objectKey;
}

export function uploadCampaignImage(file: File): Promise<string> {
  return uploadImage(file, "campaign-image");
}

export function uploadProfileAvatar(file: File): Promise<string> {
  return uploadImage(file, "profile-avatar");
}

export function getMediaUrl(objectKey: string): Promise<MediaReadUrl> {
  return apiRequest<MediaReadUrl>(
    `/uploads/media?objectKey=${encodeURIComponent(objectKey)}`,
  );
}
