import { z } from "zod";

import type {
  ControllerAdapter,
  ControllerResponse,
} from "../../controllers/controller-types";
import type { Campaign } from "../../entities/campaign";
import { AppError } from "../../errors/app-error";
import type { GetPublicCampaignByIdUseCase } from "../../usecases/campaign/get-public-campaign-by-id-use-case";

const requestParamsSchema = z
  .object({ campaignId: z.uuid() })
  .strict();

export function makeGetPublicCampaignByIdAdapter({
  getPublicCampaignById,
}: {
  getPublicCampaignById: Pick<GetPublicCampaignByIdUseCase, "execute">;
}): ControllerAdapter<Campaign> {
  return async (request): Promise<ControllerResponse<Campaign>> => {
    const parsedParams = requestParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      throw new AppError(
        "A valid campaign identifier is required.",
        400,
        "INVALID_CAMPAIGN_ID",
      );
    }

    return {
      statusCode: 200,
      body: await getPublicCampaignById.execute(parsedParams.data.campaignId),
    };
  };
}
