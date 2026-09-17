import type { FastifyInstance } from "fastify";

import type { AppContainer } from "../container";

export function registerHealthRoutes(
  app: FastifyInstance,
  container: AppContainer,
): void {
  app.get(
    "/health",
    {
      schema: {
        tags: ["Health"],
        summary: "Verifica a disponibilidade da API",
        description:
          "Confirma que a aplicação está ativa e consegue consultar o PostgreSQL.",
        response: {
          200: {
            type: "object",
            required: ["status", "database", "timestamp"],
            properties: {
              status: { type: "string", enum: ["ok"] },
              database: { type: "string", enum: ["connected"] },
              timestamp: { type: "string", format: "date-time" },
            },
          },
          500: {
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
    container.controllers.health,
  );
}
