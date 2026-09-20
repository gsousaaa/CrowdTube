import {
  Campaign,
  type CampaignCategory,
} from "../../entities/campaign";
import { AppError } from "../../errors/app-error";
import type { CampaignRepository } from "../../repository/campaign-repository";

export type CreateCampaignInput = {
  creatorId: string;
  title: string;
  category: CampaignCategory;
  description: string;
  youtubeUrl: string;
  imageObjectKey?: string | null;
};

export class CreateCampaignUseCase {
  constructor(private readonly campaigns: CampaignRepository) {}

  async execute(input: CreateCampaignInput): Promise<Campaign> {
    if (
      input.imageObjectKey &&
      !input.imageObjectKey.startsWith(
        `users/${input.creatorId}/campaign-image/`,
      )
    ) {
      throw new AppError(
        "The campaign image does not belong to the authenticated user.",
        403,
        "CAMPAIGN_IMAGE_ACCESS_DENIED",
      );
    }

    return this.campaigns.save(Campaign.create(input));
  }
}
