import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { User } from "../../src/entities/user";

describe("User", () => {
  it("creates a user without coupling its identity to a wallet", () => {
    const user = User.create({ displayName: "Creator" });

    assert.match(user.id, /^[0-9a-f-]{36}$/);
    assert.equal(user.displayName, "Creator");
    assert.equal(user.bio, null);
    assert.equal(user.avatarObjectKey, null);
    assert.equal("walletAddress" in user, false);
    assert.equal(user.createdAt instanceof Date, true);
    assert.equal(user.updatedAt instanceof Date, true);
  });

  it("updates only the profile fields that were provided", () => {
    const user = User.create({
      displayName: "Creator",
      bio: "Original bio",
      youtubeChannelUrl: "https://youtube.com/@creator",
    });
    const updatedAt = new Date("2026-09-19T12:00:00.000Z");

    user.updateProfile({ displayName: "  New name  " }, updatedAt);

    assert.equal(user.displayName, "New name");
    assert.equal(user.bio, "Original bio");
    assert.equal(user.youtubeChannelUrl, "https://youtube.com/@creator");
    assert.equal(user.updatedAt, updatedAt);
  });

  it("clears a nullable profile field when null is provided", () => {
    const user = User.create({
      bio: "Biography",
      avatarObjectKey:
        "users/user-id/profile-avatar/media-id-avatar.png",
    });

    user.updateProfile({ bio: null, avatarObjectKey: null });

    assert.equal(user.bio, null);
    assert.equal(user.avatarObjectKey, null);
  });
});
