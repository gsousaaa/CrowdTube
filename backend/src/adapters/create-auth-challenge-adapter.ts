import { z } from "zod";

import type {
  ControllerAdapter,
  ControllerResponse,
} from "../controllers/controller-types";
import { AppError } from "../errors/app-error";
import type {
  AuthChallenge,
  CreateAuthChallengeUseCase,
} from "../usecases/create-auth-challenge-use-case";

const requestBodySchema = z.object({
  walletAddress: z.string(),
});

export function makeCreateAuthChallengeAdapter({
  createAuthChallenge,
}: {
  createAuthChallenge: CreateAuthChallengeUseCase;
}): ControllerAdapter<AuthChallenge> {
  return async (request): Promise<ControllerResponse<AuthChallenge>> => {
    const parsedBody = requestBodySchema.safeParse(request.body);

    if (!parsedBody.success) {
      throw new AppError(
        "A valid walletAddress is required.",
        400,
        "INVALID_REQUEST_BODY",
      );
    }

    return {
      statusCode: 201,
      body: await createAuthChallenge.execute(parsedBody.data),
    };
  };
}
