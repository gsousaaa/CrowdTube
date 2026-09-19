import { randomUUID } from "node:crypto";

import type { MediaStorage } from "./media-storage";

export const mediaPurposes = ["profile-avatar", "campaign-image"] as const;
export type MediaPurpose = (typeof mediaPurposes)[number];

const extensionByContentType = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type SupportedMediaContentType = keyof typeof extensionByContentType;

export type CreateMediaUploadUrlInput = {
  userId: string;
  fileName: string;
  contentType: SupportedMediaContentType;
  purpose: MediaPurpose;
};

export type MediaUploadUrl = {
  uploadUrl: string;
  objectKey: string;
  contentType: SupportedMediaContentType;
  expiresIn: number;
  expiresAt: string;
};

function sanitizeFileName(fileName: string): string {
  const baseName = fileName.replace(/\.[^.]+$/, "");
  const sanitized = baseName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  return sanitized || "media";
}

export class CreateMediaUploadUrlUseCase {
  constructor(
    private readonly mediaStorage: MediaStorage,
    private readonly expiresInSeconds: number,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = randomUUID,
  ) {}

  async execute(input: CreateMediaUploadUrlInput): Promise<MediaUploadUrl> {
    const extension = extensionByContentType[input.contentType];
    const safeFileName = sanitizeFileName(input.fileName);
    const objectKey = [
      "users",
      input.userId,
      input.purpose,
      `${this.createId()}-${safeFileName}.${extension}`,
    ].join("/");
    const uploadUrl = await this.mediaStorage.createUploadUrl({
      objectKey,
      contentType: input.contentType,
      expiresInSeconds: this.expiresInSeconds,
    });

    return {
      uploadUrl,
      objectKey,
      contentType: input.contentType,
      expiresIn: this.expiresInSeconds,
      expiresAt: new Date(
        this.now().getTime() + this.expiresInSeconds * 1_000,
      ).toISOString(),
    };
  }
}
