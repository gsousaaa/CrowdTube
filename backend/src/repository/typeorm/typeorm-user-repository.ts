import type { Repository } from "typeorm";

import type { User } from "../../entities/user";
import type { UserRepository } from "../user-repository";
import { TypeOrmEntityRepository } from "./typeorm-entity-repository";

export class TypeOrmUserRepository
  extends TypeOrmEntityRepository<User, string>
  implements UserRepository
{
  constructor(repository: Repository<User>) {
    super(repository);
  }

  findById(id: string): Promise<User | null> {
    return this.repository.findOneBy({ id });
  }
}
