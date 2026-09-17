import { makeBaseController } from "./base-controller";
import type { ControllerAdapter } from "./controller-types";

type ControllerFactoryDependencies = {
  adapters: {
    checkHealth: ControllerAdapter;
    auth: {
      createAuthChallenge: ControllerAdapter;
      verifyAuthChallenge: ControllerAdapter;
    }
  };
};

export function makeControllers({ adapters }: ControllerFactoryDependencies) {
  return {
    health: makeBaseController({
      adapter: adapters.checkHealth,
    }),
    auth: {
      createAuthChallenge: makeBaseController({
        adapter: adapters.auth.createAuthChallenge,
      }),
      verifyAuthChallenge: makeBaseController({
        adapter: adapters.auth.verifyAuthChallenge,
      })
    }
  };
}
