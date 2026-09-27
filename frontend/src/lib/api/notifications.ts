import { apiRequest } from "./client";

export type DonationNotification = {
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
  notifications: DonationNotification[];
  unreadCount: number;
};

export type MarkNotificationsReadResult = {
  updatedCount: number;
  readAt: string;
};

export function getNotifications(): Promise<NotificationList> {
  return apiRequest("/admin/notifications");
}

export function markAllNotificationsAsRead(): Promise<MarkNotificationsReadResult> {
  return apiRequest("/admin/notifications/read-all", {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}
