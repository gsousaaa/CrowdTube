import type { Repository } from "typeorm";

import type { AuthSession } from "../../entities/auth-session";
import type { AuthSessionRepository } from "../auth-session-repository";
import { TypeOrmEntityRepository } from "./typeorm-entity-repository";

export class TypeOrmAuthSessionRepository
  extends TypeOrmEntityRepository<AuthSession, string>
  implements AuthSessionRepository
{
  constructor(repository: Repository<AuthSession>) {
    super(repository);
  }

  findById(id: string): Promise<AuthSession | null> {
    return this.repository.findOneBy({ id });
  }

  findByTokenHash(tokenHash: string): Promise<AuthSession | null> {
    return this.repository.findOneBy({ tokenHash });
  }
}
