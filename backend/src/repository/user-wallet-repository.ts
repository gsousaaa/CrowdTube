import type { UserWallet } from "../entities/user-wallet";
import type { EntityRepository } from "./entity-repository";

export interface UserWalletRepository
  extends EntityRepository<UserWallet, string> {
  findByWalletAddress(walletAddress: string): Promise<UserWallet | null>;
  findByUserId(userId: string): Promise<UserWallet[]>;
}
