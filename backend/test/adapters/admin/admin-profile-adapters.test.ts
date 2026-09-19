import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { makeGetAdminProfileAdapter } from "../../../src/adapters/admin/get-admin-profile-adapter";
import { makeUpdateAdminProfileAdapter } from "../../../src/adapters/admin/update-admin-profile-adapter";
import { AppError } from "../../../src/errors/app-error";
import type { UpdateAdminProfileInput } from "../../../src/usecases/admin/update-admin-profile-use-case";

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
  avatarUrl: null,
  authenticatedWalletAddress: walletAddress,
  wallets: [],
};

describe("admin profile adapters", () => {
  it("gets the profile using only the authenticated identity", async () => {
    const adapter = makeGetAdminProfileAdapter({
      getAdminProfile: {
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
    let receivedInput: UpdateAdminProfileInput | undefined;
    const adapter = makeUpdateAdminProfileAdapter({
      updateAdminProfile: {
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
      }),
    );

    assert.equal(response.statusCode, 200);
    assert.deepEqual(receivedInput, {
      userId,
      authenticatedWalletAddress: walletAddress,
      displayName: "New creator",
      youtubeChannelUrl: "https://www.youtube.com/@creator",
    });
  });

  it("rejects an empty update", async () => {
    const adapter = makeUpdateAdminProfileAdapter({
      updateAdminProfile: {
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
    const adapter = makeUpdateAdminProfileAdapter({
      updateAdminProfile: {
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
