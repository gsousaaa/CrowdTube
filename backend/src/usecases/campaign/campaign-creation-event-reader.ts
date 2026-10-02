import type { CampaignCreatedEvent } from "./apply-campaign-created-event-use-case";

export type CampaignCreationTransactionReceipt = {
  blockNumber: bigint;
  status: "success" | "reverted";
  events: CampaignCreatedEvent[];
};

export interface CampaignCreationEventReader {
  getChainId(): Promise<number>;
  getBlockNumber(): Promise<bigint>;
  hasContract(): Promise<boolean>;
  getTransactionReceipt(
    transactionHash: string,
  ): Promise<CampaignCreationTransactionReceipt | null>;
  getCreatedEvents(fromBlock: bigint, toBlock: bigint): Promise<CampaignCreatedEvent[]>;
}
