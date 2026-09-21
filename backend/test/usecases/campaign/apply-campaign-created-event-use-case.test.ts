import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Campaign } from "../../../src/entities/campaign";
import { UserWallet } from "../../../src/entities/user-wallet";
import type { CampaignRepository } from "../../../src/repository/campaign-repository";
import type { UserWalletRepository } from "../../../src/repository/user-wallet-repository";
import {
  ApplyCampaignCreatedEventUseCase,
  type CampaignCreatedEvent,
} from "../../../src/usecases/campaign/apply-campaign-created-event-use-case";

const creatorId = "c5b54171-8094-4235-a52b-7500633642d7";
const creatorAddress = "0x0000000000000000000000000000000000000001";

function makeScenario() {
  const campaign = Campaign.create({
    creatorId,
    title: "Open programming laboratory",
    category: "education",
    description: "Equipment for a new series of practical classes.",
    youtubeUrl: "https://youtube.com/@creator",
  });
  const wallet = UserWallet.create({ userId: creatorId, walletAddress: creatorAddress });
  let saves = 0;

  const campaigns: CampaignRepository = {
    findById: (id) => Promise.resolve(id === campaign.id ? campaign : null),
    findByMetadataId: (id) => Promise.resolve(id === campaign.metadataId ? campaign : null),
    findByCreatorId: () => Promise.resolve([campaign]),
    searchPublished: () => Promise.resolve({ campaigns: [], total: 0 }),
    save: (value) => {
      saves += 1;
      return Promise.resolve(value);
    },
    remove: () => Promise.resolve(),
  };
  const userWallets: UserWalletRepository = {
    findById: (id) => Promise.resolve(id === wallet.id ? wallet : null),
    findByWalletAddress: (address) =>
      Promise.resolve(address.toLowerCase() === creatorAddress ? wallet : null),
    findByUserId: () => Promise.resolve([wallet]),
    save: (value) => Promise.resolve(value),
    remove: () => Promise.resolve(),
  };
  const event: CampaignCreatedEvent = {
    chainId: 31_337,
    contractAddress: "0x0000000000000000000000000000000000000002",
    campaignId: "7",
    creator: creatorAddress,
    metadataId: campaign.metadataId,
    transactionHash: `0x${"a".repeat(64)}`,
  };

  return {
    campaign,
    event,
    getSaveCount: () => saves,
    useCase: new ApplyCampaignCreatedEventUseCase(campaigns, userWallets),
  };
}

describe("ApplyCampaignCreatedEventUseCase", () => {
  it("publishes a draft only when the event creator owns a linked wallet", async () => {
    const { campaign, event, useCase, getSaveCount } = makeScenario();

    const result = await useCase.execute(event);

    assert.equal(result.status, "published");
    assert.equal(campaign.status, "published");
    assert.equal(campaign.chainId, event.chainId);
    assert.equal(campaign.contractAddress, event.contractAddress);
    assert.equal(campaign.onchainCampaignId, event.campaignId);
    assert.equal(campaign.creationTransactionHash, event.transactionHash);
    assert.equal(getSaveCount(), 1);
  });

  it("does not publish an event from a different wallet", async () => {
    const { campaign, event, useCase, getSaveCount } = makeScenario();

    const result = await useCase.execute({
      ...event,
      creator: "0x0000000000000000000000000000000000000003",
    });

    assert.equal(result.status, "creator_mismatch");
    assert.equal(campaign.status, "draft");
    assert.equal(getSaveCount(), 0);
  });

  it("ignores an event without a matching metadata identifier", async () => {
    const { campaign, event, useCase } = makeScenario();

    const result = await useCase.execute({
      ...event,
      metadataId: `0x${"b".repeat(64)}`,
    });

    assert.equal(result.status, "unmatched");
    assert.equal(campaign.status, "draft");
  });

  it("is idempotent for the same event and rejects a conflicting publication", async () => {
    const { event, useCase, getSaveCount } = makeScenario();

    await useCase.execute(event);
    const repeated = await useCase.execute(event);
    const conflicting = await useCase.execute({ ...event, campaignId: "8" });

    assert.equal(repeated.status, "already_published");
    assert.equal(conflicting.status, "conflict");
    assert.equal(getSaveCount(), 1);
  });
});
