import type { FastifyInstance } from "fastify";

export function registerSharedSchemas(app: FastifyInstance): void {
  app.addSchema({
    $id: "errorResponse",
    type: "object",
    required: ["error", "message"],
    properties: {
      error: { type: "string" },
      message: { type: "string" },
    },
  });

  app.addSchema({
    $id: "currentUserProfile",
    type: "object",
    required: [
      "id",
      "displayName",
      "bio",
      "youtubeChannelUrl",
      "avatarUrl",
      "authenticatedWalletAddress",
      "wallets",
    ],
    properties: {
      id: { type: "string", format: "uuid" },
      displayName: { type: ["string", "null"] },
      bio: { type: ["string", "null"] },
      youtubeChannelUrl: { type: ["string", "null"] },
      avatarUrl: { type: ["string", "null"] },
      authenticatedWalletAddress: { type: "string" },
      wallets: {
        type: "array",
        items: {
          type: "object",
          required: [
            "id",
            "walletAddress",
            "label",
            "isPrimary",
            "verifiedAt",
          ],
          properties: {
            id: { type: "string", format: "uuid" },
            walletAddress: { type: "string" },
            label: { type: ["string", "null"] },
            isPrimary: { type: "boolean" },
            verifiedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  });

  app.addSchema({
    $id: "campaignMetadata",
    type: "object",
    required: [
      "id",
      "creatorId",
      "metadataId",
      "chainId",
      "contractAddress",
      "onchainCampaignId",
      "creationTransactionHash",
      "title",
      "category",
      "description",
      "youtubeUrl",
      "imageObjectKey",
      "status",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string", format: "uuid" },
      creatorId: { type: "string", format: "uuid" },
      metadataId: { type: "string", pattern: "^0x[a-fA-F0-9]{64}$" },
      chainId: { type: ["integer", "null"] },
      contractAddress: { type: ["string", "null"] },
      onchainCampaignId: { type: ["string", "null"] },
      creationTransactionHash: { type: ["string", "null"] },
      title: { type: "string" },
      category: { type: "string" },
      description: { type: "string" },
      youtubeUrl: { type: "string", format: "uri" },
      imageObjectKey: { type: ["string", "null"] },
      status: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  });
}
