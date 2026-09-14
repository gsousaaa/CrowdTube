import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { keccak256, parseEther, stringToHex } from "viem";

const FIRST_METADATA_ID = keccak256(stringToHex("backend-campaign-1"));
const SECOND_METADATA_ID = keccak256(stringToHex("backend-campaign-2"));
const GOAL = parseEther("5");
const DONATION = parseEther("1");
const NO_DEADLINE = 0n;

describe("CrowdTubeCampaigns", async function () {
  const { viem, networkHelpers } = await network.create();

  async function deployCampaignsFixture() {
    const [creator, secondCreator, donor, stranger] =
      await viem.getWalletClients();
    const contract = await viem.deployContract("CrowdTubeCampaigns");

    return { contract, creator, secondCreator, donor, stranger };
  }

  async function createCampaign(
    contract: Awaited<ReturnType<typeof viem.deployContract>>,
    creator: Awaited<ReturnType<typeof viem.getWalletClients>>[number],
    metadataId = FIRST_METADATA_ID,
  ) {
    await contract.write.createCampaign([metadataId, GOAL, NO_DEADLINE], {
      account: creator.account,
    });
  }

  it("creates campaigns with sequential identifiers and their own creators", async function () {
    const { contract, creator, secondCreator } =
      await networkHelpers.loadFixture(deployCampaignsFixture);

    await viem.assertions.emitWithArgs(
      contract.write.createCampaign([FIRST_METADATA_ID, GOAL, NO_DEADLINE], {
        account: creator.account,
      }),
      contract,
      "CampaignCreated",
      [1n, creator.account.address, FIRST_METADATA_ID, GOAL, NO_DEADLINE],
    );

    await createCampaign(contract, secondCreator, SECOND_METADATA_ID);

    const firstCampaign = await contract.read.getCampaign([1n]);
    const secondCampaign = await contract.read.getCampaign([2n]);

    assert.equal(firstCampaign.creator.toLowerCase(), creator.account.address.toLowerCase());
    assert.equal(secondCampaign.creator.toLowerCase(), secondCreator.account.address.toLowerCase());
    assert.equal(firstCampaign.metadataId, FIRST_METADATA_ID);
    assert.equal(secondCampaign.metadataId, SECOND_METADATA_ID);
    assert.equal(await contract.read.nextCampaignId(), 3n);
  });

  it("rejects a campaign without a metadata identifier", async function () {
    const { contract, creator } =
      await networkHelpers.loadFixture(deployCampaignsFixture);

    await viem.assertions.revertWith(
      contract.write.createCampaign([
        `0x${"0".repeat(64)}`,
        GOAL,
        NO_DEADLINE,
      ], {
        account: creator.account,
      }),
      "Metadata id is required",
    );
  });

  it("rejects a campaign with a zero target", async function () {
    const { contract, creator } =
      await networkHelpers.loadFixture(deployCampaignsFixture);

    await viem.assertions.revertWith(
      contract.write.createCampaign([FIRST_METADATA_ID, 0n, NO_DEADLINE], {
        account: creator.account,
      }),
      "Goal must be greater than zero",
    );
  });

  it("stores zero as a campaign without a deadline", async function () {
    const { contract, creator } =
      await networkHelpers.loadFixture(deployCampaignsFixture);

    await createCampaign(contract, creator);

    assert.equal((await contract.read.getCampaign([1n])).deadline, NO_DEADLINE);
  });

  it("rejects a deadline that is not in the future", async function () {
    const { contract, creator } =
      await networkHelpers.loadFixture(deployCampaignsFixture);
    const currentTimestamp = BigInt(await networkHelpers.time.latest());

    await viem.assertions.revertWith(
      contract.write.createCampaign(
        [FIRST_METADATA_ID, GOAL, currentTimestamp],
        { account: creator.account },
      ),
      "Deadline must be in the future",
    );
  });

  it("records donations in the selected campaign only", async function () {
    const { contract, creator, secondCreator, donor } =
      await networkHelpers.loadFixture(deployCampaignsFixture);

    await createCampaign(contract, creator);
    await createCampaign(contract, secondCreator, SECOND_METADATA_ID);

    await viem.assertions.emitWithArgs(
      contract.write.donate([2n], {
        account: donor.account,
        value: DONATION,
      }),
      contract,
      "DonationReceived",
      [2n, donor.account.address, DONATION],
    );

    assert.equal((await contract.read.getCampaign([1n])).totalRaised, 0n);
    assert.equal((await contract.read.getCampaign([2n])).totalRaised, DONATION);
  });

  it("rejects zero-value donations and donations to unknown campaigns", async function () {
    const { contract, creator, donor } =
      await networkHelpers.loadFixture(deployCampaignsFixture);

    await createCampaign(contract, creator);

    await viem.assertions.revertWith(
      contract.write.donate([1n], {
        account: donor.account,
        value: 0n,
      }),
      "Donation must be greater than zero",
    );

    await viem.assertions.revertWith(
      contract.write.donate([999n], {
        account: donor.account,
        value: DONATION,
      }),
      "Campaign does not exist",
    );
  });

  it("rejects withdrawals from an address that is not the campaign creator", async function () {
    const { contract, creator, donor, stranger } =
      await networkHelpers.loadFixture(deployCampaignsFixture);

    await createCampaign(contract, creator);
    await contract.write.donate([1n], {
      account: donor.account,
      value: DONATION,
    });

    await viem.assertions.revertWith(
      contract.write.withdraw([1n, DONATION], {
        account: stranger.account,
      }),
      "Only campaign creator can perform this action",
    );
  });

  it("allows the creator to make partial withdrawals at any time", async function () {
    const { contract, creator, donor } =
      await networkHelpers.loadFixture(deployCampaignsFixture);
    const withdrawal = parseEther("0.4");

    await createCampaign(contract, creator);
    await contract.write.donate([1n], {
      account: donor.account,
      value: DONATION,
    });

    await viem.assertions.emitWithArgs(
      contract.write.withdraw([1n, withdrawal], {
        account: creator.account,
      }),
      contract,
      "FundsWithdrawn",
      [1n, creator.account.address, withdrawal],
    );

    const campaign = await contract.read.getCampaign([1n]);
    assert.equal(campaign.totalRaised, DONATION);
    assert.equal(campaign.totalWithdrawn, withdrawal);
    assert.equal(await contract.read.getAvailableBalance([1n]), DONATION - withdrawal);
  });

  it("rejects zero withdrawals and withdrawals greater than the available balance", async function () {
    const { contract, creator, donor } =
      await networkHelpers.loadFixture(deployCampaignsFixture);

    await createCampaign(contract, creator);
    await contract.write.donate([1n], {
      account: donor.account,
      value: DONATION,
    });

    await viem.assertions.revertWith(
      contract.write.withdraw([1n, 0n], {
        account: creator.account,
      }),
      "Withdrawal amount must be greater than zero",
    );

    await viem.assertions.revertWith(
      contract.write.withdraw([1n, DONATION + 1n], {
        account: creator.account,
      }),
      "Insufficient campaign balance",
    );
  });

  it("prevents donations to an inactive campaign", async function () {
    const { contract, creator, donor } =
      await networkHelpers.loadFixture(deployCampaignsFixture);

    await createCampaign(contract, creator);
    await contract.write.setCampaignStatus([1n, false], {
      account: creator.account,
    });

    await viem.assertions.revertWith(
      contract.write.donate([1n], {
        account: donor.account,
        value: DONATION,
      }),
      "Campaign is not active",
    );
  });

  it("prevents donations after the campaign deadline", async function () {
    const { contract, creator, donor } =
      await networkHelpers.loadFixture(deployCampaignsFixture);
    const currentTimestamp = BigInt(await networkHelpers.time.latest());
    const deadline = currentTimestamp + 3_600n;

    await contract.write.createCampaign(
      [FIRST_METADATA_ID, GOAL, deadline],
      { account: creator.account },
    );
    await networkHelpers.time.increaseTo(deadline + 1n);

    await viem.assertions.revertWith(
      contract.write.donate([1n], {
        account: donor.account,
        value: DONATION,
      }),
      "Campaign deadline has passed",
    );
  });

  it("allows only the creator to change the campaign status", async function () {
    const { contract, creator, stranger } =
      await networkHelpers.loadFixture(deployCampaignsFixture);

    await createCampaign(contract, creator);

    await viem.assertions.revertWith(
      contract.write.setCampaignStatus([1n, false], {
        account: stranger.account,
      }),
      "Only campaign creator can perform this action",
    );

    await viem.assertions.emitWithArgs(
      contract.write.setCampaignStatus([1n, false], {
        account: creator.account,
      }),
      contract,
      "CampaignStatusChanged",
      [1n, false],
    );

    assert.equal((await contract.read.getCampaign([1n])).active, false);
  });
});
