import type { FastifyInstance } from "fastify";

import type { AppContainer } from "../container";

export function registerAdminRoutes(
  app: FastifyInstance,
  container: AppContainer,
): void {
  app.get(
    "/admin/profile",
    {
      preHandler: container.authenticationGuard,
      schema: {
        tags: ["Admin"],
        summary: "Retorna o perfil do criador autenticado",
        security: [{ cookieAuth: [] }],
        response: {
          200: { $ref: "currentUserProfile#" },
          401: { $ref: "errorResponse#" },
        },
      },
    },
    container.controllers.admin.getProfile,
  );

  app.patch(
    "/admin/profile",
    {
      preHandler: container.authenticationGuard,
      schema: {
        tags: ["Admin"],
        summary: "Atualiza o perfil do criador autenticado",
        description:
          "Atualiza somente os campos enviados. Envie null para limpar um campo.",
        security: [{ cookieAuth: [] }],
        body: {
          type: "object",
          additionalProperties: false,
          minProperties: 1,
          properties: {
            displayName: {
              anyOf: [
                { type: "string", minLength: 1, maxLength: 100 },
                { type: "null" },
              ],
            },
            bio: {
              anyOf: [
                { type: "string", minLength: 1, maxLength: 500 },
                { type: "null" },
              ],
            },
            youtubeChannelUrl: {
              description: "URL completa de um canal do YouTube.",
              anyOf: [
                { type: "string", format: "uri" },
                { type: "null" },
              ],
            },
          },
        },
        response: {
          200: { $ref: "currentUserProfile#" },
          400: { $ref: "errorResponse#" },
          401: { $ref: "errorResponse#" },
        },
      },
    },
    container.controllers.admin.updateProfile,
  );
}
