import type {
  ControllerAdapter,
  ControllerResponse,
} from "../../controllers/controller-types";
import { AppError } from "../../errors/app-error";
import type {
  MarkNotificationsReadResult,
  MarkNotificationsReadUseCase,
} from "../../usecases/notification/mark-notifications-read-use-case";

export function makeMarkNotificationsReadAdapter({
  markNotificationsRead,
}: {
  markNotificationsRead: Pick<MarkNotificationsReadUseCase, "execute">;
}): ControllerAdapter<MarkNotificationsReadResult> {
  return async (
    request,
  ): Promise<ControllerResponse<MarkNotificationsReadResult>> => {
    if (!request.authenticatedUser) {
      throw new AppError(
        "A valid authentication session is required.",
        401,
        "UNAUTHENTICATED",
      );
    }

    return {
      statusCode: 200,
      body: await markNotificationsRead.execute(
        request.authenticatedUser.userId,
      ),
    };
  };
}
