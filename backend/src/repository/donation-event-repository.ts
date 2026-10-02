import type { DonationEvent } from "../entities/donation-event";
import type { EntityRepository } from "./entity-repository";

export interface DonationEventRepository
  extends EntityRepository<DonationEvent, string> {
  saveIfAbsent(entity: DonationEvent): Promise<boolean>;
  findPending(limit: number): Promise<DonationEvent[]>;
}
