import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DonationVaultModule", (m) => {
  const campaignId = m.getParameter("campaignId", 1n);
  const donationVault = m.contract("DonationVault", [campaignId]);

  return { donationVault };
});
