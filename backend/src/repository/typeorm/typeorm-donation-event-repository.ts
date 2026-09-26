import type { Repository } from "typeorm";

import type { DonationEvent } from "../../entities/donation-event";
import type { DonationEventRepository } from "../donation-event-repository";
import { TypeOrmEntityRepository } from "./typeorm-entity-repository";

export class TypeOrmDonationEventRepository
  extends TypeOrmEntityRepository<DonationEvent, string>
  implements DonationEventRepository
{
  constructor(repository: Repository<DonationEvent>) {
    super(repository);
  }

  findById(id: string): Promise<DonationEvent | null> {
    return this.repository.findOneBy({ id });
  }

  findBySource(input: {
    chainId: number;
    contractAddress: string;
    transactionHash: string;
    logIndex: number;
  }): Promise<DonationEvent | null> {
    return this.repository.findOneBy({
      chainId: input.chainId,
      contractAddress: input.contractAddress.toLowerCase(),
      transactionHash: input.transactionHash.toLowerCase(),
      logIndex: input.logIndex,
    });
  }

  findPending(limit: number): Promise<DonationEvent[]> {
    return this.repository
      .createQueryBuilder("donation_event")
      .where('donation_event."status" = :status', { status: "pending" })
      .orderBy('donation_event."last_attempted_at"', "ASC", "NULLS FIRST")
      .addOrderBy('donation_event."block_number"', "ASC")
      .addOrderBy('donation_event."log_index"', "ASC")
      .take(limit)
      .getMany();
  }
}
