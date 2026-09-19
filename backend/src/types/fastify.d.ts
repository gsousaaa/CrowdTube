import "fastify";

import type { AuthenticatedPrincipal } from "../usecases/auth/authenticated-principal";

declare module "fastify" {
  interface FastifyRequest {
    authenticatedUser: AuthenticatedPrincipal | null;
  }
}
