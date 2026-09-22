import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Campaign } from "../../../src/entities/campaign";
import { AppError } from "../../../src/errors/app-error";
import { RecordCampaignCreationTransactionUseCase } from "../../../src/usecases/campaign/record-campaign-creation-transaction-use-case";

const creatorId = "c5b54171-8094-4235-a52b-7500633642d7";
const chainId = 31_337;
const contractAddress = `0x${"A".repeat(40)}`;
const transactionHash = `0x${"B".repeat(64)}`;

function makeHarness() {
  const campaign = Campaign.create({
    creatorId,
    title: "Open programming laboratory",
    category: "education",
    description: "Equipment for a new series of practical classes.",
    youtubeUrl: "https://youtube.com/@creator",
  });
  const repository = {
    findById: (id: string) => Promise.resolve(id === campaign.id ? campaign : null),
    markPendingOnchain: (input: {
      campaignId: string;
      creatorId: string;
      chainId: number;
      contractAddress: string;
      transactionHash: string;
    }) => {
      if (
        campaign.id !== input.campaignId ||
        campaign.creatorId !== input.creatorId ||
        campaign.status !== "draft"
      ) {
        return Promise.resolve(false);
      }
      campaign.chainId = input.chainId;
      campaign.contractAddress = input.contractAddress;
      campaign.creationTransactionHash = input.transactionHash;
      campaign.status = "pending_onchain";
      return Promise.resolve(true);
    },
  };
  const useCase = new RecordCampaignCreationTransactionUseCase(repository);
  const input = { campaignId: campaign.id, creatorId, chainId, contractAddress, transactionHash };
  return { campaign, useCase, input };
}

describe("RecordCampaignCreationTransactionUseCase", () => {
  it("records a submitted transaction without publishing the campaign", async () => {
    const { campaign, useCase, input } = makeHarness();

    const result = await useCase.execute(input);

    assert.equal(result, campaign);
    assert.equal(result.status, "pending_onchain");
    assert.equal(result.chainId, chainId);
    assert.equal(result.contractAddress, contractAddress.toLowerCase());
    assert.equal(result.creationTransactionHash, transactionHash.toLowerCase());
    assert.equal(result.onchainCampaignId, null);
  });

  it("accepts a retry with the same transaction", async () => {
    const { useCase, input } = makeHarness();

    await useCase.execute(input);
    const result = await useCase.execute(input);

    assert.equal(result.status, "pending_onchain");
  });

  it("rejects a different transaction after one has been recorded", async () => {
    const { useCase, input } = makeHarness();
    await useCase.execute(input);

    await assert.rejects(
      useCase.execute({ ...input, transactionHash: `0x${"c".repeat(64)}` }),
      (error: unknown) =>
        error instanceof AppError && error.code === "CAMPAIGN_CREATION_TRANSACTION_CONFLICT",
    );
  });

  it("does not reveal another creator's campaign", async () => {
    const { campaign, useCase, input } = makeHarness();

    await assert.rejects(
      useCase.execute({ ...input, creatorId: "3be44dd4-6ee5-4e77-835d-ab5ae22938e2" }),
      (error: unknown) => error instanceof AppError && error.code === "CAMPAIGN_NOT_FOUND",
    );
    assert.equal(campaign.status, "draft");
  });

  it("allows an idempotent retry after the indexer published the same transaction", async () => {
    const { campaign, useCase, input } = makeHarness();
    await useCase.execute(input);
    campaign.status = "published";
    campaign.onchainCampaignId = "1";

    const result = await useCase.execute(input);

    assert.equal(result.status, "published");
  });
});
