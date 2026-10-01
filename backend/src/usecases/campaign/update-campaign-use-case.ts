import type {
  Campaign,
  UpdateCampaignInput as CampaignMetadataInput,
} from "../../entities/campaign";
import { AppError } from "../../errors/app-error";
import type { CampaignRepository } from "../../repository/campaign-repository";

export type UpdateCampaignInput = CampaignMetadataInput & {
  campaignId: string;
  creatorId: string;
};

export class UpdateCampaignUseCase {
  constructor(
    private readonly campaigns: Pick<
      CampaignRepository,
      "findById" | "save"
    >,
  ) {}

  async execute(input: UpdateCampaignInput): Promise<Campaign> {
    const hasChanges = [
      input.title,
      input.category,
      input.description,
      input.youtubeUrl,
      input.imageObjectKey,
    ].some((value) => value !== undefined);

    if (!hasChanges) {
      throw new AppError(
        "At least one campaign field is required.",
        400,
        "INVALID_CAMPAIGN_DATA",
      );
    }

    const campaign = await this.campaigns.findById(input.campaignId);

    if (!campaign || campaign.creatorId !== input.creatorId) {
      throw new AppError(
        "The campaign was not found.",
        404,
        "CAMPAIGN_NOT_FOUND",
      );
    }

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

    campaign.updateMetadata({
      title: input.title,
      category: input.category,
      description: input.description,
      youtubeUrl: input.youtubeUrl,
      imageObjectKey: input.imageObjectKey,
    });

    return this.campaigns.save(campaign);
  }
}
