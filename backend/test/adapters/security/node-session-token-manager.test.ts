import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { NodeSessionTokenManager } from "../../../src/adapters/security/node-session-token-manager";

describe("NodeSessionTokenManager", () => {
  it("creates a random token and stores only its deterministic hash", () => {
    const manager = new NodeSessionTokenManager();
    const first = manager.create();
    const second = manager.create();

    assert.notEqual(first.raw, second.raw);
    assert.match(first.hash, /^[a-f0-9]{64}$/);
    assert.equal(manager.hash(first.raw), first.hash);
    assert.notEqual(first.raw, first.hash);
  });
});
