import type { FastifyRequest } from "fastify";

import type { AppConfig } from "../../../config/env";
import type { AuthenticateSessionUseCase } from "../../usecases/auth/authenticate-session-use-case";

export function makeAuthenticationGuard({
  authenticateSession,
  config,
}: {
  authenticateSession: AuthenticateSessionUseCase;
  config: Pick<AppConfig, "AUTH_SESSION_COOKIE_NAME">;
}) {
  return async function authenticationGuard(
    request: FastifyRequest,
  ): Promise<void> {
    request.authenticatedUser = await authenticateSession.execute(
      request.cookies[config.AUTH_SESSION_COOKIE_NAME],
    );
  };
}
