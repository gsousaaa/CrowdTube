import type { NotificationRepository } from "../../repository/notification-repository";

export type NotificationItem = {
  id: string;
  type: "donation_received";
  campaignId: string;
  campaignTitle: string;
  donorAddress: string;
  amountWei: string;
  transactionHash: string;
  readAt: string | null;
  createdAt: string;
};

export type NotificationList = {
  notifications: NotificationItem[];
  unreadCount: number;
};

export class ListNotificationsUseCase {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(userId: string, limit = 30): Promise<NotificationList> {
    const [notifications, unreadCount] = await Promise.all([
      this.notifications.findByUserId(userId, limit),
      this.notifications.countUnreadByUserId(userId),
    ]);

    return {
      unreadCount,
      notifications: notifications.map((notification) => {
        if (!notification.campaign || !notification.donationEvent) {
          throw new Error(
            `Notification ${notification.id} is missing its source relations.`,
          );
        }

        return {
          id: notification.id,
          type: notification.type,
          campaignId: notification.campaignId,
          campaignTitle: notification.campaign.title,
          donorAddress: notification.donationEvent.donorAddress,
          amountWei: notification.donationEvent.amountWei,
          transactionHash: notification.donationEvent.transactionHash,
          readAt: notification.readAt?.toISOString() ?? null,
          createdAt: notification.createdAt.toISOString(),
        };
      }),
    };
  }
}
