import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AuthNonce } from "../../src/entities/auth-nonce";

describe("AuthNonce", () => {
  it("creates a single-use login nonce with an expiration", () => {
    const now = new Date("2026-09-17T12:00:00.000Z");
    const authNonce = AuthNonce.create({
      walletAddress: "0x0000000000000000000000000000000000000001",
      purpose: "login",
      ttlSeconds: 300,
      now,
    });

    assert.equal(authNonce.nonce.length, 64);
    assert.equal(authNonce.expiresAt.toISOString(), "2026-09-17T12:05:00.000Z");
    assert.equal(authNonce.isUsed(), false);
    assert.equal(authNonce.isExpired(now), false);
    assert.equal(
      authNonce.isExpired(new Date("2026-09-17T12:05:00.000Z")),
      true,
    );
  });
});
