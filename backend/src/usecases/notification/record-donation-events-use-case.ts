import { DonationEvent } from "../../entities/donation-event";
import type { DonationEventRepository } from "../../repository/donation-event-repository";
import type { DonationReceivedEvent } from "./donation-event-reader";

export class RecordDonationEventsUseCase {
  constructor(private readonly donationEvents: DonationEventRepository) {}

  async execute(events: DonationReceivedEvent[]): Promise<number> {
    let recorded = 0;

    for (const event of events) {
      const wasInserted = await this.donationEvents.saveIfAbsent(
        DonationEvent.create({
          chainId: event.chainId,
          contractAddress: event.contractAddress,
          onchainCampaignId: event.campaignId,
          donorAddress: event.donorAddress,
          amountWei: event.amountWei,
          transactionHash: event.transactionHash,
          logIndex: event.logIndex,
          blockNumber: event.blockNumber,
          occurredAt: event.occurredAt,
        }),
      );
      if (wasInserted) recorded += 1;
    }

    return recorded;
  }
}
