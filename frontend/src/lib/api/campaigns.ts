import { apiRequest } from "./client";

export type CampaignCategory =
  | "education"
  | "entertainment"
  | "science"
  | "games"
  | "other";

export type ApiCampaign = {
  id: string;
  creatorId: string;
  metadataId: `0x${string}`;
  chainId: number | null;
  contractAddress: string | null;
  onchainCampaignId: string | null;
  creationTransactionHash: string | null;
  title: string;
  category: CampaignCategory;
  description: string;
  youtubeUrl: string;
  imageObjectKey: string | null;
  status: "draft" | "pending_onchain" | "published" | "failed";
  createdAt: string;
  updatedAt: string;
};

export type CreateCampaignInput = {
  title: string;
  category: CampaignCategory;
  description: string;
  youtubeUrl: string;
  imageObjectKey?: string | null;
};

export type UpdateCampaignInput = Partial<CreateCampaignInput>;

export function createCampaignDraft(input: CreateCampaignInput): Promise<ApiCampaign> {
  return apiRequest("/admin/campaigns", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCampaign(
  campaignId: string,
  input: UpdateCampaignInput,
): Promise<ApiCampaign> {
  return apiRequest(`/admin/campaigns/${encodeURIComponent(campaignId)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function recordCampaignCreationTransaction(
  campaignId: string,
  input: { chainId: number; contractAddress: string; transactionHash: string },
): Promise<ApiCampaign> {
  return apiRequest(`/admin/campaigns/${encodeURIComponent(campaignId)}/creation-transaction`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listMyCampaigns(): Promise<ApiCampaign[]> {
  return apiRequest("/admin/campaigns");
}

export function getPublicCampaign(campaignId: string): Promise<ApiCampaign> {
  return apiRequest(`/campaigns/${encodeURIComponent(campaignId)}`);
}

export type PublicCampaignSearchResult = {
  campaigns: ApiCampaign[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export function searchPublicCampaigns(input: {
  search: string;
  page: number;
  pageSize?: number;
}): Promise<PublicCampaignSearchResult> {
  const query = new URLSearchParams({
    search: input.search,
    page: String(input.page),
    pageSize: String(input.pageSize ?? 12),
  });
  return apiRequest(`/campaigns?${query}`);
}
