import { randomUUID } from "node:crypto";

import type { User } from "./user";
import type { UserWallet } from "./user-wallet";

export type CreateAuthSessionInput = {
  userId: string;
  walletId: string;
  tokenHash: string;
  ttlSeconds: number;
  now?: Date;
};

export class AuthSession {
  id!: string;
  userId!: string;
  walletId!: string;
  tokenHash!: string;
  expiresAt!: Date;
  revokedAt!: Date | null;
  createdAt!: Date;
  user?: User;
  wallet?: UserWallet;

  static create(input: CreateAuthSessionInput): AuthSession {
    const createdAt = input.now ?? new Date();
    const session = new AuthSession();

    session.id = randomUUID();
    session.userId = input.userId;
    session.walletId = input.walletId;
    session.tokenHash = input.tokenHash;
    session.expiresAt = new Date(
      createdAt.getTime() + input.ttlSeconds * 1_000,
    );
    session.revokedAt = null;
    session.createdAt = createdAt;

    return session;
  }

  isExpired(now = new Date()): boolean {
    return now >= this.expiresAt;
  }

  isRevoked(): boolean {
    return this.revokedAt !== null;
  }

  isActive(now = new Date()): boolean {
    return !this.isRevoked() && !this.isExpired(now);
  }

  revoke(now = new Date()): void {
    if (!this.revokedAt) this.revokedAt = now;
  }
}
