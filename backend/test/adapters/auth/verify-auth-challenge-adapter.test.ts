import assert from "node:assert/strict";
import { it } from "node:test";

import { makeVerifyAuthChallengeAdapter } from "../../../src/adapters/auth/verify-auth-challenge-adapter";

it("places the session token only in an HttpOnly cookie", async () => {
  const adapter = makeVerifyAuthChallengeAdapter({
    verifyAuthChallenge: {
      execute: () =>
        Promise.resolve({
          userId: "c5b54171-8094-4235-a52b-7500633642d7",
          walletAddress: "0x0000000000000000000000000000000000000001",
          isNewUser: true,
          sessionToken: "private-session-token",
          sessionExpiresAt: new Date("2026-09-25T12:00:00.000Z"),
        }),
    },
    config: {
      AUTH_SESSION_COOKIE_NAME: "crowdtube_session",
      AUTH_SESSION_TTL_SECONDS: 604_800,
      NODE_ENV: "test",
    },
  });

  const response = await adapter({
    body: {
      challengeId: "0b894e39-4587-4236-9084-cf246d19572a",
      signature: "0x1234",
    },
    params: {},
    query: {},
    headers: {},
    cookies: {},
    authenticatedUser: null,
  });

  assert.deepEqual(response.body, {
    userId: "c5b54171-8094-4235-a52b-7500633642d7",
    walletAddress: "0x0000000000000000000000000000000000000001",
    isNewUser: true,
  });
  assert.equal("sessionToken" in response.body, false);
  assert.equal(response.cookies?.[0]?.value, "private-session-token");
  assert.equal(response.cookies?.[0]?.options.httpOnly, true);
});
