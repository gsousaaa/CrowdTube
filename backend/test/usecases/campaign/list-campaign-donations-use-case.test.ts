import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Campaign } from "../../../src/entities/campaign";
import { DonationEvent } from "../../../src/entities/donation-event";
import { AppError } from "../../../src/errors/app-error";
import type { CampaignRepository } from "../../../src/repository/campaign-repository";
import type { DonationEventRepository } from "../../../src/repository/donation-event-repository";
import { ListCampaignDonationsUseCase } from "../../../src/usecases/campaign/list-campaign-donations-use-case";

const creatorId = "c5b54171-8094-4235-a52b-7500633642d7";
const otherCreatorId = "3be44dd4-6ee5-4e77-835d-ab5ae22938e2";
const contractAddress = `0x${"a".repeat(40)}`;

function makeCampaign(status: "draft" | "published" = "published") {
  const campaign = Campaign.create({
    creatorId,
    title: "Open programming laboratory",
    category: "education",
    description: "Equipment for a new series of practical classes.",
    youtubeUrl: "https://youtube.com/@creator",
  });
  campaign.status = status;

  if (status === "published") {
    campaign.chainId = 11_155_111;
    campaign.contractAddress = contractAddress;
    campaign.onchainCampaignId = "7";
  }

  return campaign;
}

function makeCampaignRepository(campaign: Campaign): CampaignRepository {
  return {
    findById: (id) => Promise.resolve(id === campaign.id ? campaign : null),
    findByMetadataId: (metadataId) =>
      Promise.resolve(metadataId === campaign.metadataId ? campaign : null),
    findByOnchainReference: (input) =>
      Promise.resolve(
        input.chainId === campaign.chainId &&
          input.contractAddress.toLowerCase() === campaign.contractAddress &&
          input.onchainCampaignId === campaign.onchainCampaignId
          ? campaign
          : null,
      ),
    markPendingOnchain: () => Promise.resolve(false),
    findByCreatorId: (id) =>
      Promise.resolve(id === campaign.creatorId ? [campaign] : []),
    searchPublished: () =>
      Promise.resolve({
        campaigns: campaign.status === "published" ? [campaign] : [],
        total: campaign.status === "published" ? 1 : 0,
      }),
    save: (entity) => Promise.resolve(entity),
    remove: () => Promise.resolve(),
  };
}

function makeDonationRepository(
  items: DonationEvent[],
): DonationEventRepository {
  return {
    findById: (id) =>
      Promise.resolve(items.find((item) => item.id === id) ?? null),
    save: (entity) => Promise.resolve(entity),
    remove: () => Promise.resolve(),
    saveIfAbsent: () => Promise.resolve(true),
    findPending: () => Promise.resolve([]),
    findByCampaignReference: (input) => {
      const matches = items
        .filter(
          (item) =>
            item.chainId === input.chainId &&
            item.contractAddress === input.contractAddress.toLowerCase() &&
            item.onchainCampaignId === input.onchainCampaignId,
        )
        .sort((left, right) => {
          const blockDifference =
            BigInt(right.blockNumber) - BigInt(left.blockNumber);
          return blockDifference === 0n
            ? right.logIndex - left.logIndex
            : blockDifference > 0n
              ? 1
              : -1;
        });

      return Promise.resolve({
        donationEvents: matches.slice(
          input.offset,
          input.offset + input.limit,
        ),
        total: matches.length,
      });
    },
  };
}

describe("list campaign donations use case", () => {
  it("returns the published campaign donations newest first", async () => {
    const campaign = makeCampaign();
    const olderDonation = DonationEvent.create({
      chainId: 11_155_111,
      contractAddress,
      onchainCampaignId: "7",
      donorAddress: `0x${"1".repeat(40)}`,
      amountWei: "100000000000000000",
      transactionHash: `0x${"b".repeat(64)}`,
      logIndex: 1,
      blockNumber: "100",
      occurredAt: new Date("2026-10-01T12:00:00.000Z"),
    });
    const recentDonation = DonationEvent.create({
      chainId: 11_155_111,
      contractAddress,
      onchainCampaignId: "7",
      donorAddress: `0x${"2".repeat(40)}`,
      amountWei: "250000000000000000",
      transactionHash: `0x${"c".repeat(64)}`,
      logIndex: 0,
      blockNumber: "101",
      occurredAt: new Date("2026-10-02T12:00:00.000Z"),
    });
    const useCase = new ListCampaignDonationsUseCase(
      makeCampaignRepository(campaign),
      makeDonationRepository([olderDonation, recentDonation]),
    );

    const result = await useCase.execute({
      campaignId: campaign.id,
      page: 1,
      pageSize: 10,
    });

    assert.equal(result.donations[0]?.transactionHash, recentDonation.transactionHash);
    assert.equal(result.donations[0]?.occurredAt, "2026-10-02T12:00:00.000Z");
    assert.deepEqual(result.pagination, {
      page: 1,
      pageSize: 10,
      total: 2,
      totalPages: 1,
    });
  });

  it("hides drafts publicly but allows their creator to request the empty history", async () => {
    const campaign = makeCampaign("draft");
    const useCase = new ListCampaignDonationsUseCase(
      makeCampaignRepository(campaign),
      makeDonationRepository([]),
    );

    await assert.rejects(
      useCase.execute({ campaignId: campaign.id, page: 1, pageSize: 10 }),
      (error: unknown) =>
        error instanceof AppError && error.code === "CAMPAIGN_NOT_FOUND",
    );

    const result = await useCase.execute({
      campaignId: campaign.id,
      creatorId,
      page: 1,
      pageSize: 10,
    });
    assert.deepEqual(result.donations, []);
    assert.equal(result.pagination.total, 0);
  });

  it("does not expose a campaign history to another creator", async () => {
    const campaign = makeCampaign();
    const useCase = new ListCampaignDonationsUseCase(
      makeCampaignRepository(campaign),
      makeDonationRepository([]),
    );

    await assert.rejects(
      useCase.execute({
        campaignId: campaign.id,
        creatorId: otherCreatorId,
        page: 1,
        pageSize: 10,
      }),
      (error: unknown) =>
        error instanceof AppError && error.code === "CAMPAIGN_NOT_FOUND",
    );
  });
});
