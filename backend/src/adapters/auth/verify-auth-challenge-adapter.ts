import { z } from "zod";

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
}: {
  verifyAuthChallenge: VerifyAuthChallengeUseCase;
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

    return {
      statusCode: 200,
      body: await verifyAuthChallenge.execute(parsedBody.data),
    };
  };
}
