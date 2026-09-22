import type { Campaign } from "../../entities/campaign";
import { AppError } from "../../errors/app-error";
import type { CampaignRepository } from "../../repository/campaign-repository";

export type RecordCampaignCreationTransactionInput = {
  campaignId: string;
  creatorId: string;
  chainId: number;
  contractAddress: string;
  transactionHash: string;
};

export class RecordCampaignCreationTransactionUseCase {
  constructor(
    private readonly campaigns: Pick<CampaignRepository, "findById" | "markPendingOnchain">,
  ) {}

  async execute(input: RecordCampaignCreationTransactionInput): Promise<Campaign> {
    const campaign = await this.campaigns.findById(input.campaignId);

    // Do not disclose whether a campaign belonging to another creator exists.
    if (!campaign || campaign.creatorId !== input.creatorId) {
      throw new AppError("Campaign not found.", 404, "CAMPAIGN_NOT_FOUND");
    }

    const reference = {
      ...input,
      contractAddress: input.contractAddress.toLowerCase(),
      transactionHash: input.transactionHash.toLowerCase(),
    };

    if (campaign.status !== "draft") {
      return this.requireSameReference(campaign, reference);
    }

    await this.campaigns.markPendingOnchain(reference);
    const current = await this.campaigns.findById(input.campaignId);

    if (!current) {
      throw new AppError("Campaign not found.", 404, "CAMPAIGN_NOT_FOUND");
    }

    // The conditional update makes concurrent requests safe. Re-read to detect
    // another request or the indexer changing the campaign in the meantime.
    return this.requireSameReference(current, reference);
  }

  private requireSameReference(
    campaign: Campaign,
    reference: RecordCampaignCreationTransactionInput,
  ): Campaign {
    const sameReference =
      (campaign.status === "pending_onchain" || campaign.status === "published") &&
      campaign.chainId === reference.chainId &&
      campaign.contractAddress === reference.contractAddress &&
      campaign.creationTransactionHash === reference.transactionHash;

    if (!sameReference) {
      throw new AppError(
        "A different creation transaction is already associated with this campaign.",
        409,
        "CAMPAIGN_CREATION_TRANSACTION_CONFLICT",
      );
    }

    return campaign;
  }
}
