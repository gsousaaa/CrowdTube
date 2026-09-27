import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Campaign } from "../../../src/entities/campaign";
import type { DonationEvent } from "../../../src/entities/donation-event";
import type { Notification } from "../../../src/entities/notification";
import type { CampaignRepository } from "../../../src/repository/campaign-repository";
import type { DonationEventRepository } from "../../../src/repository/donation-event-repository";
import type { NotificationRepository } from "../../../src/repository/notification-repository";
import { DispatchDonationNotificationsUseCase } from "../../../src/usecases/notification/dispatch-donation-notifications-use-case";
import type { DonationReceivedEvent } from "../../../src/usecases/notification/donation-event-reader";
import { ListNotificationsUseCase } from "../../../src/usecases/notification/list-notifications-use-case";
import { MarkNotificationsReadUseCase } from "../../../src/usecases/notification/mark-notifications-read-use-case";
import { RecordDonationEventsUseCase } from "../../../src/usecases/notification/record-donation-events-use-case";

class InMemoryDonationEventRepository implements DonationEventRepository {
  readonly items: DonationEvent[] = [];

  findById(id: string) {
    return Promise.resolve(this.items.find((item) => item.id === id) ?? null);
  }

  findBySource(input: {
    chainId: number;
    contractAddress: string;
    transactionHash: string;
    logIndex: number;
  }) {
    return Promise.resolve(
      this.items.find(
        (item) =>
          item.chainId === input.chainId &&
          item.contractAddress === input.contractAddress.toLowerCase() &&
          item.transactionHash === input.transactionHash.toLowerCase() &&
          item.logIndex === input.logIndex,
      ) ?? null,
    );
  }

  findPending(limit: number) {
    return Promise.resolve(
      this.items.filter((item) => item.status === "pending").slice(0, limit),
    );
  }

  save(entity: DonationEvent) {
    if (!this.items.includes(entity)) this.items.push(entity);
    return Promise.resolve(entity);
  }

  async remove(entity: DonationEvent) {
    const index = this.items.indexOf(entity);
    if (index >= 0) this.items.splice(index, 1);
  }
}

class InMemoryNotificationRepository implements NotificationRepository {
  readonly items: Notification[] = [];

  findById(id: string) {
    return Promise.resolve(this.items.find((item) => item.id === id) ?? null);
  }

  findByDonationEventId(donationEventId: string) {
    return Promise.resolve(
      this.items.find((item) => item.donationEventId === donationEventId) ?? null,
    );
  }

  findByUserId(userId: string, limit: number) {
    return Promise.resolve(
      this.items.filter((item) => item.userId === userId).slice(0, limit),
    );
  }

  countUnreadByUserId(userId: string) {
    return Promise.resolve(
      this.items.filter((item) => item.userId === userId && !item.readAt).length,
    );
  }

  markAllAsRead(userId: string, readAt: Date) {
    let updated = 0;
    for (const notification of this.items) {
      if (notification.userId === userId && !notification.readAt) {
        notification.readAt = readAt;
        updated += 1;
      }
    }
    return Promise.resolve(updated);
  }

  save(entity: Notification) {
    if (!this.items.includes(entity)) this.items.push(entity);
    return Promise.resolve(entity);
  }

  async remove(entity: Notification) {
    const index = this.items.indexOf(entity);
    if (index >= 0) this.items.splice(index, 1);
  }
}

class InMemoryCampaignRepository implements CampaignRepository {
  readonly items: Campaign[] = [];

  findById(id: string) {
    return Promise.resolve(this.items.find((item) => item.id === id) ?? null);
  }

  findByMetadataId(metadataId: string) {
    return Promise.resolve(
      this.items.find((item) => item.metadataId === metadataId) ?? null,
    );
  }

  findByOnchainReference(input: {
    chainId: number;
    contractAddress: string;
    onchainCampaignId: string;
  }) {
    return Promise.resolve(
      this.items.find(
        (item) =>
          item.chainId === input.chainId &&
          item.contractAddress === input.contractAddress.toLowerCase() &&
          item.onchainCampaignId === input.onchainCampaignId,
      ) ?? null,
    );
  }

  markPendingOnchain() {
    return Promise.resolve(false);
  }

  findByCreatorId(creatorId: string) {
    return Promise.resolve(this.items.filter((item) => item.creatorId === creatorId));
  }

  searchPublished() {
    return Promise.resolve({ campaigns: [], total: 0 });
  }

  save(entity: Campaign) {
    if (!this.items.includes(entity)) this.items.push(entity);
    return Promise.resolve(entity);
  }

  async remove(entity: Campaign) {
    const index = this.items.indexOf(entity);
    if (index >= 0) this.items.splice(index, 1);
  }
}

const creatorId = "c5b54171-8094-4235-a52b-7500633642d7";
const contractAddress = "0x0000000000000000000000000000000000000002";
const sourceEvent: DonationReceivedEvent = {
  chainId: 31_337,
  contractAddress,
  campaignId: "7",
  donorAddress: "0x0000000000000000000000000000000000000003",
  amountWei: "1000000000000000000",
  transactionHash: `0x${"a".repeat(64)}`,
  logIndex: 2,
  blockNumber: "15",
};

function makePublishedCampaign() {
  const campaign = Campaign.create({
    creatorId,
    title: "Open programming laboratory",
    category: "education",
    description: "Equipment for a new series of practical classes.",
    youtubeUrl: "https://youtube.com/@creator",
  });
  campaign.chainId = sourceEvent.chainId;
  campaign.contractAddress = contractAddress;
  campaign.onchainCampaignId = sourceEvent.campaignId;
  campaign.status = "published";
  return campaign;
}

describe("donation notification use cases", () => {
  it("records the same blockchain log only once", async () => {
    const donationEvents = new InMemoryDonationEventRepository();
    const useCase = new RecordDonationEventsUseCase(donationEvents);

    assert.equal(await useCase.execute([sourceEvent]), 1);
    assert.equal(await useCase.execute([sourceEvent]), 0);
    assert.equal(donationEvents.items.length, 1);
  });

  it("keeps an unmatched donation pending and processes it later", async () => {
    const donationEvents = new InMemoryDonationEventRepository();
    const notifications = new InMemoryNotificationRepository();
    const campaigns = new InMemoryCampaignRepository();
    await new RecordDonationEventsUseCase(donationEvents).execute([sourceEvent]);
    const dispatch = new DispatchDonationNotificationsUseCase(
      donationEvents,
      campaigns,
      notifications,
    );

    const firstAttempt = await dispatch.execute();
    assert.deepEqual(firstAttempt, { processed: 0, pending: 1 });
    assert.equal(donationEvents.items[0]?.attemptCount, 1);
    assert.equal(notifications.items.length, 0);

    const campaign = makePublishedCampaign();
    campaigns.items.push(campaign);
    const secondAttempt = await dispatch.execute();

    assert.deepEqual(secondAttempt, { processed: 1, pending: 0 });
    assert.equal(donationEvents.items[0]?.status, "processed");
    assert.equal(notifications.items.length, 1);
    assert.equal(notifications.items[0]?.userId, creatorId);
    assert.equal(notifications.items[0]?.campaignId, campaign.id);
  });

  it("lists notification details and marks them as read", async () => {
    const donationEvents = new InMemoryDonationEventRepository();
    const notifications = new InMemoryNotificationRepository();
    const campaigns = new InMemoryCampaignRepository();
    const campaign = makePublishedCampaign();
    campaigns.items.push(campaign);
    await new RecordDonationEventsUseCase(donationEvents).execute([sourceEvent]);
    await new DispatchDonationNotificationsUseCase(
      donationEvents,
      campaigns,
      notifications,
    ).execute();

    const notification = notifications.items[0]!;
    notification.campaign = campaign;
    notification.donationEvent = donationEvents.items[0];
    const listed = await new ListNotificationsUseCase(notifications).execute(
      creatorId,
    );

    assert.equal(listed.unreadCount, 1);
    assert.equal(listed.notifications[0]?.amountWei, sourceEvent.amountWei);
    assert.equal(listed.notifications[0]?.campaignTitle, campaign.title);

    const readAt = new Date("2026-09-25T12:00:00.000Z");
    const result = await new MarkNotificationsReadUseCase(
      notifications,
      () => readAt,
    ).execute(creatorId);
    assert.deepEqual(result, {
      updatedCount: 1,
      readAt: readAt.toISOString(),
    });
    assert.equal(notification.readAt, readAt);
  });
});
