import type { Campaign } from "../../entities/campaign";
import type { CampaignRepository } from "../../repository/campaign-repository";

export class ListCreatorCampaignsUseCase {
  constructor(private readonly campaigns: CampaignRepository) {}

  execute(creatorId: string): Promise<Campaign[]> {
    return this.campaigns.findByCreatorId(creatorId);
  }
}
