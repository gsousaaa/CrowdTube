import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Campaign } from "../../src/entities/campaign";

describe("Campaign", () => {
  it("creates offchain metadata as a recoverable draft", () => {
    const campaign = Campaign.create({
      creatorId: "c5b54171-8094-4235-a52b-7500633642d7",
      title: "  Open programming laboratory  ",
      category: "education",
      description: "  Equipment for a new series of practical classes.  ",
      youtubeUrl: "  https://youtube.com/@creator  ",
    });

    assert.match(campaign.id, /^[0-9a-f-]{36}$/);
    assert.match(campaign.metadataId, /^0x[0-9a-f]{64}$/);
    assert.equal(campaign.title, "Open programming laboratory");
    assert.equal(campaign.status, "draft");
    assert.equal(
      campaign.searchText,
      "open programming laboratory education equipment for a new series of practical classes",
    );
    assert.equal(campaign.chainId, null);
    assert.equal(campaign.onchainCampaignId, null);
  });

  it("updates only editable metadata and rebuilds its search text", () => {
    const campaign = Campaign.create({
      creatorId: "c5b54171-8094-4235-a52b-7500633642d7",
      title: "Open programming laboratory",
      category: "education",
      description: "Equipment for a new series of practical classes.",
      youtubeUrl: "https://youtube.com/@creator",
    });
    const originalId = campaign.id;
    const originalMetadataId = campaign.metadataId;
    campaign.status = "published";
    campaign.chainId = 31_337;
    campaign.onchainCampaignId = "9";
    campaign.updatedAt = new Date(0);

    campaign.updateMetadata({
      title: "  Solidity for creators  ",
      category: "science",
      imageObjectKey: "  users/creator/campaign-image/cover.png  ",
    });

    assert.equal(campaign.id, originalId);
    assert.equal(campaign.metadataId, originalMetadataId);
    assert.equal(campaign.status, "published");
    assert.equal(campaign.chainId, 31_337);
    assert.equal(campaign.onchainCampaignId, "9");
    assert.equal(campaign.title, "Solidity for creators");
    assert.equal(campaign.category, "science");
    assert.equal(
      campaign.searchText,
      "solidity for creators science equipment for a new series of practical classes",
    );
    assert.equal(
      campaign.imageObjectKey,
      "users/creator/campaign-image/cover.png",
    );
    assert.ok(campaign.updatedAt.getTime() > 0);
  });
});
