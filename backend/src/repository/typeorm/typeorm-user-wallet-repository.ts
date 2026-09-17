import type { Repository } from "typeorm";

import {
  normalizeWalletAddress,
  type UserWallet,
} from "../../entities/user-wallet";
import type { UserWalletRepository } from "../user-wallet-repository";
import { TypeOrmEntityRepository } from "./typeorm-entity-repository";

export class TypeOrmUserWalletRepository
  extends TypeOrmEntityRepository<UserWallet, string>
  implements UserWalletRepository
{
  constructor(repository: Repository<UserWallet>) {
    super(repository);
  }

  findById(id: string): Promise<UserWallet | null> {
    return this.repository.findOneBy({ id });
  }

  findByWalletAddress(walletAddress: string): Promise<UserWallet | null> {
    return this.repository.findOneBy({
      walletAddress: normalizeWalletAddress(walletAddress),
    });
  }

  findByUserId(userId: string): Promise<UserWallet[]> {
    return this.repository.findBy({ userId });
  }
}
