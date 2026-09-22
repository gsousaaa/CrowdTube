import type { FastifyInstance } from "fastify";

import type { AppContainer } from "../container";

const campaignResponse = { $ref: "campaignMetadata#" };

export function registerCampaignRoutes(
  app: FastifyInstance,
  container: AppContainer,
): void {
  app.get(
    "/campaigns",
    {
      schema: {
        tags: ["Campaigns"],
        summary: "Busca campanhas públicas disponíveis para doação",
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            search: { type: "string", maxLength: 100 },
            page: { type: "integer", minimum: 1, default: 1 },
            pageSize: {
              type: "integer",
              minimum: 1,
              maximum: 50,
              default: 12,
            },
          },
        },
        response: {
          200: {
            type: "object",
            required: ["campaigns", "pagination"],
            properties: {
              campaigns: { type: "array", items: campaignResponse },
              pagination: {
                type: "object",
                required: ["page", "pageSize", "total", "totalPages"],
                properties: {
                  page: { type: "integer" },
                  pageSize: { type: "integer" },
                  total: { type: "integer" },
                  totalPages: { type: "integer" },
                },
              },
            },
          },
          400: { $ref: "errorResponse#" },
        },
      },
    },
    container.controllers.campaigns.searchPublic,
  );

  app.get(
    "/campaigns/:campaignId",
    {
      schema: {
        tags: ["Campaigns"],
        summary: "Retorna uma campanha pública para a página de doação",
        params: {
          type: "object",
          additionalProperties: false,
          required: ["campaignId"],
          properties: {
            campaignId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: campaignResponse,
          400: { $ref: "errorResponse#" },
          404: { $ref: "errorResponse#" },
        },
      },
    },
    container.controllers.campaigns.getPublicById,
  );

  app.post(
    "/admin/campaigns",
    {
      preHandler: container.authenticationGuard,
      schema: {
        tags: ["Campaigns"],
        summary: "Cria os metadados offchain de uma campanha",
        description:
          "Cria um rascunho e devolve o metadataId que será enviado ao contrato.",
        security: [{ cookieAuth: [] }],
        body: {
          type: "object",
          additionalProperties: false,
          required: ["title", "category", "description", "youtubeUrl"],
          properties: {
            title: { type: "string", minLength: 5, maxLength: 80 },
            category: {
              type: "string",
              enum: [
                "education",
                "entertainment",
                "science",
                "games",
                "other",
              ],
            },
            description: { type: "string", minLength: 20, maxLength: 500 },
            youtubeUrl: { type: "string", format: "uri" },
            imageObjectKey: {
              type: ["string", "null"],
              minLength: 1,
              maxLength: 1_024,
            },
          },
        },
        response: {
          201: campaignResponse,
          400: { $ref: "errorResponse#" },
          401: { $ref: "errorResponse#" },
          403: { $ref: "errorResponse#" },
        },
      },
    },
    container.controllers.campaigns.create,
  );

  app.post(
    "/admin/campaigns/:campaignId/creation-transaction",
    {
      preHandler: container.authenticationGuard,
      schema: {
        tags: ["Campaigns"],
        summary: "Registra o hash da transação de criação de campanha",
        description:
          "Recebe a referência enviada pela carteira e marca o rascunho como pending_onchain. O indexador confirma os dados pela blockchain antes de publicar a campanha.",
        security: [{ cookieAuth: [] }],
        params: {
          type: "object",
          additionalProperties: false,
          required: ["campaignId"],
          properties: {
            campaignId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          additionalProperties: false,
          required: ["chainId", "contractAddress", "transactionHash"],
          properties: {
            chainId: { type: "integer", minimum: 1 },
            contractAddress: { type: "string", pattern: "^0x[a-fA-F0-9]{40}$" },
            transactionHash: { type: "string", pattern: "^0x[a-fA-F0-9]{64}$" },
          },
        },
        response: {
          200: campaignResponse,
          202: campaignResponse,
          400: { $ref: "errorResponse#" },
          401: { $ref: "errorResponse#" },
          404: { $ref: "errorResponse#" },
          409: { $ref: "errorResponse#" },
        },
      },
    },
    container.controllers.campaigns.recordCreationTransaction,
  );

  app.get(
    "/admin/campaigns",
    {
      preHandler: container.authenticationGuard,
      schema: {
        tags: ["Campaigns"],
        summary: "Lista as campanhas do criador autenticado",
        security: [{ cookieAuth: [] }],
        response: {
          200: { type: "array", items: campaignResponse },
          401: { $ref: "errorResponse#" },
        },
      },
    },
    container.controllers.campaigns.listMine,
  );
}
