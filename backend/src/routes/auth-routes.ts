import type { FastifyInstance } from "fastify";

import type { AppContainer } from "../container";

export function registerAuthRoutes(
  app: FastifyInstance,
  container: AppContainer,
): void {
  app.post(
    "/auth/challenge",
    {
      schema: {
        tags: ["Authentication"],
        summary: "Cria um desafio de autenticação por carteira",
        description:
          "Gera um nonce temporário e retorna a mensagem que deve ser assinada pela carteira.",
        body: {
          type: "object",
          additionalProperties: false,
          required: ["walletAddress"],
          properties: {
            walletAddress: {
              type: "string",
              pattern: "^0x[a-fA-F0-9]{40}$",
              examples: ["0x0000000000000000000000000000000000000001"],
            },
          },
        },
        response: {
          201: {
            type: "object",
            required: ["challengeId", "message", "expiresAt"],
            properties: {
              challengeId: { type: "string", format: "uuid" },
              message: { type: "string" },
              expiresAt: { type: "string", format: "date-time" },
            },
          },
          400: {
            type: "object",
            required: ["error", "message"],
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    container.controllers.createAuthChallenge,
  );
}
