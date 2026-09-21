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
