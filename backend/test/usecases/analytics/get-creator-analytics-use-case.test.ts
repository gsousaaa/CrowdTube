import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AppError } from "../../../src/errors/app-error";
import type { AnalyticsRepository } from "../../../src/repository/analytics-repository";
import { GetCreatorAnalyticsUseCase } from "../../../src/usecases/analytics/get-creator-analytics-use-case";

const userId = "c5b54171-8094-4235-a52b-7500633642d7";
const emptyAnalytics = {
  summary: {
    totalRaisedWei: "0",
    periodRaisedWei: "0",
    periodDonationCount: 0,
    periodAverageDonationWei: "0",
  },
  timeline: [],
  campaigns: [],
};

describe("GetCreatorAnalyticsUseCase", () => {
  it("uses the last 30 days when no period is provided", async () => {
    const now = new Date("2026-09-26T12:00:00.000Z");
    let receivedInput: Parameters<AnalyticsRepository["getCreatorAnalytics"]>[0] | undefined;
    const repository: AnalyticsRepository = {
      getCreatorAnalytics: (input) => {
        receivedInput = input;
        return Promise.resolve(emptyAnalytics);
      },
    };

    const result = await new GetCreatorAnalyticsUseCase(
      repository,
      () => now,
    ).execute({ userId });

    assert.equal(receivedInput?.userId, userId);
    assert.equal(
      receivedInput?.period.from.toISOString(),
      "2026-08-27T12:00:00.000Z",
    );
    assert.equal(receivedInput?.period.to.toISOString(), now.toISOString());
    assert.deepEqual(result.period, {
      from: "2026-08-27T12:00:00.000Z",
      to: now.toISOString(),
    });
  });

  it("rejects an inverted or excessively large period", async () => {
    const repository: AnalyticsRepository = {
      getCreatorAnalytics: () => Promise.resolve(emptyAnalytics),
    };
    const useCase = new GetCreatorAnalyticsUseCase(repository);

    await assert.rejects(
      useCase.execute({
        userId,
        from: new Date("2026-09-26T12:00:00.000Z"),
        to: new Date("2026-09-25T12:00:00.000Z"),
      }),
      (error: unknown) =>
        error instanceof AppError && error.code === "INVALID_ANALYTICS_PERIOD",
    );
    await assert.rejects(
      useCase.execute({
        userId,
        from: new Date("2025-01-01T00:00:00.000Z"),
        to: new Date("2026-09-26T00:00:00.000Z"),
      }),
      (error: unknown) =>
        error instanceof AppError && error.code === "ANALYTICS_PERIOD_TOO_LARGE",
    );
  });
});
