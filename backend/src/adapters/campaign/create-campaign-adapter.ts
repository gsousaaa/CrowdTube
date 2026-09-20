import { z } from "zod";

import type {
  ControllerAdapter,
  ControllerResponse,
} from "../../controllers/controller-types";
import { campaignCategories, type Campaign } from "../../entities/campaign";
import { AppError } from "../../errors/app-error";
import type { CreateCampaignUseCase } from "../../usecases/campaign/create-campaign-use-case";

const youtubeUrlSchema = z.url().refine((value) => {
  const hostname = new URL(value).hostname.toLowerCase();
  return (
    hostname === "youtube.com" ||
    hostname.endsWith(".youtube.com") ||
    hostname === "youtu.be"
  );
}, "A valid YouTube URL is required.");

const requestBodySchema = z
  .object({
    title: z.string().trim().min(5).max(80),
    category: z.enum(campaignCategories),
    description: z.string().trim().min(20).max(500),
    youtubeUrl: youtubeUrlSchema,
    imageObjectKey: z.string().trim().min(1).max(1_024).nullable().optional(),
  })
  .strict();

export function makeCreateCampaignAdapter({
  createCampaign,
}: {
  createCampaign: Pick<CreateCampaignUseCase, "execute">;
}): ControllerAdapter<Campaign> {
  return async (request): Promise<ControllerResponse<Campaign>> => {
    if (!request.authenticatedUser) {
      throw new AppError(
        "A valid authentication session is required.",
        401,
        "UNAUTHENTICATED",
      );
    }

    const parsedBody = requestBodySchema.safeParse(request.body);
    if (!parsedBody.success) {
      throw new AppError(
        "Valid campaign metadata is required.",
        400,
        "INVALID_CAMPAIGN_DATA",
      );
    }

    return {
      statusCode: 201,
      body: await createCampaign.execute({
        creatorId: request.authenticatedUser.userId,
        ...parsedBody.data,
      }),
    };
  };
}
