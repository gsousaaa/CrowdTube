import type { FastifyInstance } from "fastify";

import type { AppContainer } from "../container";

const confirmationResponse = {
  type: "object",
  required: [
    "status",
    "transactionHash",
    "confirmations",
    "requiredConfirmations",
    "donationEvents",
    "recordedEvents",
  ],
  properties: {
    status: { type: "string", enum: ["pending", "confirmed"] },
    transactionHash: { type: "string", pattern: "^0x[a-fA-F0-9]{64}$" },
    confirmations: { type: "integer", minimum: 0 },
    requiredConfirmations: { type: "integer", minimum: 1 },
    donationEvents: { type: "integer", minimum: 0 },
    recordedEvents: { type: "integer", minimum: 0 },
  },
};

export function registerDonationRoutes(
  app: FastifyInstance,
  container: AppContainer,
): void {
  app.post(
    "/donations/transactions",
    {
      schema: {
        tags: ["Donations"],
        summary: "Confirma e registra uma doação pela transação",
        description:
          "Usa o hash como caminho rápido. O backend valida e decodifica o recibo da blockchain; o indexador permanece como reconciliação.",
        body: {
          type: "object",
          additionalProperties: false,
          required: ["transactionHash"],
          properties: {
            transactionHash: {
              type: "string",
              pattern: "^0x[a-fA-F0-9]{64}$",
            },
          },
        },
        response: {
          200: confirmationResponse,
          202: confirmationResponse,
          400: { $ref: "errorResponse#" },
          422: { $ref: "errorResponse#" },
          503: { $ref: "errorResponse#" },
        },
      },
    },
    container.controllers.donations.confirmTransaction,
  );
}
