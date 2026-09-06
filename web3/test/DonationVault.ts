import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { parseEther } from "viem";

const CAMPAIGN_ID = 1n;
const DONATION = parseEther("1");

describe("DonationVault", async function () {
  const { viem, networkHelpers } = await network.create();
  const publicClient = await viem.getPublicClient();

  async function deployDonationVaultFixture() {
    const [owner, donor, stranger] = await viem.getWalletClients();
    const vault = await viem.deployContract("DonationVault", [CAMPAIGN_ID]);

    return { vault, owner, donor, stranger };
  }

  it("stores the deployer as owner and the campaign identifier", async function () {
    const { vault, owner } = await networkHelpers.loadFixture(
      deployDonationVaultFixture,
    );

    assert.equal(
      (await vault.read.owner()).toLowerCase(),
      owner.account.address.toLowerCase(),
    );
    assert.equal(await vault.read.campaignId(), CAMPAIGN_ID);
  });

  it("records a donation and emits its campaign, donor and value", async function () {
    const { vault, donor } = await networkHelpers.loadFixture(
      deployDonationVaultFixture,
    );

    await viem.assertions.emitWithArgs(
      vault.write.donate({ account: donor.account, value: DONATION }),
      vault,
      "DonationReceived",
      [CAMPAIGN_ID, donor.account.address, DONATION],
    );

    assert.equal(await vault.read.donations([donor.account.address]), DONATION);
    assert.equal(await vault.read.totalDonated(), DONATION);
    assert.equal(await publicClient.getBalance({ address: vault.address }), DONATION);
  });

  it("rejects a zero-value donation", async function () {
    const { vault, donor } = await networkHelpers.loadFixture(
      deployDonationVaultFixture,
    );

    await viem.assertions.revertWith(
      vault.write.donate({ account: donor.account, value: 0n }),
      "Donation must be greater than zero",
    );
  });

  it("rejects a withdrawal made by an address that is not the owner", async function () {
    const { vault, donor, stranger } = await networkHelpers.loadFixture(
      deployDonationVaultFixture,
    );

    await vault.write.donate({ account: donor.account, value: DONATION });

    await viem.assertions.revertWith(
      vault.write.withdraw({ account: stranger.account }),
      "Only owner can withdraw",
    );
  });

  it("allows the owner to withdraw the full contract balance", async function () {
    const { vault, owner, donor } = await networkHelpers.loadFixture(
      deployDonationVaultFixture,
    );

    await vault.write.donate({ account: donor.account, value: DONATION });

    await viem.assertions.emitWithArgs(
      vault.write.withdraw({ account: owner.account }),
      vault,
      "Withdrawal",
      [owner.account.address, DONATION],
    );

    assert.equal(await publicClient.getBalance({ address: vault.address }), 0n);
  });
});
