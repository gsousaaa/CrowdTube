export type AnalyticsPeriod = {
  from: Date;
  to: Date;
};

export type CreatorAnalyticsData = {
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

export interface AnalyticsRepository {
  getCreatorAnalytics(input: {
    userId: string;
    period: AnalyticsPeriod;
  }): Promise<CreatorAnalyticsData>;
}
