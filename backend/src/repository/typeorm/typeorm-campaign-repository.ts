import { Like, type FindOptionsWhere, type Repository } from "typeorm";

import type { Campaign } from "../../entities/campaign";
import type { CampaignRepository } from "../campaign-repository";
import { TypeOrmEntityRepository } from "./typeorm-entity-repository";

export class TypeOrmCampaignRepository
  extends TypeOrmEntityRepository<Campaign, string>
  implements CampaignRepository
{
  constructor(repository: Repository<Campaign>) {
    super(repository);
  }

  findById(id: string): Promise<Campaign | null> {
    return this.repository.findOneBy({ id });
  }

  findByMetadataId(metadataId: string): Promise<Campaign | null> {
    return this.repository.findOneBy({ metadataId });
  }

  findByOnchainReference(input: {
    chainId: number;
    contractAddress: string;
    onchainCampaignId: string;
  }): Promise<Campaign | null> {
    return this.repository.findOneBy({
      chainId: input.chainId,
      contractAddress: input.contractAddress.toLowerCase(),
      onchainCampaignId: input.onchainCampaignId,
    });
  }

  async markPendingOnchain(input: {
    campaignId: string;
    creatorId: string;
    chainId: number;
    contractAddress: string;
    transactionHash: string;
  }): Promise<boolean> {
    const result = await this.repository.update(
      { id: input.campaignId, creatorId: input.creatorId, status: "draft" },
      {
        chainId: input.chainId,
        contractAddress: input.contractAddress,
        creationTransactionHash: input.transactionHash,
        status: "pending_onchain",
        updatedAt: new Date(),
      },
    );

    return result.affected === 1;
  }

  findByCreatorId(creatorId: string): Promise<Campaign[]> {
    return this.repository.find({
      where: { creatorId },
      order: { createdAt: "DESC" },
    });
  }

  async searchPublished(input: {
    search: string;
    offset: number;
    limit: number;
  }): Promise<{ campaigns: Campaign[]; total: number }> {
    const where: FindOptionsWhere<Campaign> = { status: "published" };

    if (input.search) {
      where.searchText = Like(`%${input.search}%`);
    }

    const [campaigns, total] = await this.repository.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: input.offset,
      take: input.limit,
    });

    return { campaigns, total };
  }
}
