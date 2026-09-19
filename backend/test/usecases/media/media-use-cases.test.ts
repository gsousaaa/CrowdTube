import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AppError } from "../../../src/errors/app-error";
import { CreateMediaUploadUrlUseCase } from "../../../src/usecases/media/create-media-upload-url-use-case";
import { GetMediaUseCase } from "../../../src/usecases/media/get-media-use-case";
import type {
  CreateMediaReadUrlInput,
  CreateMediaUploadUrlInput,
  MediaStorage,
} from "../../../src/usecases/media/media-storage";

class MediaStorageStub implements MediaStorage {
  uploadInput?: CreateMediaUploadUrlInput;
  readInput?: CreateMediaReadUrlInput;

  createUploadUrl(input: CreateMediaUploadUrlInput): Promise<string> {
    this.uploadInput = input;
    return Promise.resolve("https://s3.example.com/upload?signature=test");
  }

  createReadUrl(input: CreateMediaReadUrlInput): Promise<string> {
    this.readInput = input;
    return Promise.resolve("https://s3.example.com/media?signature=test");
  }
}

const now = new Date("2026-09-19T12:00:00.000Z");
const userId = "c5b54171-8094-4235-a52b-7500633642d7";
const mediaId = "69cc5f83-e496-4226-8622-daba1b38c21e";

describe("media use cases", () => {
  it("creates an upload URL in the authenticated user namespace", async () => {
    const storage = new MediaStorageStub();
    const useCase = new CreateMediaUploadUrlUseCase(
      storage,
      300,
      () => now,
      () => mediaId,
    );

    const result = await useCase.execute({
      userId,
      fileName: "Foto de Perfil.png",
      contentType: "image/png",
      purpose: "profile-avatar",
    });

    const expectedKey =
      `users/${userId}/profile-avatar/${mediaId}-foto-de-perfil.png`;
    assert.equal(result.objectKey, expectedKey);
    assert.deepEqual(storage.uploadInput, {
      objectKey: expectedKey,
      contentType: "image/png",
      expiresInSeconds: 300,
    });
    assert.equal(result.expiresAt, "2026-09-19T12:05:00.000Z");
  });

  it("creates a renewable read URL for a public CrowdTube media key", async () => {
    const storage = new MediaStorageStub();
    const useCase = new GetMediaUseCase(storage, 300, () => now);
    const objectKey =
      `users/${userId}/campaign-image/${mediaId}-campaign-cover.webp`;

    const result = await useCase.execute({ objectKey });

    assert.equal(result.objectKey, objectKey);
    assert.deepEqual(storage.readInput, {
      objectKey,
      expiresInSeconds: 300,
    });
    assert.equal(result.expiresAt, "2026-09-19T12:05:00.000Z");
  });

  it("does not sign an object outside the public media namespace", async () => {
    const storage = new MediaStorageStub();
    const useCase = new GetMediaUseCase(storage, 300);

    await assert.rejects(
      useCase.execute({ objectKey: "private/internal-document.pdf" }),
      (error: unknown) =>
        error instanceof AppError && error.code === "INVALID_MEDIA_KEY",
    );
    assert.equal(storage.readInput, undefined);
  });
});
