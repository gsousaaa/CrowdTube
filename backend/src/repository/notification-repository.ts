import type { Notification } from "../entities/notification";
import type { EntityRepository } from "./entity-repository";

export interface NotificationRepository
  extends EntityRepository<Notification, string> {
  findByDonationEventId(donationEventId: string): Promise<Notification | null>;
  findByUserId(userId: string, limit: number): Promise<Notification[]>;
  countUnreadByUserId(userId: string): Promise<number>;
  markAllAsRead(userId: string, readAt: Date): Promise<number>;
}
