import { randomBytes, randomUUID } from "node:crypto";

import type { User } from "./user";

export const campaignCategories = [
  "education",
  "entertainment",
  "science",
  "games",
  "other",
] as const;

export type CampaignCategory = (typeof campaignCategories)[number];
export type CampaignStatus =
  | "draft"
  | "pending_onchain"
  | "published"
  | "failed";

export type CreateCampaignInput = {
  creatorId: string;
  title: string;
  category: CampaignCategory;
  description: string;
  youtubeUrl: string;
  imageObjectKey?: string | null;
};

export type UpdateCampaignInput = {
  title?: string;
  category?: CampaignCategory;
  description?: string;
  youtubeUrl?: string;
  imageObjectKey?: string | null;
};

export function normalizeCampaignSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export class Campaign {
  id!: string;
  creatorId!: string;
  metadataId!: string;
  chainId!: number | null;
  contractAddress!: string | null;
  onchainCampaignId!: string | null;
  creationTransactionHash!: string | null;
  title!: string;
  category!: CampaignCategory;
  description!: string;
  youtubeUrl!: string;
  imageObjectKey!: string | null;
  searchText!: string;
  status!: CampaignStatus;
  createdAt!: Date;
  updatedAt!: Date;
  creator?: User;

  static create(input: CreateCampaignInput): Campaign {
    const campaign = new Campaign();
    const now = new Date();

    campaign.id = randomUUID();
    campaign.creatorId = input.creatorId;
    campaign.metadataId = `0x${randomBytes(32).toString("hex")}`;
    campaign.chainId = null;
    campaign.contractAddress = null;
    campaign.onchainCampaignId = null;
    campaign.creationTransactionHash = null;
    campaign.title = input.title.trim();
    campaign.category = input.category;
    campaign.description = input.description.trim();
    campaign.youtubeUrl = input.youtubeUrl.trim();
    campaign.imageObjectKey = input.imageObjectKey?.trim() || null;
    campaign.searchText = normalizeCampaignSearchText(
      [campaign.title, campaign.category, campaign.description].join(" "),
    );
    campaign.status = "draft";
    campaign.createdAt = now;
    campaign.updatedAt = now;

    return campaign;
  }

  updateMetadata(input: UpdateCampaignInput): void {
    if (input.title !== undefined) this.title = input.title.trim();
    if (input.category !== undefined) this.category = input.category;
    if (input.description !== undefined) {
      this.description = input.description.trim();
    }
    if (input.youtubeUrl !== undefined) {
      this.youtubeUrl = input.youtubeUrl.trim();
    }
    if (input.imageObjectKey !== undefined) {
      this.imageObjectKey = input.imageObjectKey?.trim() || null;
    }

    this.searchText = normalizeCampaignSearchText(
      [this.title, this.category, this.description].join(" "),
    );
    this.updatedAt = new Date();
  }
}
