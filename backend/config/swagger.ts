import type { SwaggerOptions } from "@fastify/swagger";
import type { FastifySwaggerUiOptions } from "@fastify/swagger-ui";

import type { AppConfig } from "./env";

export function makeSwaggerOptions(config: AppConfig): SwaggerOptions {
  return {
    openapi: {
      info: {
        title: "CrowdTube API",
        description:
          "API de metadados offchain, autenticação e indexação onchain do CrowdTube.",
        version: "0.1.0",
      },
      servers: [
        {
          url: `http://localhost:${config.PORT}`,
          description: "Ambiente local",
        },
      ],
      tags: [
        {
          name: "Authentication",
          description: "Desafios e sessões baseados em assinatura de carteira.",
        },
        {
          name: "Health",
          description: "Estado da aplicação e de suas dependências.",
        },
      ],
    },
  };
}

export const swaggerUiOptions: FastifySwaggerUiOptions = {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "list",
    deepLinking: true,
  },
};
