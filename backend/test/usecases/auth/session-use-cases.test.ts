import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AuthSession } from "../../../src/entities/auth-session";
import { User } from "../../../src/entities/user";
import { UserWallet } from "../../../src/entities/user-wallet";
import { AppError } from "../../../src/errors/app-error";
import type { AuthSessionRepository } from "../../../src/repository/auth-session-repository";
import type { UserRepository } from "../../../src/repository/user-repository";
import type { UserWalletRepository } from "../../../src/repository/user-wallet-repository";
import { AuthenticateSessionUseCase } from "../../../src/usecases/auth/authenticate-session-use-case";
import { GetCurrentUserUseCase } from "../../../src/usecases/auth/get-current-user-use-case";
import { LogoutUseCase } from "../../../src/usecases/auth/logout-use-case";
import type {
  SessionToken,
  SessionTokenManager,
} from "../../../src/usecases/auth/session-token-manager";

class SessionTokenManagerStub implements SessionTokenManager {
  create(): SessionToken {
    return { raw: "raw-token", hash: "a".repeat(64) };
  }

  hash(rawToken: string): string {
    return rawToken === "raw-token" ? "a".repeat(64) : "b".repeat(64);
  }
}

class InMemoryAuthSessionRepository implements AuthSessionRepository {
  readonly items: AuthSession[] = [];

  findById(id: string): Promise<AuthSession | null> {
    return Promise.resolve(this.items.find((item) => item.id === id) ?? null);
  }

  findByTokenHash(tokenHash: string): Promise<AuthSession | null> {
    return Promise.resolve(
      this.items.find((item) => item.tokenHash === tokenHash) ?? null,
    );
  }

  save(entity: AuthSession): Promise<AuthSession> {
    if (!this.items.includes(entity)) this.items.push(entity);
    return Promise.resolve(entity);
  }

  async remove(entity: AuthSession): Promise<void> {
    const index = this.items.indexOf(entity);
    if (index >= 0) this.items.splice(index, 1);
  }
}

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

const now = new Date("2026-09-18T12:00:00.000Z");
const walletAddress = "0x0000000000000000000000000000000000000001";

function makeScenario() {
  const authSessions = new InMemoryAuthSessionRepository();
  const users = new InMemoryUserRepository();
  const userWallets = new InMemoryUserWalletRepository();
  const sessionTokens = new SessionTokenManagerStub();
  const user = User.create({ displayName: "Creator" });
  const wallet = UserWallet.create({
    userId: user.id,
    walletAddress,
    isPrimary: true,
    verifiedAt: now,
  });
  const session = AuthSession.create({
    userId: user.id,
    walletId: wallet.id,
    tokenHash: sessionTokens.hash("raw-token"),
    ttlSeconds: 3600,
    now,
  });

  users.items.push(user);
  userWallets.items.push(wallet);
  authSessions.items.push(session);

  return { authSessions, users, userWallets, sessionTokens, session, user };
}

describe("authentication session use cases", () => {
  it("authenticates an active session and identifies its wallet", async () => {
    const scenario = makeScenario();
    const useCase = new AuthenticateSessionUseCase(
      scenario.authSessions,
      scenario.userWallets,
      scenario.sessionTokens,
      () => now,
    );

    const principal = await useCase.execute("raw-token");

    assert.equal(principal.userId, scenario.user.id);
    assert.equal(principal.walletAddress, walletAddress);
  });

  it("rejects an expired session", async () => {
    const scenario = makeScenario();
    const useCase = new AuthenticateSessionUseCase(
      scenario.authSessions,
      scenario.userWallets,
      scenario.sessionTokens,
      () => new Date("2026-09-18T13:00:00.000Z"),
    );

    await assert.rejects(
      useCase.execute("raw-token"),
      (error: unknown) =>
        error instanceof AppError && error.code === "UNAUTHENTICATED",
    );
  });

  it("revokes the current session on logout", async () => {
    const scenario = makeScenario();
    const useCase = new LogoutUseCase(
      scenario.authSessions,
      scenario.sessionTokens,
      () => now,
    );

    await useCase.execute("raw-token");

    assert.equal(scenario.session.revokedAt?.toISOString(), now.toISOString());
  });

  it("returns the profile and every wallet owned by the user", async () => {
    const scenario = makeScenario();
    const useCase = new GetCurrentUserUseCase(
      scenario.users,
      scenario.userWallets,
    );

    const profile = await useCase.execute({
      userId: scenario.user.id,
      authenticatedWalletAddress: walletAddress,
    });

    assert.equal(profile.displayName, "Creator");
    assert.equal(profile.avatarObjectKey, null);
    assert.equal(profile.authenticatedWalletAddress, walletAddress);
    assert.equal(profile.wallets.length, 1);
    assert.equal(profile.wallets[0]?.isPrimary, true);
  });
});
