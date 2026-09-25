import { randomUUID } from "node:crypto";

import type { Campaign } from "./campaign";
import type { DonationEvent } from "./donation-event";

export type NotificationType = "donation_received";

export type CreateNotificationInput = {
  userId: string;
  campaignId: string;
  donationEventId: string;
};

export class Notification {
  id!: string;
  userId!: string;
  campaignId!: string;
  donationEventId!: string;
  type!: NotificationType;
  readAt!: Date | null;
  createdAt!: Date;
  campaign?: Campaign;
  donationEvent?: DonationEvent;

  static create(
    input: CreateNotificationInput,
    now = new Date(),
  ): Notification {
    const notification = new Notification();

    notification.id = randomUUID();
    notification.userId = input.userId;
    notification.campaignId = input.campaignId;
    notification.donationEventId = input.donationEventId;
    notification.type = "donation_received";
    notification.readAt = null;
    notification.createdAt = now;

    return notification;
  }
}
