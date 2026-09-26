import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Campaign } from "../../../src/entities/campaign";
import { AppError } from "../../../src/errors/app-error";
import type { CampaignRepository } from "../../../src/repository/campaign-repository";
import { CreateCampaignUseCase } from "../../../src/usecases/campaign/create-campaign-use-case";
import { GetPublicCampaignByIdUseCase } from "../../../src/usecases/campaign/get-public-campaign-by-id-use-case";
import { ListCreatorCampaignsUseCase } from "../../../src/usecases/campaign/list-creator-campaigns-use-case";
import { SearchPublicCampaignsUseCase } from "../../../src/usecases/campaign/search-public-campaigns-use-case";

class InMemoryCampaignRepository implements CampaignRepository {
  readonly items: Campaign[] = [];

  findById(id: string): Promise<Campaign | null> {
    return Promise.resolve(this.items.find((item) => item.id === id) ?? null);
  }

  findByMetadataId(metadataId: string): Promise<Campaign | null> {
    return Promise.resolve(
      this.items.find((item) => item.metadataId === metadataId) ?? null,
    );
  }

  findByOnchainReference(input: {
    chainId: number;
    contractAddress: string;
    onchainCampaignId: string;
  }): Promise<Campaign | null> {
    return Promise.resolve(
      this.items.find(
        (item) =>
          item.chainId === input.chainId &&
          item.contractAddress === input.contractAddress.toLowerCase() &&
          item.onchainCampaignId === input.onchainCampaignId,
      ) ?? null,
    );
  }

  markPendingOnchain(input: {
    campaignId: string;
    creatorId: string;
    chainId: number;
    contractAddress: string;
    transactionHash: string;
  }): Promise<boolean> {
    const campaign = this.items.find(
      (item) =>
        item.id === input.campaignId &&
        item.creatorId === input.creatorId &&
        item.status === "draft",
    );
    if (!campaign) return Promise.resolve(false);

    campaign.chainId = input.chainId;
    campaign.contractAddress = input.contractAddress;
    campaign.creationTransactionHash = input.transactionHash;
    campaign.status = "pending_onchain";
    campaign.updatedAt = new Date();
    return Promise.resolve(true);
  }

  findByCreatorId(creatorId: string): Promise<Campaign[]> {
    return Promise.resolve(
      this.items.filter((item) => item.creatorId === creatorId),
    );
  }

  searchPublished(input: {
    search: string;
    offset: number;
    limit: number;
  }): Promise<{ campaigns: Campaign[]; total: number }> {
    const matches = this.items.filter(
      (item) =>
        item.status === "published" &&
        (!input.search || item.searchText.includes(input.search)),
    );
    return Promise.resolve({
      campaigns: matches.slice(input.offset, input.offset + input.limit),
      total: matches.length,
    });
  }

  save(entity: Campaign): Promise<Campaign> {
    this.items.push(entity);
    return Promise.resolve(entity);
  }

  async remove(entity: Campaign): Promise<void> {
    const index = this.items.indexOf(entity);
    if (index >= 0) this.items.splice(index, 1);
  }
}

const creatorId = "c5b54171-8094-4235-a52b-7500633642d7";

const validInput = {
  creatorId,
  title: "Open programming laboratory",
  category: "education" as const,
  description: "Equipment for a new series of practical classes.",
  youtubeUrl: "https://youtube.com/@creator",
};

describe("campaign use cases", () => {
  it("persists a draft and lists it only for its creator", async () => {
    const repository = new InMemoryCampaignRepository();
    const createCampaign = new CreateCampaignUseCase(repository);
    const listCampaigns = new ListCreatorCampaignsUseCase(repository);

    const created = await createCampaign.execute(validInput);
    const ownerCampaigns = await listCampaigns.execute(creatorId);
    const otherCampaigns = await listCampaigns.execute(
      "3be44dd4-6ee5-4e77-835d-ab5ae22938e2",
    );

    assert.equal(ownerCampaigns[0], created);
    assert.equal(otherCampaigns.length, 0);
  });

  it("rejects an image object owned by another user", async () => {
    const repository = new InMemoryCampaignRepository();
    const createCampaign = new CreateCampaignUseCase(repository);

    await assert.rejects(
      createCampaign.execute({
        ...validInput,
        imageObjectKey:
          "users/3be44dd4-6ee5-4e77-835d-ab5ae22938e2/" +
          "campaign-image/69cc5f83-e496-4226-8622-daba1b38c21e-cover.png",
      }),
      (error: unknown) =>
        error instanceof AppError &&
        error.code === "CAMPAIGN_IMAGE_ACCESS_DENIED",
    );
    assert.equal(repository.items.length, 0);
  });

  it("normalizes public search and excludes drafts", async () => {
    const repository = new InMemoryCampaignRepository();
    const published = await new CreateCampaignUseCase(repository).execute({
      ...validInput,
      title: "Educação Web3 para iniciantes",
    });
    published.status = "published";
    await new CreateCampaignUseCase(repository).execute({
      ...validInput,
      title: "Educação em Solidity",
    });
    const searchCampaigns = new SearchPublicCampaignsUseCase(repository);

    const result = await searchCampaigns.execute({
      search: "educação!!!",
      page: 1,
      pageSize: 12,
    });

    assert.equal(result.campaigns.length, 1);
    assert.equal(result.campaigns[0], published);
    assert.equal(result.pagination.total, 1);
    assert.equal(result.pagination.totalPages, 1);
  });

  it("returns a published campaign by its public identifier", async () => {
    const repository = new InMemoryCampaignRepository();
    const campaign = await new CreateCampaignUseCase(repository).execute(
      validInput,
    );
    campaign.status = "published";
    const getCampaign = new GetPublicCampaignByIdUseCase(repository);

    const result = await getCampaign.execute(campaign.id);

    assert.equal(result, campaign);
  });

  it("does not expose a draft on the public details route", async () => {
    const repository = new InMemoryCampaignRepository();
    const campaign = await new CreateCampaignUseCase(repository).execute(
      validInput,
    );
    const getCampaign = new GetPublicCampaignByIdUseCase(repository);

    await assert.rejects(
      getCampaign.execute(campaign.id),
      (error: unknown) =>
        error instanceof AppError && error.code === "CAMPAIGN_NOT_FOUND",
    );
  });
});
