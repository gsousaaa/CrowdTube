import type {
  ControllerAdapter,
  ControllerResponse,
} from "../../controllers/controller-types";
import { AppError } from "../../errors/app-error";
import type {
  ListNotificationsUseCase,
  NotificationList,
} from "../../usecases/notification/list-notifications-use-case";

export function makeListNotificationsAdapter({
  listNotifications,
}: {
  listNotifications: Pick<ListNotificationsUseCase, "execute">;
}): ControllerAdapter<NotificationList> {
  return async (request): Promise<ControllerResponse<NotificationList>> => {
    if (!request.authenticatedUser) {
      throw new AppError(
        "A valid authentication session is required.",
        401,
        "UNAUTHENTICATED",
      );
    }

    return {
      statusCode: 200,
      body: await listNotifications.execute(
        request.authenticatedUser.userId,
      ),
    };
  };
}
