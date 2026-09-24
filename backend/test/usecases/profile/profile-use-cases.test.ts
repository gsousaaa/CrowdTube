import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { User } from "../../../src/entities/user";
import { UserWallet } from "../../../src/entities/user-wallet";
import { AppError } from "../../../src/errors/app-error";
import type { UserRepository } from "../../../src/repository/user-repository";
import type { UserWalletRepository } from "../../../src/repository/user-wallet-repository";
import { GetProfileUseCase } from "../../../src/usecases/profile/get-profile-use-case";
import { UpdateProfileUseCase } from "../../../src/usecases/profile/update-profile-use-case";

class InMemoryUserRepository implements UserRepository {
  readonly items: User[] = [];

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.items.find((item) => item.id === id) ?? null);
  }

  save(entity: User): Promise<User> {
    if (!this.items.includes(entity)) this.items.push(entity);
    return Promise.resolve(entity);
  }

  async remove(entity: User): Promise<void> {
    const index = this.items.indexOf(entity);
    if (index >= 0) this.items.splice(index, 1);
  }
}

class InMemoryUserWalletRepository implements UserWalletRepository {
  readonly items: UserWallet[] = [];

  findById(id: string): Promise<UserWallet | null> {
    return Promise.resolve(this.items.find((item) => item.id === id) ?? null);
  }

  findByWalletAddress(walletAddress: string): Promise<UserWallet | null> {
    return Promise.resolve(
      this.items.find((item) => item.walletAddress === walletAddress) ?? null,
    );
  }

  findByUserId(userId: string): Promise<UserWallet[]> {
    return Promise.resolve(
      this.items.filter((item) => item.userId === userId),
    );
  }

  save(entity: UserWallet): Promise<UserWallet> {
    if (!this.items.includes(entity)) this.items.push(entity);
    return Promise.resolve(entity);
  }

  async remove(entity: UserWallet): Promise<void> {
    const index = this.items.indexOf(entity);
    if (index >= 0) this.items.splice(index, 1);
  }
}

const walletAddress = "0x0000000000000000000000000000000000000001";
const now = new Date("2026-09-19T12:00:00.000Z");

function makeScenario() {
  const users = new InMemoryUserRepository();
  const userWallets = new InMemoryUserWalletRepository();
  const user = User.create({
    displayName: "Creator",
    bio: "Original bio",
  });
  const wallet = UserWallet.create({
    userId: user.id,
    walletAddress,
    isPrimary: true,
    verifiedAt: now,
  });
  users.items.push(user);
  userWallets.items.push(wallet);

  const getProfile = new GetProfileUseCase(users, userWallets);
  const updateProfile = new UpdateProfileUseCase(
    users,
    getProfile,
    () => now,
  );

  return { getProfile, updateProfile, user };
}

describe("profile use cases", () => {
  it("returns the authenticated creator profile and wallets", async () => {
    const { getProfile, user } = makeScenario();

    const profile = await getProfile.execute({
      userId: user.id,
      authenticatedWalletAddress: walletAddress,
    });

    assert.equal(profile.displayName, "Creator");
    assert.equal(profile.authenticatedWalletAddress, walletAddress);
    assert.equal(profile.wallets.length, 1);
    assert.equal(profile.wallets[0]?.isPrimary, true);
  });

  it("updates only the provided field and returns the complete profile", async () => {
    const { updateProfile, user } = makeScenario();

    const profile = await updateProfile.execute({
      userId: user.id,
      authenticatedWalletAddress: walletAddress,
      displayName: "New creator name",
    });

    assert.equal(profile.displayName, "New creator name");
    assert.equal(profile.bio, "Original bio");
    assert.equal(profile.wallets.length, 1);
    assert.equal(user.updatedAt, now);
  });

  it("stores an avatar object key owned by the authenticated user", async () => {
    const { updateProfile, user } = makeScenario();
    const avatarObjectKey =
      `users/${user.id}/profile-avatar/` +
      "69cc5f83-e496-4226-8622-daba1b38c21e-avatar.png";

    const profile = await updateProfile.execute({
      userId: user.id,
      authenticatedWalletAddress: walletAddress,
      avatarObjectKey,
    });

    assert.equal(profile.avatarObjectKey, avatarObjectKey);
    assert.equal(user.avatarObjectKey, avatarObjectKey);
  });

  it("rejects an avatar object key owned by another user", async () => {
    const { updateProfile, user } = makeScenario();

    await assert.rejects(
      updateProfile.execute({
        userId: user.id,
        authenticatedWalletAddress: walletAddress,
        avatarObjectKey:
          "users/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/profile-avatar/" +
          "69cc5f83-e496-4226-8622-daba1b38c21e-avatar.png",
      }),
      (error: unknown) =>
        error instanceof AppError &&
        error.code === "PROFILE_AVATAR_ACCESS_DENIED",
    );
  });

  it("rejects a session whose user no longer exists", async () => {
    const { getProfile } = makeScenario();

    await assert.rejects(
      getProfile.execute({
        userId: "missing-user",
        authenticatedWalletAddress: walletAddress,
      }),
      (error: unknown) =>
        error instanceof AppError &&
        error.code === "AUTHENTICATED_USER_NOT_FOUND",
    );
  });
});
