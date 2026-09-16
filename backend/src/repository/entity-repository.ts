export interface EntityRepository<TEntity, TId> {
  findById(id: TId): Promise<TEntity | null>;
  save(entity: TEntity): Promise<TEntity>;
  remove(entity: TEntity): Promise<void>;
}
