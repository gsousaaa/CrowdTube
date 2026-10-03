import { z } from "zod";

import type {
  ControllerAdapter,
  ControllerRequest,
  ControllerResponse,
} from "../../controllers/controller-types";
import { AppError } from "../../errors/app-error";
import type {
  CampaignDonationHistory,
  ListCampaignDonationsUseCase,
} from "../../usecases/campaign/list-campaign-donations-use-case";

const paramsSchema = z.object({ campaignId: z.uuid() }).strict();
const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(10),
}).strict();

function parseRequest(request: ControllerRequest) {
  const params = paramsSchema.safeParse(request.params);
  const query = querySchema.safeParse(request.query);
  if (!params.success || !query.success) {
    throw new AppError(
      "A valid campaign identifier and pagination are required.",
      400,
      "INVALID_CAMPAIGN_DONATION_HISTORY",
    );
  }

  return { ...params.data, ...query.data };
}

export function makeListPublicCampaignDonationsAdapter({
  listCampaignDonations,
}: {
  listCampaignDonations: Pick<ListCampaignDonationsUseCase, "execute">;
}): ControllerAdapter<CampaignDonationHistory> {
  return async (request): Promise<
    ControllerResponse<CampaignDonationHistory>
  > => ({
    statusCode: 200,
    body: await listCampaignDonations.execute(parseRequest(request)),
  });
}

export function makeListCreatorCampaignDonationsAdapter({
  listCampaignDonations,
}: {
  listCampaignDonations: Pick<ListCampaignDonationsUseCase, "execute">;
}): ControllerAdapter<CampaignDonationHistory> {
  return async (request): Promise<
    ControllerResponse<CampaignDonationHistory>
  > => {
    if (!request.authenticatedUser) {
      throw new AppError(
        "A valid authentication session is required.",
        401,
        "UNAUTHENTICATED",
      );
    }

    return {
      statusCode: 200,
      body: await listCampaignDonations.execute({
        ...parseRequest(request),
        creatorId: request.authenticatedUser.userId,
      }),
    };
  };
}
