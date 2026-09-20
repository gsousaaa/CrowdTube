import type {
  ControllerAdapter,
  ControllerResponse,
} from "../../controllers/controller-types";
import type { Campaign } from "../../entities/campaign";
import { AppError } from "../../errors/app-error";
import type { ListCreatorCampaignsUseCase } from "../../usecases/campaign/list-creator-campaigns-use-case";

export function makeListCreatorCampaignsAdapter({
  listCreatorCampaigns,
}: {
  listCreatorCampaigns: Pick<ListCreatorCampaignsUseCase, "execute">;
}): ControllerAdapter<Campaign[]> {
  return async (request): Promise<ControllerResponse<Campaign[]>> => {
    if (!request.authenticatedUser) {
      throw new AppError(
        "A valid authentication session is required.",
        401,
        "UNAUTHENTICATED",
      );
    }

    return {
      statusCode: 200,
      body: await listCreatorCampaigns.execute(
        request.authenticatedUser.userId,
      ),
    };
  };
}
