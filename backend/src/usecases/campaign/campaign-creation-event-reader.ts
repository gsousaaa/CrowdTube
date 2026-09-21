import type { CampaignCreatedEvent } from "./apply-campaign-created-event-use-case";

export interface CampaignCreationEventReader {
  getChainId(): Promise<number>;
  getBlockNumber(): Promise<bigint>;
  hasContract(): Promise<boolean>;
  getCreatedEvents(fromBlock: bigint, toBlock: bigint): Promise<CampaignCreatedEvent[]>;
}
