import type { FastifyInstance } from "fastify";

import type { AppContainer } from "../container";

export function registerMediaRoutes(
  app: FastifyInstance,
  container: AppContainer,
): void {
  app.post(
    "/uploads/media",
    {
      preHandler: container.authenticationGuard,
      schema: {
        tags: ["Media"],
        summary: "Gera uma URL temporária para upload de mídia",
        description:
          "Autoriza um PUT direto no S3. A resposta não significa que o arquivo já foi enviado.",
        security: [{ cookieAuth: [] }],
        body: {
          type: "object",
          additionalProperties: false,
          required: ["fileName", "contentType", "purpose"],
          properties: {
            fileName: { type: "string", minLength: 1, maxLength: 255 },
            contentType: {
              type: "string",
              enum: ["image/jpeg", "image/png", "image/webp"],
            },
            purpose: {
              type: "string",
              enum: ["profile-avatar", "campaign-image"],
            },
          },
        },
        response: {
          201: {
            type: "object",
            required: [
              "uploadUrl",
              "objectKey",
              "contentType",
              "expiresIn",
              "expiresAt",
            ],
            properties: {
              uploadUrl: { type: "string", format: "uri" },
              objectKey: { type: "string" },
              contentType: { type: "string" },
              expiresIn: { type: "integer" },
              expiresAt: { type: "string", format: "date-time" },
            },
          },
          400: { $ref: "errorResponse#" },
          401: { $ref: "errorResponse#" },
        },
      },
    },
    container.controllers.media.createUploadUrl,
  );

  app.get(
    "/uploads/media",
    {
      schema: {
        tags: ["Media"],
        summary: "Gera uma URL temporária para leitura de mídia pública",
        description:
          "Cria uma nova URL GET quando a anterior expirar. A objectKey é o identificador persistente.",
        querystring: {
          type: "object",
          additionalProperties: false,
          required: ["objectKey"],
          properties: {
            objectKey: { type: "string", minLength: 1, maxLength: 1_024 },
          },
        },
        response: {
          200: {
            type: "object",
            required: ["mediaUrl", "objectKey", "expiresIn", "expiresAt"],
            properties: {
              mediaUrl: { type: "string", format: "uri" },
              objectKey: { type: "string" },
              expiresIn: { type: "integer" },
              expiresAt: { type: "string", format: "date-time" },
            },
          },
          400: { $ref: "errorResponse#" },
        },
      },
    },
    container.controllers.media.get,
  );
}
