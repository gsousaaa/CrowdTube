export const CONTRACT_DATA_UPDATED_EVENT = "crowdtube:contract-data-updated";

export function notifyContractDataUpdated() {
  window.dispatchEvent(new Event(CONTRACT_DATA_UPDATED_EVENT));
}
