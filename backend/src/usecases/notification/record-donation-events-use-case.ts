import { DonationEvent } from "../../entities/donation-event";
import type { DonationEventRepository } from "../../repository/donation-event-repository";
import type { DonationReceivedEvent } from "./donation-event-reader";

export class RecordDonationEventsUseCase {
  constructor(private readonly donationEvents: DonationEventRepository) {}

  async execute(events: DonationReceivedEvent[]): Promise<number> {
    let recorded = 0;

    for (const event of events) {
      const existing = await this.donationEvents.findBySource({
        chainId: event.chainId,
        contractAddress: event.contractAddress,
        transactionHash: event.transactionHash,
        logIndex: event.logIndex,
      });
      if (existing) continue;

      await this.donationEvents.save(
        DonationEvent.create({
          chainId: event.chainId,
          contractAddress: event.contractAddress,
          onchainCampaignId: event.campaignId,
          donorAddress: event.donorAddress,
          amountWei: event.amountWei,
          transactionHash: event.transactionHash,
          logIndex: event.logIndex,
          blockNumber: event.blockNumber,
        }),
      );
      recorded += 1;
    }

    return recorded;
  }
}
