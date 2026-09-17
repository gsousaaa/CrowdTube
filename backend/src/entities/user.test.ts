import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { User } from "./user";

describe("User", () => {
  it("creates a user without coupling its identity to a wallet", () => {
    const user = User.create({ displayName: "Creator" });

    assert.match(user.id, /^[0-9a-f-]{36}$/);
    assert.equal(user.displayName, "Creator");
    assert.equal(user.bio, null);
    assert.equal("walletAddress" in user, false);
  });
});
