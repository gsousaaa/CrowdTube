import type {
  ControllerAdapter,
  ControllerResponse,
} from "../controllers/controller-types";
import type {
  CheckHealthUseCase,
  HealthStatus,
} from "../usecases/check-health-use-case";

export function makeCheckHealthAdapter({
  checkHealth,
}: {
  checkHealth: CheckHealthUseCase;
}): ControllerAdapter<HealthStatus> {
  return async (): Promise<ControllerResponse<HealthStatus>> => ({
    statusCode: 200,
    body: await checkHealth.execute(),
  });
}
