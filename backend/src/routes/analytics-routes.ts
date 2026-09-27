import type { FastifyInstance } from "fastify";

import type { AppContainer } from "../container";

const weiValue = { type: "string", pattern: "^[0-9]+$" };

export function registerAnalyticsRoutes(
  app: FastifyInstance,
  container: AppContainer,
): void {
  app.get(
    "/admin/analytics",
    {
      preHandler: container.authenticationGuard,
      schema: {
        tags: ["Analytics"],
        summary: "Consolida a arrecadação do criador autenticado",
        security: [{ cookieAuth: [] }],
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            from: { type: "string", format: "date-time" },
            to: { type: "string", format: "date-time" },
          },
        },
        response: {
          200: {
            type: "object",
            required: ["period", "summary", "timeline", "campaigns"],
            properties: {
              period: {
                type: "object",
                required: ["from", "to"],
                properties: {
                  from: { type: "string", format: "date-time" },
                  to: { type: "string", format: "date-time" },
                },
              },
              summary: {
                type: "object",
                required: [
                  "totalRaisedWei",
                  "periodRaisedWei",
                  "periodDonationCount",
                  "periodAverageDonationWei",
                ],
                properties: {
                  totalRaisedWei: weiValue,
                  periodRaisedWei: weiValue,
                  periodDonationCount: { type: "integer", minimum: 0 },
                  periodAverageDonationWei: weiValue,
                },
              },
              timeline: {
                type: "array",
                items: {
                  type: "object",
                  required: ["date", "amountWei", "donationCount"],
                  properties: {
                    date: { type: "string", format: "date" },
                    amountWei: weiValue,
                    donationCount: { type: "integer", minimum: 0 },
                  },
                },
              },
              campaigns: {
                type: "array",
                items: {
                  type: "object",
                  required: [
                    "campaignId",
                    "title",
                    "onchainCampaignId",
                    "totalRaisedWei",
                    "periodRaisedWei",
                    "periodDonationCount",
                  ],
                  properties: {
                    campaignId: { type: "string", format: "uuid" },
                    title: { type: "string" },
                    onchainCampaignId: { type: "string", pattern: "^[0-9]+$" },
                    totalRaisedWei: weiValue,
                    periodRaisedWei: weiValue,
                    periodDonationCount: { type: "integer", minimum: 0 },
                  },
                },
              },
            },
          },
          400: { $ref: "errorResponse#" },
          401: { $ref: "errorResponse#" },
        },
      },
    },
    container.controllers.analytics.get,
  );
}
