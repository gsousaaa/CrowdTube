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
    container.controllers.auth.getCurrentUser,
  );
}
