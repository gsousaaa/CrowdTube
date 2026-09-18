import type { FastifyReply, FastifyRequest } from "fastify";

import type { ControllerAdapter } from "./controller-types";

type BaseControllerDependencies = {
  adapter: ControllerAdapter;
};

export function makeBaseController({ adapter }: BaseControllerDependencies) {
  return async function baseController(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const response = await adapter({
      body: request.body,
      params: request.params,
      query: request.query,
      headers: request.headers,
      cookies: request.cookies,
      authenticatedUser: request.authenticatedUser,
    });

    for (const cookie of response.cookies ?? []) {
      reply.setCookie(cookie.name, cookie.value, cookie.options);
    }

    for (const cookie of response.clearCookies ?? []) {
      reply.clearCookie(cookie.name, cookie.options);
    }

    await reply.code(response.statusCode).send(response.body);
  };
}
