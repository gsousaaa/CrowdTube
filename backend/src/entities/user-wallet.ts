import { randomUUID } from "node:crypto";

import type { User } from "./user";

const ethereumAddressPattern = /^0x[a-fA-F0-9]{40}$/;

export function normalizeWalletAddress(address: string): string {
  const normalizedAddress = address.trim().toLowerCase();

  if (!ethereumAddressPattern.test(normalizedAddress)) {
    throw new Error("Invalid Ethereum wallet address");
  }

  return normalizedAddress;
}

export type CreateUserWalletInput = {
  userId: string;
  walletAddress: string;
  label?: string | null;
  isPrimary?: boolean;
  verifiedAt?: Date;
};

export class UserWallet {
  id!: string;
  userId!: string;
  walletAddress!: string;
  label!: string | null;
  isPrimary!: boolean;
  verifiedAt!: Date;
  createdAt!: Date;
  user?: User;

  static create(input: CreateUserWalletInput): UserWallet {
    const wallet = new UserWallet();

    wallet.id = randomUUID();
    wallet.userId = input.userId;
    wallet.walletAddress = normalizeWalletAddress(input.walletAddress);
    wallet.label = input.label ?? null;
    wallet.isPrimary = input.isPrimary ?? false;
    wallet.verifiedAt = input.verifiedAt ?? new Date();
    wallet.createdAt = new Date();

    return wallet;
  }
}
