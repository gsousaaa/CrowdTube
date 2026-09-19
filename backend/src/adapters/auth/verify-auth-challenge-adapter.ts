import { z } from "zod";

import type { AppConfig } from "../../../config/env";
import type {
  ControllerAdapter,
  ControllerResponse,
} from "../../controllers/controller-types";
import { AppError } from "../../errors/app-error";
import type {
  AuthenticatedUser,
  VerifyAuthChallengeUseCase,
} from "../../usecases/auth/verify-auth-challenge-use-case";

const requestBodySchema = z.object({
  challengeId: z.uuid(),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
});

export function makeVerifyAuthChallengeAdapter({
  verifyAuthChallenge,
  config,
}: {
  verifyAuthChallenge: Pick<VerifyAuthChallengeUseCase, "execute">;
  config: Pick<
    AppConfig,
    "AUTH_SESSION_COOKIE_NAME" | "AUTH_SESSION_TTL_SECONDS" | "NODE_ENV"
  >;
}): ControllerAdapter<AuthenticatedUser> {
  return async (request): Promise<ControllerResponse<AuthenticatedUser>> => {
    const parsedBody = requestBodySchema.safeParse(request.body);

    if (!parsedBody.success) {
      throw new AppError(
        "A valid challengeId and signature are required.",
        400,
        "INVALID_REQUEST_BODY",
      );
    }

    const {
      sessionToken,
      sessionExpiresAt,
      ...authenticatedUser
    } = await verifyAuthChallenge.execute(parsedBody.data);

    return {
      statusCode: 200,
      body: authenticatedUser,
      cookies: [
        {
          name: config.AUTH_SESSION_COOKIE_NAME,
          value: sessionToken,
          options: {
            httpOnly: true,
            secure: config.NODE_ENV === "prd",
            sameSite: "lax",
            path: "/",
            maxAge: config.AUTH_SESSION_TTL_SECONDS,
            expires: sessionExpiresAt,
          },
        },
      ],
    };
  };
}
