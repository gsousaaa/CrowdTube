import type { Campaign } from "../../entities/campaign";
import type { CampaignRepository } from "../../repository/campaign-repository";
import type { UserWalletRepository } from "../../repository/user-wallet-repository";

export type CampaignCreatedEvent = {
  chainId: number;
  contractAddress: string;
  campaignId: string;
  creator: string;
  metadataId: string;
  transactionHash: string;
};

export type ApplyCampaignCreatedResult =
  | { status: "published"; campaign: Campaign }
  | { status: "already_published"; campaign: Campaign }
  | { status: "unmatched" | "creator_mismatch" | "conflict" };

export class ApplyCampaignCreatedEventUseCase {
  constructor(
    private readonly campaigns: CampaignRepository,
    private readonly userWallets: UserWalletRepository,
  ) {}

  async execute(event: CampaignCreatedEvent): Promise<ApplyCampaignCreatedResult> {
    const campaign = await this.campaigns.findByMetadataId(event.metadataId);

    if (!campaign) return { status: "unmatched" };

    const wallet = await this.userWallets.findByWalletAddress(event.creator);

    if (!wallet || wallet.userId !== campaign.creatorId) {
      return { status: "creator_mismatch" };
    }

    const contractAddress = event.contractAddress.toLowerCase();
    const transactionHash = event.transactionHash.toLowerCase();

    if (campaign.status === "published") {
      const sameReference =
        campaign.chainId === event.chainId &&
        campaign.contractAddress === contractAddress &&
        campaign.onchainCampaignId === event.campaignId &&
        campaign.creationTransactionHash === transactionHash;

      return sameReference
        ? { status: "already_published", campaign }
        : { status: "conflict" };
    }

    if (
      campaign.status !== "draft" &&
      campaign.status !== "pending_onchain" &&
      campaign.status !== "failed"
    ) {
      return { status: "conflict" };
    }

    campaign.chainId = event.chainId;
    campaign.contractAddress = contractAddress;
    campaign.onchainCampaignId = event.campaignId;
    campaign.creationTransactionHash = transactionHash;
    campaign.status = "published";
    campaign.updatedAt = new Date();

    return { status: "published", campaign: await this.campaigns.save(campaign) };
  }
}
