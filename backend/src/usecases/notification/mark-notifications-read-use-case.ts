import type { NotificationRepository } from "../../repository/notification-repository";

export type MarkNotificationsReadResult = {
  updatedCount: number;
  readAt: string;
};

export class MarkNotificationsReadUseCase {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(userId: string): Promise<MarkNotificationsReadResult> {
    const readAt = this.now();
    const updatedCount = await this.notifications.markAllAsRead(userId, readAt);

    return {
      updatedCount,
      readAt: readAt.toISOString(),
    };
  }
}
