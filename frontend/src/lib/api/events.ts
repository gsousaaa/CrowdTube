export const CAMPAIGNS_UPDATED_EVENT = "crowdtube:api-campaigns-updated";

export function notifyCampaignsUpdated() {
  window.dispatchEvent(new Event(CAMPAIGNS_UPDATED_EVENT));
}
