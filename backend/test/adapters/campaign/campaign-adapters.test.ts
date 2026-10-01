import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { makeCreateCampaignAdapter } from "../../../src/adapters/campaign/create-campaign-adapter";
import { makeGetPublicCampaignByIdAdapter } from "../../../src/adapters/campaign/get-public-campaign-by-id-adapter";
import { makeListCreatorCampaignsAdapter } from "../../../src/adapters/campaign/list-creator-campaigns-adapter";
import { makeSearchPublicCampaignsAdapter } from "../../../src/adapters/campaign/search-public-campaigns-adapter";
import { makeRecordCampaignCreationTransactionAdapter } from "../../../src/adapters/campaign/record-campaign-creation-transaction-adapter";
import { makeUpdateCampaignAdapter } from "../../../src/adapters/campaign/update-campaign-adapter";
import { Campaign } from "../../../src/entities/campaign";
import { AppError } from "../../../src/errors/app-error";

const userId = "c5b54171-8094-4235-a52b-7500633642d7";

function makeRequest(body: unknown, authenticated = true) {
  return {
    body,
    params: {},
    query: {},
    headers: {},
    cookies: {},
    authenticatedUser: authenticated
      ? {
          sessionId: "session-id",
          userId,
          walletId: "wallet-id",
          walletAddress: "0x0000000000000000000000000000000000000001",
        }
      : null,
  };
}

describe("campaign adapters", () => {
  it("creates metadata for the authenticated user", async () => {
    const adapter = makeCreateCampaignAdapter({
      createCampaign: {
        execute: (input) => {
          assert.equal(input.creatorId, userId);
          return Promise.resolve(Campaign.create(input));
        },
      },
    });

    const response = await adapter(
      makeRequest({
        title: "Open programming laboratory",
        category: "education",
        description: "Equipment for a new series of practical classes.",
        youtubeUrl: "https://youtube.com/@creator",
      }),
    );

    assert.equal(response.statusCode, 201);
    assert.equal(response.body.creatorId, userId);
  });

  it("accepts a transaction hash only from an authenticated creator", async () => {
    const campaign = Campaign.create({
      creatorId: userId,
      title: "Open programming laboratory",
      category: "education",
      description: "Equipment for a new series of practical classes.",
      youtubeUrl: "https://youtube.com/@creator",
    });
    campaign.status = "pending_onchain";
    const adapter = makeRecordCampaignCreationTransactionAdapter({
      recordCampaignCreationTransaction: {
        execute: (input) => {
          assert.deepEqual(input, {
            campaignId: campaign.id,
            creatorId: userId,
            chainId: 31_337,
            contractAddress: `0x${"a".repeat(40)}`,
            transactionHash: `0x${"b".repeat(64)}`,
          });
          return Promise.resolve(campaign);
        },
      },
    });
    const request = makeRequest({
      chainId: 31_337,
      contractAddress: `0x${"a".repeat(40)}`,
      transactionHash: `0x${"b".repeat(64)}`,
    });
    request.params = { campaignId: campaign.id };

    const response = await adapter(request);

    assert.equal(response.statusCode, 202);
    assert.equal(response.body, campaign);
    await assert.rejects(
      adapter({ ...request, authenticatedUser: null }),
      (error: unknown) => error instanceof AppError && error.code === "UNAUTHENTICATED",
    );
  });

  it("rejects malformed transaction hashes", async () => {
    const adapter = makeRecordCampaignCreationTransactionAdapter({
      recordCampaignCreationTransaction: {
        execute: () => { throw new Error("Should not be called"); },
      },
    });
    const request = makeRequest({
      chainId: 31_337,
      contractAddress: `0x${"a".repeat(40)}`,
      transactionHash: "0x1234",
    });
    request.params = { campaignId: "c5b54171-8094-4235-a52b-7500633642d7" };

    await assert.rejects(
      adapter(request),
      (error: unknown) =>
        error instanceof AppError && error.code === "INVALID_CAMPAIGN_CREATION_TRANSACTION",
    );
  });

  it("updates only the campaign fields sent by its authenticated creator", async () => {
    const campaign = Campaign.create({
      creatorId: userId,
      title: "Open programming laboratory",
      category: "education",
      description: "Equipment for a new series of practical classes.",
      youtubeUrl: "https://youtube.com/@creator",
    });
    const adapter = makeUpdateCampaignAdapter({
      updateCampaign: {
        execute: (input) => {
          assert.deepEqual(input, {
            campaignId: campaign.id,
            creatorId: userId,
            title: "Updated campaign title",
            imageObjectKey: null,
          });
          campaign.updateMetadata(input);
          return Promise.resolve(campaign);
        },
      },
    });
    const request = makeRequest({
      title: "  Updated campaign title  ",
      imageObjectKey: null,
    });
    request.params = { campaignId: campaign.id };

    const response = await adapter(request);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.title, "Updated campaign title");
    assert.equal(response.body.imageObjectKey, null);
  });

  it("rejects empty, invalid and unauthenticated campaign updates", async () => {
    const adapter = makeUpdateCampaignAdapter({
      updateCampaign: {
        execute: () => { throw new Error("Should not be called"); },
      },
    });
    const emptyRequest = makeRequest({});
    emptyRequest.params = { campaignId: userId };
    const invalidRequest = makeRequest({ youtubeUrl: "https://example.com" });
    invalidRequest.params = { campaignId: userId };

    await assert.rejects(
      adapter(emptyRequest),
      (error: unknown) =>
        error instanceof AppError && error.code === "INVALID_CAMPAIGN_DATA",
    );
    await assert.rejects(
      adapter(invalidRequest),
      (error: unknown) =>
        error instanceof AppError && error.code === "INVALID_CAMPAIGN_DATA",
    );
    await assert.rejects(
      adapter({ ...emptyRequest, authenticatedUser: null }),
      (error: unknown) =>
        error instanceof AppError && error.code === "UNAUTHENTICATED",
    );
  });

  it("requires authentication when listing creator campaigns", async () => {
    const adapter = makeListCreatorCampaignsAdapter({
      listCreatorCampaigns: { execute: () => Promise.resolve([]) },
    });

    await assert.rejects(
      adapter(makeRequest(undefined, false)),
      (error: unknown) =>
        error instanceof AppError && error.code === "UNAUTHENTICATED",
    );
  });

  it("allows visitors to search published campaigns", async () => {
    const adapter = makeSearchPublicCampaignsAdapter({
      searchPublicCampaigns: {
        execute: (input) => {
          assert.deepEqual(input, {
            search: "web3",
            page: 2,
            pageSize: 6,
          });
          return Promise.resolve({
            campaigns: [],
            pagination: { page: 2, pageSize: 6, total: 0, totalPages: 0 },
          });
        },
      },
    });
    const request = makeRequest(undefined, false);
    request.query = { search: "web3", page: "2", pageSize: "6" };

    const response = await adapter(request);

    assert.equal(response.statusCode, 200);
  });

  it("allows visitors to open a published campaign by id", async () => {
    const campaign = Campaign.create({
      creatorId: userId,
      title: "Open programming laboratory",
      category: "education",
      description: "Equipment for a new series of practical classes.",
      youtubeUrl: "https://youtube.com/@creator",
    });
    campaign.status = "published";
    const adapter = makeGetPublicCampaignByIdAdapter({
      getPublicCampaignById: {
        execute: (campaignId) => {
          assert.equal(campaignId, campaign.id);
          return Promise.resolve(campaign);
        },
      },
    });
    const request = makeRequest(undefined, false);
    request.params = { campaignId: campaign.id };

    const response = await adapter(request);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body, campaign);
  });
});
