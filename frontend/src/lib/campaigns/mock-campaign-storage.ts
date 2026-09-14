export type MockCampaignMetadata = {
  campaignId: string;
  metadataId: `0x${string}`;
  title: string;
  category: string;
  description: string;
  youtubeUrl: string;
  imageReference: string;
  goalEth: string;
  deadline: string | null;
  creationTransactionHash: `0x${string}`;
};

const STORAGE_KEY = "crowdtube:campaign-metadata";
export const MOCK_CAMPAIGNS_UPDATED_EVENT = "crowdtube:campaigns-updated";

export function getMockCampaignMetadata(): MockCampaignMetadata[] {
  const storedCampaigns = window.localStorage.getItem(STORAGE_KEY);

  if (!storedCampaigns) return [];

  try {
    return JSON.parse(storedCampaigns) as MockCampaignMetadata[];
  } catch {
    return [];
  }
}

export function saveMockCampaignMetadata(metadata: MockCampaignMetadata) {
  const campaigns = getMockCampaignMetadata();
  const existingCampaignIndex = campaigns.findIndex(
    (campaign) => campaign.campaignId === metadata.campaignId,
  );

  if (existingCampaignIndex >= 0) {
    campaigns[existingCampaignIndex] = metadata;
  } else {
    campaigns.push(metadata);
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
  window.dispatchEvent(new Event(MOCK_CAMPAIGNS_UPDATED_EVENT));
}
