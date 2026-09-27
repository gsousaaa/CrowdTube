import type { Campaign } from "../entities/campaign";
import type { EntityRepository } from "./entity-repository";

export interface CampaignRepository
  extends EntityRepository<Campaign, string> {
  findByMetadataId(metadataId: string): Promise<Campaign | null>;
  findByOnchainReference(input: {
    chainId: number;
    contractAddress: string;
    onchainCampaignId: string;
  }): Promise<Campaign | null>;
  markPendingOnchain(input: {
    campaignId: string;
    creatorId: string;
    chainId: number;
    contractAddress: string;
    transactionHash: string;
  }): Promise<boolean>;
  findByCreatorId(creatorId: string): Promise<Campaign[]>;
  searchPublished(input: {
    search: string;
    offset: number;
    limit: number;
  }): Promise<{ campaigns: Campaign[]; total: number }>;
}
