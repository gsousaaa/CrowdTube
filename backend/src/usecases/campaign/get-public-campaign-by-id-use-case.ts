import type { Campaign } from "../../entities/campaign";
import { AppError } from "../../errors/app-error";
import type { CampaignRepository } from "../../repository/campaign-repository";

export class GetPublicCampaignByIdUseCase {
  constructor(private readonly campaigns: CampaignRepository) {}

  async execute(campaignId: string): Promise<Campaign> {
    const campaign = await this.campaigns.findById(campaignId);

    if (!campaign || campaign.status !== "published") {
      throw new AppError(
        "The requested campaign could not be found.",
        404,
        "CAMPAIGN_NOT_FOUND",
      );
    }

    return campaign;
  }
}
