import { z } from "zod";

import type {
  ControllerAdapter,
  ControllerResponse,
} from "../../controllers/controller-types";
import { AppError } from "../../errors/app-error";
import type {
  PublicCampaignSearchResult,
  SearchPublicCampaignsUseCase,
} from "../../usecases/campaign/search-public-campaigns-use-case";

const requestQuerySchema = z
  .object({
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(50).default(12),
  })
  .strict();

export function makeSearchPublicCampaignsAdapter({
  searchPublicCampaigns,
}: {
  searchPublicCampaigns: Pick<SearchPublicCampaignsUseCase, "execute">;
}): ControllerAdapter<PublicCampaignSearchResult> {
  return async (
    request,
  ): Promise<ControllerResponse<PublicCampaignSearchResult>> => {
    const parsedQuery = requestQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      throw new AppError(
        "Valid campaign search parameters are required.",
        400,
        "INVALID_CAMPAIGN_SEARCH",
      );
    }

    return {
      statusCode: 200,
      body: await searchPublicCampaigns.execute(parsedQuery.data),
    };
  };
}
