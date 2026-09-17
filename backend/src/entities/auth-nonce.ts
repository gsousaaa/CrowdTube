import { randomBytes, randomUUID } from "node:crypto";

import { normalizeWalletAddress } from "./user-wallet";
import type { User } from "./user";

export const authNoncePurposes = ["login", "link_wallet"] as const;

export type AuthNoncePurpose = (typeof authNoncePurposes)[number];

export type CreateAuthNonceInput = {
  walletAddress: string;
  purpose: AuthNoncePurpose;
  ttlSeconds: number;
  userId?: string | null;
  now?: Date;
};

export class AuthNonce {
  id!: string;
  userId!: string | null;
  walletAddress!: string;
  purpose!: AuthNoncePurpose;
  nonce!: string;
  expiresAt!: Date;
  usedAt!: Date | null;
  createdAt!: Date;
  user?: User;

  static create(input: CreateAuthNonceInput): AuthNonce {
    const createdAt = input.now ?? new Date();
    const authNonce = new AuthNonce();

    authNonce.id = randomUUID();
    authNonce.userId = input.userId ?? null;
    authNonce.walletAddress = normalizeWalletAddress(input.walletAddress);
    authNonce.purpose = input.purpose;
    authNonce.nonce = randomBytes(32).toString("hex");
    authNonce.createdAt = createdAt;
    authNonce.expiresAt = new Date(
      createdAt.getTime() + input.ttlSeconds * 1_000,
    );
    authNonce.usedAt = null;

    return authNonce;
  }

  isExpired(now = new Date()): boolean {
    return now >= this.expiresAt;
  }

  isUsed(): boolean {
    return this.usedAt !== null;
  }
}
