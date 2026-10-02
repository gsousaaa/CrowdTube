import { IsNull, type Repository } from "typeorm";

import type { Notification } from "../../entities/notification";
import type { NotificationRepository } from "../notification-repository";
import { TypeOrmEntityRepository } from "./typeorm-entity-repository";

export class TypeOrmNotificationRepository
  extends TypeOrmEntityRepository<Notification, string>
  implements NotificationRepository
{
  constructor(repository: Repository<Notification>) {
    super(repository);
  }

  findById(id: string): Promise<Notification | null> {
    return this.repository.findOne({
      where: { id },
      relations: { campaign: true, donationEvent: true },
    });
  }

  async saveIfAbsent(entity: Notification): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .insert()
      .values(entity)
      .orIgnore()
      .returning("id")
      .execute();

    return result.raw.length > 0;
  }

  findByUserId(userId: string, limit: number): Promise<Notification[]> {
    return this.repository.find({
      where: { userId },
      relations: { campaign: true, donationEvent: true },
      order: { createdAt: "DESC" },
      take: limit,
    });
  }

  countUnreadByUserId(userId: string): Promise<number> {
    return this.repository.countBy({ userId, readAt: IsNull() });
  }

  async markAllAsRead(userId: string, readAt: Date): Promise<number> {
    const result = await this.repository.update(
      { userId, readAt: IsNull() },
      { readAt },
    );
    return result.affected ?? 0;
  }
}
