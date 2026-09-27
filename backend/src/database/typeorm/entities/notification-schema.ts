import { EntitySchema } from "typeorm";

import { Notification } from "../../../entities/notification";

export const NotificationSchema = new EntitySchema<Notification>({
  name: "Notification",
  target: Notification,
  tableName: "notifications",
  columns: {
    id: { type: "uuid", primary: true },
    userId: { name: "user_id", type: "uuid" },
    campaignId: { name: "campaign_id", type: "uuid" },
    donationEventId: {
      name: "donation_event_id",
      type: "uuid",
      unique: true,
    },
    type: { type: "varchar", length: 50 },
    readAt: { name: "read_at", type: "timestamptz", nullable: true },
    createdAt: {
      name: "created_at",
      type: "timestamptz",
      createDate: true,
    },
  },
  relations: {
    campaign: {
      type: "many-to-one",
      target: "Campaign",
      joinColumn: {
        name: "campaign_id",
        foreignKeyConstraintName: "FK_notifications_campaign_id",
      },
      onDelete: "CASCADE",
    },
    donationEvent: {
      type: "one-to-one",
      target: "DonationEvent",
      joinColumn: {
        name: "donation_event_id",
        foreignKeyConstraintName: "FK_notifications_donation_event_id",
      },
      onDelete: "CASCADE",
    },
  },
  indices: [
    {
      name: "IDX_notifications_user_created_at",
      columns: ["userId", "createdAt"],
    },
  ],
});
