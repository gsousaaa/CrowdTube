import {
  normalizeCampaignSearchText,
  type Campaign,
} from "../../entities/campaign";
import type { CampaignRepository } from "../../repository/campaign-repository";

export type PublicCampaignSearchResult = {
  campaigns: Campaign[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export class SearchPublicCampaignsUseCase {
  constructor(private readonly campaigns: CampaignRepository) {}

  async execute(input: {
    search?: string;
    page: number;
    pageSize: number;
  }): Promise<PublicCampaignSearchResult> {
    const search = normalizeCampaignSearchText(input.search ?? "");
    const { campaigns, total } = await this.campaigns.searchPublished({
      search,
      offset: (input.page - 1) * input.pageSize,
      limit: input.pageSize,
    });

    return {
      campaigns,
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        total,
        totalPages: Math.ceil(total / input.pageSize),
      },
    };
  }
}
