import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { makeMarkNotificationsReadAdapter } from "../../../src/adapters/notification/mark-notifications-read-adapter";
import { AppError } from "../../../src/errors/app-error";

const userId = "c5b54171-8094-4235-a52b-7500633642d7";

function makeRequest(authenticated = true) {
  return {
    body: undefined,
    params: {},
    query: {},
    headers: {},
    cookies: {},
    authenticatedUser: authenticated
      ? {
          sessionId: "session-id",
          userId,
          walletId: "wallet-id",
          walletAddress: "0x0000000000000000000000000000000000000001",
        }
      : null,
  };
}

describe("notification adapters", () => {
  it("returns how many notifications were marked as read", async () => {
    const result = {
      updatedCount: 2,
      readAt: "2026-09-25T12:00:00.000Z",
    };
    const adapter = makeMarkNotificationsReadAdapter({
      markNotificationsRead: {
        execute: (receivedUserId) => {
          assert.equal(receivedUserId, userId);
          return Promise.resolve(result);
        },
      },
    });

    const response = await adapter(makeRequest());

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, result);
  });

  it("requires an authenticated session", async () => {
    const adapter = makeMarkNotificationsReadAdapter({
      markNotificationsRead: {
        execute: () => {
          throw new Error("Should not be called");
        },
      },
    });

    await assert.rejects(
      adapter(makeRequest(false)),
      (error: unknown) =>
        error instanceof AppError && error.code === "UNAUTHENTICATED",
    );
  });
});
