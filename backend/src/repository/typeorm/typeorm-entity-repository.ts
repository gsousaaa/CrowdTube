import type { ObjectLiteral, Repository } from "typeorm";

import type { EntityRepository } from "../entity-repository";

export abstract class TypeOrmEntityRepository<
  TEntity extends ObjectLiteral,
  TId,
> implements EntityRepository<TEntity, TId>
{
  constructor(protected readonly repository: Repository<TEntity>) {}

  abstract findById(id: TId): Promise<TEntity | null>;

  save(entity: TEntity): Promise<TEntity> {
    return this.repository.save(entity);
  }

  async remove(entity: TEntity): Promise<void> {
    await this.repository.remove(entity);
  }
}
