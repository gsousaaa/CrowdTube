import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CrowdTubeCampaignsModule", (m) => {
  const crowdTubeCampaigns = m.contract("CrowdTubeCampaigns");

  return { crowdTubeCampaigns };
});
