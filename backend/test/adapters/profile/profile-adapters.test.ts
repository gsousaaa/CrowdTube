import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { makeGetProfileAdapter } from "../../../src/adapters/profile/get-profile-adapter";
import { makeUpdateProfileAdapter } from "../../../src/adapters/profile/update-profile-adapter";
import { AppError } from "../../../src/errors/app-error";
import type { UpdateProfileInput } from "../../../src/usecases/profile/update-profile-use-case";

const userId = "c5b54171-8094-4235-a52b-7500633642d7";
const walletAddress = "0x0000000000000000000000000000000000000001";

function makeRequest(body: unknown) {
  return {
    body,
    params: {},
    query: {},
    headers: {},
    cookies: {},
    authenticatedUser: {
      sessionId: "session-id",
      userId,
      walletId: "wallet-id",
      walletAddress,
    },
  };
}

const profile = {
  id: userId,
  displayName: "Creator",
  bio: null,
  youtubeChannelUrl: null,
  avatarObjectKey: null,
  authenticatedWalletAddress: walletAddress,
  wallets: [],
};

describe("profile adapters", () => {
  it("gets the profile using only the authenticated identity", async () => {
    const adapter = makeGetProfileAdapter({
      getProfile: {
        execute: (input) => {
          assert.deepEqual(input, {
            userId,
            authenticatedWalletAddress: walletAddress,
          });
          return Promise.resolve(profile);
        },
      },
    });

    const response = await adapter(makeRequest(undefined));

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, profile);
  });

  it("validates a partial update and uses the authenticated identity", async () => {
    let receivedInput: UpdateProfileInput | undefined;
    const adapter = makeUpdateProfileAdapter({
      updateProfile: {
        execute: (input) => {
          receivedInput = input;
          return Promise.resolve({ ...profile, displayName: input.displayName ?? null });
        },
      },
    });

    const response = await adapter(
      makeRequest({
        displayName: "  New creator  ",
        youtubeChannelUrl: "https://www.youtube.com/@creator",
        avatarObjectKey:
          `users/${userId}/profile-avatar/` +
          "69cc5f83-e496-4226-8622-daba1b38c21e-avatar.png",
      }),
    );

    assert.equal(response.statusCode, 200);
    assert.deepEqual(receivedInput, {
      userId,
      authenticatedWalletAddress: walletAddress,
      displayName: "New creator",
      youtubeChannelUrl: "https://www.youtube.com/@creator",
      avatarObjectKey:
        `users/${userId}/profile-avatar/` +
        "69cc5f83-e496-4226-8622-daba1b38c21e-avatar.png",
    });
  });

  it("rejects an empty update", async () => {
    const adapter = makeUpdateProfileAdapter({
      updateProfile: {
        execute: () => Promise.resolve(profile),
      },
    });

    await assert.rejects(
      adapter(makeRequest({})),
      (error: unknown) =>
        error instanceof AppError && error.code === "INVALID_PROFILE_DATA",
    );
  });

  it("rejects a URL that is not from YouTube", async () => {
    const adapter = makeUpdateProfileAdapter({
      updateProfile: {
        execute: () => Promise.resolve(profile),
      },
    });

    await assert.rejects(
      adapter(makeRequest({ youtubeChannelUrl: "https://example.com/user" })),
      (error: unknown) =>
        error instanceof AppError && error.code === "INVALID_PROFILE_DATA",
    );
  });
});
