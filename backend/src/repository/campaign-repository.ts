import type { Campaign } from "../entities/campaign";
import type { EntityRepository } from "./entity-repository";

export interface CampaignRepository
  extends EntityRepository<Campaign, string> {
  findByCreatorId(creatorId: string): Promise<Campaign[]>;
  searchPublished(input: {
    search: string;
    offset: number;
    limit: number;
  }): Promise<{ campaigns: Campaign[]; total: number }>;
}
