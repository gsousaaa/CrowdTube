import { z } from "zod";

import type {
  ControllerAdapter,
  ControllerResponse,
} from "../../controllers/controller-types";
import { AppError } from "../../errors/app-error";
import type {
  CreatorAnalytics,
  GetCreatorAnalyticsUseCase,
} from "../../usecases/analytics/get-creator-analytics-use-case";

const dateTimeSchema = z
  .string()
  .refine((value) => Number.isFinite(Date.parse(value)))
  .transform((value) => new Date(value));

const requestQuerySchema = z
  .object({
    from: dateTimeSchema.optional(),
    to: dateTimeSchema.optional(),
  })
  .strict();

export function makeGetCreatorAnalyticsAdapter({
  getCreatorAnalytics,
}: {
  getCreatorAnalytics: Pick<GetCreatorAnalyticsUseCase, "execute">;
}): ControllerAdapter<CreatorAnalytics> {
  return async (
    request,
  ): Promise<ControllerResponse<CreatorAnalytics>> => {
    if (!request.authenticatedUser) {
      throw new AppError(
        "A valid authentication session is required.",
        401,
        "UNAUTHENTICATED",
      );
    }

    const parsedQuery = requestQuerySchema.safeParse(request.query);
    if (!parsedQuery.success) {
      throw new AppError(
        "Valid analytics period parameters are required.",
        400,
        "INVALID_ANALYTICS_PERIOD",
      );
    }

    return {
      statusCode: 200,
      body: await getCreatorAnalytics.execute({
        userId: request.authenticatedUser.userId,
        ...parsedQuery.data,
      }),
    };
  };
}
