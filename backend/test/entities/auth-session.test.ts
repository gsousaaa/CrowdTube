import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AuthSession } from "../../src/entities/auth-session";

describe("AuthSession", () => {
  it("creates an active session with an expiration", () => {
    const now = new Date("2026-09-18T12:00:00.000Z");
    const session = AuthSession.create({
      userId: "c5b54171-8094-4235-a52b-7500633642d7",
      walletId: "aa468456-df71-4ae2-997a-f6ad04251c88",
      tokenHash: "a".repeat(64),
      ttlSeconds: 3600,
      now,
    });

    assert.equal(session.isActive(now), true);
    assert.equal(
      session.expiresAt.toISOString(),
      "2026-09-18T13:00:00.000Z",
    );
  });

  it("becomes inactive after it is revoked", () => {
    const now = new Date("2026-09-18T12:00:00.000Z");
    const session = AuthSession.create({
      userId: "c5b54171-8094-4235-a52b-7500633642d7",
      walletId: "aa468456-df71-4ae2-997a-f6ad04251c88",
      tokenHash: "a".repeat(64),
      ttlSeconds: 3600,
      now,
    });

    session.revoke(now);

    assert.equal(session.isRevoked(), true);
    assert.equal(session.isActive(now), false);
  });
});
