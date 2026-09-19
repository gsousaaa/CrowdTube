import { z } from "zod";

import type {
  ControllerAdapter,
  ControllerResponse,
} from "../../controllers/controller-types";
import { AppError } from "../../errors/app-error";
import type { AdminProfile } from "../../usecases/admin/get-admin-profile-use-case";
import type { UpdateAdminProfileUseCase } from "../../usecases/admin/update-admin-profile-use-case";

const nullableTrimmedString = (maximumLength: number) =>
  z.string().trim().min(1).max(maximumLength).nullable().optional();

const youtubeChannelUrlSchema = z
  .url()
  .refine((value) => {
    const hostname = new URL(value).hostname.toLowerCase();

    return (
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "youtu.be"
    );
  }, "A valid YouTube channel URL is required.")
  .nullable()
  .optional();

const requestBodySchema = z
  .object({
    displayName: nullableTrimmedString(100),
    bio: nullableTrimmedString(500),
    youtubeChannelUrl: youtubeChannelUrlSchema,
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one profile field is required.",
  });

export function makeUpdateAdminProfileAdapter({
  updateAdminProfile,
}: {
  updateAdminProfile: Pick<UpdateAdminProfileUseCase, "execute">;
}): ControllerAdapter<AdminProfile> {
  return async (request): Promise<ControllerResponse<AdminProfile>> => {
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
        "Valid profile fields are required.",
        400,
        "INVALID_PROFILE_DATA",
      );
    }

    return {
      statusCode: 200,
      body: await updateAdminProfile.execute({
        userId: request.authenticatedUser.userId,
        authenticatedWalletAddress:
          request.authenticatedUser.walletAddress,
        ...parsedBody.data,
      }),
    };
  };
}
