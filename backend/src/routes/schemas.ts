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
}
