import type { Campaign } from "../../entities/campaign";
import { AppError } from "../../errors/app-error";
import type { CampaignRepository } from "../../repository/campaign-repository";
import type { DonationEventRepository } from "../../repository/donation-event-repository";

export type CampaignDonationHistoryItem = {
  chainId: number;
  donorAddress: string;
  amountWei: string;
  transactionHash: string;
  logIndex: number;
  blockNumber: string;
  occurredAt: string;
};

export type CampaignDonationHistory = {
  donations: CampaignDonationHistoryItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export class ListCampaignDonationsUseCase {
  constructor(
    private readonly campaigns: CampaignRepository,
    private readonly donationEvents: DonationEventRepository,
  ) {}

  async execute(input: {
    campaignId: string;
    creatorId?: string;
    page: number;
    pageSize: number;
  }): Promise<CampaignDonationHistory> {
    const campaign = await this.campaigns.findById(input.campaignId);
    this.ensureCampaignIsVisible(campaign, input.creatorId);

    if (
      campaign.chainId === null ||
      campaign.contractAddress === null ||
      campaign.onchainCampaignId === null
    ) {
      return this.emptyResult(input.page, input.pageSize);
    }

    const { donationEvents, total } =
      await this.donationEvents.findByCampaignReference({
        chainId: campaign.chainId,
        contractAddress: campaign.contractAddress,
        onchainCampaignId: campaign.onchainCampaignId,
        offset: (input.page - 1) * input.pageSize,
        limit: input.pageSize,
      });

    return {
      donations: donationEvents.map((event) => ({
        chainId: event.chainId,
        donorAddress: event.donorAddress,
        amountWei: event.amountWei,
        transactionHash: event.transactionHash,
        logIndex: event.logIndex,
        blockNumber: event.blockNumber,
        occurredAt: event.occurredAt.toISOString(),
      })),
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        total,
        totalPages: Math.ceil(total / input.pageSize),
      },
    };
  }

  private ensureCampaignIsVisible(
    campaign: Campaign | null,
    creatorId?: string,
  ): asserts campaign is Campaign {
    const canView = creatorId
      ? campaign?.creatorId === creatorId
      : campaign?.status === "published";

    if (!campaign || !canView) {
      throw new AppError(
        "The requested campaign could not be found.",
        404,
        "CAMPAIGN_NOT_FOUND",
      );
    }
  }

  private emptyResult(page: number, pageSize: number): CampaignDonationHistory {
    return {
      donations: [],
      pagination: { page, pageSize, total: 0, totalPages: 0 },
    };
  }
}
