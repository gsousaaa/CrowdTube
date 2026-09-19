import type {
  ControllerAdapter,
  ControllerResponse,
} from "../../controllers/controller-types";
import { AppError } from "../../errors/app-error";
import type {
  AdminProfile,
  GetAdminProfileUseCase,
} from "../../usecases/admin/get-admin-profile-use-case";

export function makeGetAdminProfileAdapter({
  getAdminProfile,
}: {
  getAdminProfile: Pick<GetAdminProfileUseCase, "execute">;
}): ControllerAdapter<AdminProfile> {
  return async (request): Promise<ControllerResponse<AdminProfile>> => {
    if (!request.authenticatedUser) {
      throw new AppError(
        "A valid authentication session is required.",
        401,
        "UNAUTHENTICATED",
      );
    }

    return {
      statusCode: 200,
      body: await getAdminProfile.execute({
        userId: request.authenticatedUser.userId,
        authenticatedWalletAddress:
          request.authenticatedUser.walletAddress,
      }),
    };
  };
}
