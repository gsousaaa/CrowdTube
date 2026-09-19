import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { makeCreateMediaUploadUrlAdapter } from "../../../src/adapters/media/create-media-upload-url-adapter";
import { makeGetMediaAdapter } from "../../../src/adapters/media/get-media-adapter";
import { AppError } from "../../../src/errors/app-error";

const userId = "c5b54171-8094-4235-a52b-7500633642d7";
const walletAddress = "0x0000000000000000000000000000000000000001";

function makeRequest(body: unknown, query: unknown, authenticated = true) {
  return {
    body,
    params: {},
    query,
    headers: {},
    cookies: {},
    authenticatedUser: authenticated
      ? {
          sessionId: "session-id",
          userId,
          walletId: "wallet-id",
          walletAddress,
        }
      : null,
  };
}

describe("media adapters", () => {
  it("requires authentication to create an upload URL", async () => {
    const adapter = makeCreateMediaUploadUrlAdapter({
      createMediaUploadUrl: {
        execute: () => Promise.reject(new Error("should not execute")),
      },
    });

    await assert.rejects(
      adapter(makeRequest({}, {}, false)),
      (error: unknown) =>
        error instanceof AppError && error.code === "UNAUTHENTICATED",
    );
  });

  it("uses the authenticated user when creating an upload URL", async () => {
    const adapter = makeCreateMediaUploadUrlAdapter({
      createMediaUploadUrl: {
        execute: (input) => {
          assert.equal(input.userId, userId);
          assert.equal(input.purpose, "campaign-image");
          return Promise.resolve({
            uploadUrl: "https://s3.example.com/upload?signature=test",
            objectKey: `users/${userId}/campaign-image/media-id-cover.jpg`,
            contentType: "image/jpeg",
            expiresIn: 300,
            expiresAt: "2026-09-19T12:05:00.000Z",
          });
        },
      },
    });

    const response = await adapter(
      makeRequest(
        {
          fileName: "cover.jpg",
          contentType: "image/jpeg",
          purpose: "campaign-image",
        },
        {},
      ),
    );

    assert.equal(response.statusCode, 201);
  });

  it("allows public media reads without an authenticated session", async () => {
    const objectKey =
      "users/c5b54171-8094-4235-a52b-7500633642d7/profile-avatar/" +
      "69cc5f83-e496-4226-8622-daba1b38c21e-avatar.png";
    const adapter = makeGetMediaAdapter({
      getMedia: {
        execute: (input) =>
          Promise.resolve({
            mediaUrl: "https://s3.example.com/media?signature=test",
            objectKey: input.objectKey,
            expiresIn: 300,
            expiresAt: "2026-09-19T12:05:00.000Z",
          }),
      },
    });

    const response = await adapter(
      makeRequest(undefined, { objectKey }, false),
    );

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.objectKey, objectKey);
  });
});
