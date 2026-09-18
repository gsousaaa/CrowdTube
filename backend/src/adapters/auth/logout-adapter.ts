import type { AppConfig } from "../../../config/env";
import type {
  ControllerAdapter,
  ControllerResponse,
} from "../../controllers/controller-types";
import type { LogoutUseCase } from "../../usecases/auth/logout-use-case";

export function makeLogoutAdapter({
  logout,
  config,
}: {
  logout: LogoutUseCase;
  config: Pick<AppConfig, "AUTH_SESSION_COOKIE_NAME" | "NODE_ENV">;
}): ControllerAdapter<null> {
  return async (request): Promise<ControllerResponse<null>> => {
    await logout.execute(request.cookies[config.AUTH_SESSION_COOKIE_NAME]);

    return {
      statusCode: 204,
      body: null,
      clearCookies: [
        {
          name: config.AUTH_SESSION_COOKIE_NAME,
          options: {
            httpOnly: true,
            secure: config.NODE_ENV === "prd",
            sameSite: "lax",
            path: "/",
          },
        },
      ],
    };
  };
}
