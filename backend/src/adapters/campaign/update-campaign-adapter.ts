import { z } from "zod";

import type {
  ControllerAdapter,
  ControllerResponse,
} from "../../controllers/controller-types";
import { campaignCategories, type Campaign } from "../../entities/campaign";
import { AppError } from "../../errors/app-error";
import type { UpdateCampaignUseCase } from "../../usecases/campaign/update-campaign-use-case";

const youtubeUrlSchema = z.url().refine((value) => {
  const hostname = new URL(value).hostname.toLowerCase();
  return (
    hostname === "youtube.com" ||
    hostname.endsWith(".youtube.com") ||
    hostname === "youtu.be"
  );
}, "A valid YouTube URL is required.");

const requestParamsSchema = z.object({ campaignId: z.uuid() }).strict();
const requestBodySchema = z
  .object({
    title: z.string().trim().min(5).max(80).optional(),
    category: z.enum(campaignCategories).optional(),
    description: z.string().trim().min(20).max(500).optional(),
    youtubeUrl: youtubeUrlSchema.optional(),
    imageObjectKey: z.string().trim().min(1).max(1_024).nullable().optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one campaign field is required.",
  });

export function makeUpdateCampaignAdapter({
  updateCampaign,
}: {
  updateCampaign: Pick<UpdateCampaignUseCase, "execute">;
}): ControllerAdapter<Campaign> {
  return async (request): Promise<ControllerResponse<Campaign>> => {
    if (!request.authenticatedUser) {
      throw new AppError(
        "A valid authentication session is required.",
        401,
        "UNAUTHENTICATED",
      );
    }

    const parsedParams = requestParamsSchema.safeParse(request.params);
    const parsedBody = requestBodySchema.safeParse(request.body);

    if (!parsedParams.success || !parsedBody.success) {
      throw new AppError(
        "A valid campaign identifier and at least one valid field are required.",
        400,
        "INVALID_CAMPAIGN_DATA",
      );
    }

    return {
      statusCode: 200,
      body: await updateCampaign.execute({
        campaignId: parsedParams.data.campaignId,
        creatorId: request.authenticatedUser.userId,
        ...parsedBody.data,
      }),
    };
  };
}
