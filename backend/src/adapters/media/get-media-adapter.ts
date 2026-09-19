import { z } from "zod";

import type {
  ControllerAdapter,
  ControllerResponse,
} from "../../controllers/controller-types";
import { AppError } from "../../errors/app-error";
import type {
  GetMediaUseCase,
  MediaReadUrl,
} from "../../usecases/media/get-media-use-case";

const requestQuerySchema = z
  .object({
    objectKey: z.string().trim().min(1).max(1_024),
  })
  .strict();

export function makeGetMediaAdapter({
  getMedia,
}: {
  getMedia: Pick<GetMediaUseCase, "execute">;
}): ControllerAdapter<MediaReadUrl> {
  return async (request): Promise<ControllerResponse<MediaReadUrl>> => {
    const parsedQuery = requestQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      throw new AppError(
        "A valid media object key is required.",
        400,
        "INVALID_MEDIA_KEY",
      );
    }

    return {
      statusCode: 200,
      body: await getMedia.execute({
        objectKey: parsedQuery.data.objectKey,
      }),
    };
  };
}
