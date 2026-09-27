import { Notification } from "../../entities/notification";
import type { CampaignRepository } from "../../repository/campaign-repository";
import type { DonationEventRepository } from "../../repository/donation-event-repository";
import type { NotificationRepository } from "../../repository/notification-repository";

export type DispatchDonationNotificationsResult = {
  processed: number;
  pending: number;
};

export class DispatchDonationNotificationsUseCase {
  constructor(
    private readonly donationEvents: DonationEventRepository,
    private readonly campaigns: CampaignRepository,
    private readonly notifications: NotificationRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(limit = 100): Promise<DispatchDonationNotificationsResult> {
    const pendingEvents = await this.donationEvents.findPending(limit);
    let processed = 0;

    for (const event of pendingEvents) {
      const campaign = await this.campaigns.findByOnchainReference({
        chainId: event.chainId,
        contractAddress: event.contractAddress,
        onchainCampaignId: event.onchainCampaignId,
      });
      if (!campaign) {
        event.recordAttempt(this.now());
        await this.donationEvents.save(event);
        continue;
      }

      const existing = await this.notifications.findByDonationEventId(event.id);
      if (!existing) {
        await this.notifications.save(
          Notification.create(
            {
              userId: campaign.creatorId,
              campaignId: campaign.id,
              donationEventId: event.id,
            },
            this.now(),
          ),
        );
      }

      event.recordAttempt(this.now());
      event.markProcessed(this.now());
      await this.donationEvents.save(event);
      processed += 1;
    }

    return {
      processed,
      pending: pendingEvents.length - processed,
    };
  }
}
