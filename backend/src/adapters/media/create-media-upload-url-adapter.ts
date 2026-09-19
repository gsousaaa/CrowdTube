import { z } from "zod";

import type {
  ControllerAdapter,
  ControllerResponse,
} from "../../controllers/controller-types";
import { AppError } from "../../errors/app-error";
import {
  mediaPurposes,
  type CreateMediaUploadUrlUseCase,
  type MediaUploadUrl,
} from "../../usecases/media/create-media-upload-url-use-case";

const requestBodySchema = z
  .object({
    fileName: z.string().trim().min(1).max(255),
    contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
    purpose: z.enum(mediaPurposes),
  })
  .strict();

export function makeCreateMediaUploadUrlAdapter({
  createMediaUploadUrl,
}: {
  createMediaUploadUrl: Pick<CreateMediaUploadUrlUseCase, "execute">;
}): ControllerAdapter<MediaUploadUrl> {
  return async (request): Promise<ControllerResponse<MediaUploadUrl>> => {
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
        "A valid media file name, content type and purpose are required.",
        400,
        "INVALID_MEDIA_DATA",
      );
    }

    return {
      statusCode: 201,
      body: await createMediaUploadUrl.execute({
        userId: request.authenticatedUser.userId,
        ...parsedBody.data,
      }),
    };
  };
}
