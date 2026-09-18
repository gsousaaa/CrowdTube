import type {
  ControllerAdapter,
  ControllerResponse,
} from "../../controllers/controller-types";
import { AppError } from "../../errors/app-error";
import type {
  CurrentUserProfile,
  GetCurrentUserUseCase,
} from "../../usecases/auth/get-current-user-use-case";

export function makeGetCurrentUserAdapter({
  getCurrentUser,
}: {
  getCurrentUser: GetCurrentUserUseCase;
}): ControllerAdapter<CurrentUserProfile> {
  return async (request): Promise<ControllerResponse<CurrentUserProfile>> => {
    if (!request.authenticatedUser) {
      throw new AppError(
        "A valid authentication session is required.",
        401,
        "UNAUTHENTICATED",
      );
    }

    return {
      statusCode: 200,
      body: await getCurrentUser.execute({
        userId: request.authenticatedUser.userId,
        authenticatedWalletAddress:
          request.authenticatedUser.walletAddress,
      }),
    };
  };
}
