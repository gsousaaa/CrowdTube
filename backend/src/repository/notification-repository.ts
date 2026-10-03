import type { Notification } from "../entities/notification";
import type { EntityRepository } from "./entity-repository";

export interface NotificationRepository
  extends EntityRepository<Notification, string> {
  saveIfAbsent(entity: Notification): Promise<boolean>;
  findByUserId(userId: string, limit: number): Promise<Notification[]>;
  countUnreadByUserId(userId: string): Promise<number>;
  markAllAsRead(userId: string, readAt: Date): Promise<number>;
}
