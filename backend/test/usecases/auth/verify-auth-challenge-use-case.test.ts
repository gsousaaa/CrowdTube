import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AuthNonce } from "../../../src/entities/auth-nonce";
import type { AuthSession } from "../../../src/entities/auth-session";
import type { User } from "../../../src/entities/user";
import type { UserWallet } from "../../../src/entities/user-wallet";
import { AppError } from "../../../src/errors/app-error";
import type { AuthNonceRepository } from "../../../src/repository/auth-nonce-repository";
import type { AuthSessionRepository } from "../../../src/repository/auth-session-repository";
import type { UserRepository } from "../../../src/repository/user-repository";
import type { UserWalletRepository } from "../../../src/repository/user-wallet-repository";
import type {
  AuthUnitOfWork,
  AuthUnitOfWorkRepositories,
} from "../../../src/usecases/auth/auth-unit-of-work";
import { VerifyAuthChallengeUseCase } from "../../../src/usecases/auth/verify-auth-challenge-use-case";
import type {
  SessionToken,
  SessionTokenManager,
} from "../../../src/usecases/auth/session-token-manager";
import type { WalletSignatureVerifier } from "../../../src/usecases/auth/wallet-signature-verifier";

class InMemoryAuthNonceRepository implements AuthNonceRepository {
  readonly items: AuthNonce[] = [];

  findById(id: string): Promise<AuthNonce | null> {
    return Promise.resolve(this.items.find((item) => item.id === id) ?? null);
  }

  findByNonce(nonce: string): Promise<AuthNonce | null> {
    return Promise.resolve(
      this.items.find((item) => item.nonce === nonce) ?? null,
    );
  }

  findByIdForUpdate(id: string): Promise<AuthNonce | null> {
    return this.findById(id);
  }

  save(entity: AuthNonce): Promise<AuthNonce> {
    if (!this.items.includes(entity)) this.items.push(entity);
    return Promise.resolve(entity);
  }

  async remove(entity: AuthNonce): Promise<void> {
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

class AuthUnitOfWorkStub implements AuthUnitOfWork {
  constructor(private readonly repositories: AuthUnitOfWorkRepositories) {}

  run<TResult>(
    operation: (
      repositories: AuthUnitOfWorkRepositories,
    ) => Promise<TResult>,
  ): Promise<TResult> {
    return operation(this.repositories);
  }
}

class WalletSignatureVerifierStub implements WalletSignatureVerifier {
  constructor(private readonly result: boolean) {}

  verify(): Promise<boolean> {
    return Promise.resolve(this.result);
  }
}

class SessionTokenManagerStub implements SessionTokenManager {
  create(): SessionToken {
    return { raw: "raw-session-token", hash: "a".repeat(64) };
  }

  hash(): string {
    return "a".repeat(64);
  }
}

const now = new Date("2026-09-17T12:00:00.000Z");
const walletAddress = "0x0000000000000000000000000000000000000001";
const config = {
  AUTH_DOMAIN: "localhost:3000",
  AUTH_URI: "http://localhost:3000",
  AUTH_CHAIN_ID: 31_337,
  AUTH_SESSION_TTL_SECONDS: 604_800,
};

function makeScenario(signatureIsValid = true) {
  const authNonces = new InMemoryAuthNonceRepository();
  const authSessions = new InMemoryAuthSessionRepository();
  const users = new InMemoryUserRepository();
  const userWallets = new InMemoryUserWalletRepository();
  const repositories = { authNonces, authSessions, users, userWallets };
  const useCase = new VerifyAuthChallengeUseCase(
    authNonces,
    new AuthUnitOfWorkStub(repositories),
    new WalletSignatureVerifierStub(signatureIsValid),
    new SessionTokenManagerStub(),
    config,
    () => now,
  );
  const authNonce = AuthNonce.create({
    walletAddress,
    purpose: "login",
    ttlSeconds: 300,
    now,
  });
  authNonces.items.push(authNonce);

  return { authNonce, repositories, useCase };
}

describe("VerifyAuthChallengeUseCase", () => {
  it("consumes the nonce and creates the user on the first login", async () => {
    const { authNonce, repositories, useCase } = makeScenario();

    const result = await useCase.execute({
      challengeId: authNonce.id,
      signature: "0x1234",
    });

    assert.equal(result.isNewUser, true);
    assert.equal(authNonce.usedAt?.toISOString(), now.toISOString());
    assert.equal(repositories.users.items.length, 1);
    assert.equal(repositories.userWallets.items.length, 1);
    assert.equal(repositories.userWallets.items[0]?.isPrimary, true);
    assert.equal(repositories.authSessions.items.length, 1);
    assert.equal(result.sessionToken, "raw-session-token");
  });

  it("returns the existing user for an already linked wallet", async () => {
    const { authNonce, repositories, useCase } = makeScenario();
    const firstLogin = await useCase.execute({
      challengeId: authNonce.id,
      signature: "0x1234",
    });
    const secondNonce = AuthNonce.create({
      walletAddress,
      purpose: "login",
      ttlSeconds: 300,
      now,
    });
    repositories.authNonces.items.push(secondNonce);

    const secondLogin = await useCase.execute({
      challengeId: secondNonce.id,
      signature: "0x5678",
    });

    assert.equal(secondLogin.isNewUser, false);
    assert.equal(secondLogin.userId, firstLogin.userId);
    assert.equal(repositories.users.items.length, 1);
    assert.equal(repositories.userWallets.items.length, 1);
    assert.equal(repositories.authSessions.items.length, 2);
  });

  it("rejects an invalid signature without consuming the nonce", async () => {
    const { authNonce, useCase } = makeScenario(false);

    await assert.rejects(
      useCase.execute({ challengeId: authNonce.id, signature: "0x1234" }),
      (error: unknown) =>
        error instanceof AppError &&
        error.code === "INVALID_WALLET_SIGNATURE",
    );
    assert.equal(authNonce.usedAt, null);
  });

  it("rejects a nonce that has already been used", async () => {
    const { authNonce, useCase } = makeScenario();
    authNonce.usedAt = now;

    await assert.rejects(
      useCase.execute({ challengeId: authNonce.id, signature: "0x1234" }),
      (error: unknown) =>
        error instanceof AppError &&
        error.code === "AUTH_CHALLENGE_ALREADY_USED",
    );
  });

  it("rejects an expired nonce", async () => {
    const { authNonce, repositories } = makeScenario();
    const useCase = new VerifyAuthChallengeUseCase(
      repositories.authNonces,
      new AuthUnitOfWorkStub(repositories),
      new WalletSignatureVerifierStub(true),
      new SessionTokenManagerStub(),
      config,
      () => new Date("2026-09-17T12:05:00.000Z"),
    );

    await assert.rejects(
      useCase.execute({ challengeId: authNonce.id, signature: "0x1234" }),
      (error: unknown) =>
        error instanceof AppError && error.code === "AUTH_CHALLENGE_EXPIRED",
    );
  });
});
