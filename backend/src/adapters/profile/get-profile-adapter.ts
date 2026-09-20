import type {
  ControllerAdapter,
  ControllerResponse,
} from "../../controllers/controller-types";
import { AppError } from "../../errors/app-error";
import type {
  Profile,
  GetProfileUseCase,
} from "../../usecases/profile/get-profile-use-case";

export function makeGetProfileAdapter({
  getProfile,
}: {
  getProfile: Pick<GetProfileUseCase, "execute">;
}): ControllerAdapter<Profile> {
  return async (request): Promise<ControllerResponse<Profile>> => {
    if (!request.authenticatedUser) {
      throw new AppError(
        "A valid authentication session is required.",
        401,
        "UNAUTHENTICATED",
      );
    }

    return {
      statusCode: 200,
      body: await getProfile.execute({
        userId: request.authenticatedUser.userId,
        authenticatedWalletAddress:
          request.authenticatedUser.walletAddress,
      }),
    };
  };
}
