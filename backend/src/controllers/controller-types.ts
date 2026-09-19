import type { CookieSerializeOptions } from "@fastify/cookie";

import type { AuthenticatedPrincipal } from "../usecases/auth/authenticated-principal";

export type ControllerRequest = {
  body: unknown;
  params: unknown;
  query: unknown;
  headers: Record<string, string | string[] | undefined>;
  cookies: Record<string, string | undefined>;
  authenticatedUser: AuthenticatedPrincipal | null;
};

export type ControllerResponse<TBody = unknown> = {
  statusCode: number;
  body: TBody;
  cookies?: Array<{
    name: string;
    value: string;
    options: CookieSerializeOptions;
  }>;
  clearCookies?: Array<{
    name: string;
    options: CookieSerializeOptions;
  }>;
};

export type ControllerAdapter<TBody = unknown> = (
  request: ControllerRequest,
) => Promise<ControllerResponse<TBody>>;
