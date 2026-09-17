import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AuthNonce } from "../../../src/entities/auth-nonce";
import type { AuthNonceRepository } from "../../../src/repository/auth-nonce-repository";
import { CreateAuthChallengeUseCase } from "../../../src/usecases/auth/create-auth-challenge-use-case";

class AuthNonceRepositoryStub implements AuthNonceRepository {
  saved?: AuthNonce;

  findById(): Promise<AuthNonce | null> {
    return Promise.resolve(null);
  }

  findByNonce(): Promise<AuthNonce | null> {
    return Promise.resolve(null);
  }

  findByIdForUpdate(): Promise<AuthNonce | null> {
    return Promise.resolve(null);
  }

  save(entity: AuthNonce): Promise<AuthNonce> {
    this.saved = entity;
    return Promise.resolve(entity);
  }

  remove(): Promise<void> {
    return Promise.resolve();
  }
}

describe("CreateAuthChallengeUseCase", () => {
  it("persists a nonce and returns the EIP-4361 message to sign", async () => {
    const repository = new AuthNonceRepositoryStub();
    const useCase = new CreateAuthChallengeUseCase(repository, {
      AUTH_DOMAIN: "localhost:3000",
      AUTH_URI: "http://localhost:3000",
      AUTH_CHAIN_ID: 31_337,
      AUTH_NONCE_TTL_SECONDS: 300,
    });

    const challenge = await useCase.execute({
      walletAddress: "0x0000000000000000000000000000000000000001",
    });

    assert.ok(repository.saved);
    assert.equal(challenge.challengeId, repository.saved.id);
    assert.match(challenge.message, /Nonce: [a-f0-9]{64}/);
    assert.match(challenge.message, /Chain ID: 31337/);
    assert.match(challenge.message, /Expiration Time:/);
  });
});
