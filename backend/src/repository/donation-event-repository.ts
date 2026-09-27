import type { DonationEvent } from "../entities/donation-event";
import type { EntityRepository } from "./entity-repository";

export interface DonationEventRepository
  extends EntityRepository<DonationEvent, string> {
  findBySource(input: {
    chainId: number;
    contractAddress: string;
    transactionHash: string;
    logIndex: number;
  }): Promise<DonationEvent | null>;
  findPending(limit: number): Promise<DonationEvent[]>;
}
