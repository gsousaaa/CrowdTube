import { apiRequest } from "./client";

export type CreatorAnalytics = {
  period: {
    from: string;
    to: string;
  };
  summary: {
    totalRaisedWei: string;
    periodRaisedWei: string;
    periodDonationCount: number;
    periodAverageDonationWei: string;
  };
  timeline: Array<{
    date: string;
    amountWei: string;
    donationCount: number;
  }>;
  campaigns: Array<{
    campaignId: string;
    title: string;
    onchainCampaignId: string;
    totalRaisedWei: string;
    periodRaisedWei: string;
    periodDonationCount: number;
  }>;
};

export function getCreatorAnalytics(input: {
  from: string;
  to: string;
}): Promise<CreatorAnalytics> {
  const query = new URLSearchParams(input);
  return apiRequest(`/admin/analytics?${query}`);
}
