import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { makeGetCreatorAnalyticsAdapter } from "../../../src/adapters/analytics/get-creator-analytics-adapter";
import { AppError } from "../../../src/errors/app-error";

const userId = "c5b54171-8094-4235-a52b-7500633642d7";

function makeRequest(query: unknown, authenticated = true) {
  return {
    body: undefined,
    params: {},
    query,
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

describe("analytics adapters", () => {
  it("parses the requested period for the authenticated creator", async () => {
    const from = "2026-09-01T00:00:00.000Z";
    const to = "2026-10-01T00:00:00.000Z";
    const expected = {
      period: { from, to },
      summary: {
        totalRaisedWei: "10",
        periodRaisedWei: "10",
        periodDonationCount: 1,
        periodAverageDonationWei: "10",
      },
      timeline: [],
      campaigns: [],
    };
    const adapter = makeGetCreatorAnalyticsAdapter({
      getCreatorAnalytics: {
        execute: (input) => {
          assert.equal(input.userId, userId);
          assert.equal(input.from?.toISOString(), from);
          assert.equal(input.to?.toISOString(), to);
          return Promise.resolve(expected);
        },
      },
    });

    const response = await adapter(makeRequest({ from, to }));

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, expected);
  });

  it("rejects invalid dates and unauthenticated requests", async () => {
    const adapter = makeGetCreatorAnalyticsAdapter({
      getCreatorAnalytics: {
        execute: () => {
          throw new Error("Should not be called");
        },
      },
    });

    await assert.rejects(
      adapter(makeRequest({ from: "not-a-date" })),
      (error: unknown) =>
        error instanceof AppError && error.code === "INVALID_ANALYTICS_PERIOD",
    );
    await assert.rejects(
      adapter(makeRequest({}, false)),
      (error: unknown) =>
        error instanceof AppError && error.code === "UNAUTHENTICATED",
    );
  });
});
