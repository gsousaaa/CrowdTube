import type { ApiCampaign } from "./campaigns";

export const CAMPAIGNS_UPDATED_EVENT = "crowdtube:api-campaigns-updated";
export const OPEN_CAMPAIGN_CREATION_EVENT = "crowdtube:open-campaign-creation";

export type CampaignCreationPrefill = {
  campaign: ApiCampaign;
  goalEth?: string;
  deadline?: string;
};

export function notifyCampaignsUpdated() {
  window.dispatchEvent(new Event(CAMPAIGNS_UPDATED_EVENT));
}

export function openCampaignCreation(prefill: CampaignCreationPrefill) {
  window.dispatchEvent(new CustomEvent(OPEN_CAMPAIGN_CREATION_EVENT, {
    detail: prefill,
  }));
}
