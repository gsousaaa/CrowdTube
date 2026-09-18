import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify, { type FastifyInstance } from "fastify";

import type { AppConfig } from "../config/env";
import { makeSwaggerOptions, swaggerUiOptions } from "../config/swagger";
import type { AppContainer } from "./container";
import { AppError } from "./errors/app-error";
import { registerAuthRoutes } from "./routes/auth-routes";
import { registerHealthRoutes } from "./routes/health-routes";
import { registerSharedSchemas } from "./routes/schemas";

function isValidationError(
  error: unknown,
): error is { validation: unknown; message: string } {
  return (
    error instanceof Error &&
    "validation" in error &&
    error.validation !== undefined
  );
}

export async function makeApp(
  config: AppConfig,
  container: AppContainer,
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: config.NODE_ENV !== "test",
  });

  await app.register(cors, {
    origin: config.FRONTEND_ORIGIN,
    credentials: true,
  });
  await app.register(cookie);
  await app.register(sensible);
  await app.register(swagger, makeSwaggerOptions(config));
  await app.register(swaggerUi, swaggerUiOptions);
  app.decorateRequest("authenticatedUser", null);
  registerSharedSchemas(app);

  app.setErrorHandler((error, request, reply) => {
    if (isValidationError(error)) {
      return reply.code(400).send({
        error: "VALIDATION_ERROR",
        message: error.message,
      });
    }

    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        error: error.code,
        message: error.message,
      });
    }

    request.log.error(error);

    return reply.code(500).send({
      error: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
    });
  });

  registerAuthRoutes(app, container);
  registerHealthRoutes(app, container);

  return app;
}
