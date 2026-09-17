import type { Repository } from "typeorm";

import type { AuthNonce } from "../../entities/auth-nonce";
import type { AuthNonceRepository } from "../auth-nonce-repository";
import { TypeOrmEntityRepository } from "./typeorm-entity-repository";

export class TypeOrmAuthNonceRepository
  extends TypeOrmEntityRepository<AuthNonce, string>
  implements AuthNonceRepository
{
  constructor(repository: Repository<AuthNonce>) {
    super(repository);
  }

  findById(id: string): Promise<AuthNonce | null> {
    return this.repository.findOneBy({ id });
  }

  findByNonce(nonce: string): Promise<AuthNonce | null> {
    return this.repository.findOneBy({ nonce });
  }
}
