import { apiRequest } from "./client";

export type DonationTransactionConfirmation = {
  status: "pending" | "confirmed";
  transactionHash: string;
  confirmations: number;
  requiredConfirmations: number;
  donationEvents: number;
  recordedEvents: number;
};

export type CampaignDonation = {
  chainId: number;
  donorAddress: string;
  amountWei: string;
  transactionHash: string;
  logIndex: number;
  blockNumber: string;
  occurredAt: string;
};

export type CampaignDonationHistory = {
  donations: CampaignDonation[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type CampaignDonationHistoryOptions = {
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
};

function getCampaignDonationHistory(
  path: string,
  campaignId: string,
  { page = 1, pageSize = 10, signal }: CampaignDonationHistoryOptions = {},
): Promise<CampaignDonationHistory> {
  const query = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  return apiRequest(
    `${path}/${encodeURIComponent(campaignId)}/donations?${query}`,
    { signal },
  );
}

export function getPublicCampaignDonations(
  campaignId: string,
  options?: CampaignDonationHistoryOptions,
): Promise<CampaignDonationHistory> {
  return getCampaignDonationHistory("/campaigns", campaignId, options);
}

export function getAdminCampaignDonations(
  campaignId: string,
  options?: CampaignDonationHistoryOptions,
): Promise<CampaignDonationHistory> {
  return getCampaignDonationHistory("/admin/campaigns", campaignId, options);
}

export function confirmDonationTransaction(
  transactionHash: string,
): Promise<DonationTransactionConfirmation> {
  return apiRequest("/donations/transactions", {
    method: "POST",
    body: JSON.stringify({ transactionHash }),
  });
}
