import { makeBaseController } from "./base-controller";
import type { ControllerAdapter } from "./controller-types";

type ControllerFactoryDependencies = {
  adapters: {
    checkHealth: ControllerAdapter;
  };
};

export function makeControllers({ adapters }: ControllerFactoryDependencies) {
  return {
    health: makeBaseController({
      adapter: adapters.checkHealth,
    }),
  };
}
