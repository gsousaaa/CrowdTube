import { makeBaseController } from "./base-controller";
import type { ControllerAdapter } from "./controller-types";

type ControllerFactoryDependencies = {
  adapters: {
    checkHealth: ControllerAdapter;
    auth: {
      createAuthChallenge: ControllerAdapter;
      verifyAuthChallenge: ControllerAdapter;
      getCurrentUser: ControllerAdapter;
      logout: ControllerAdapter;
    };
    admin: {
      getProfile: ControllerAdapter;
      updateProfile: ControllerAdapter;
    };
    media: {
      createUploadUrl: ControllerAdapter;
      get: ControllerAdapter;
    };
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
      }),
      getCurrentUser: makeBaseController({
        adapter: adapters.auth.getCurrentUser,
      }),
      logout: makeBaseController({
        adapter: adapters.auth.logout,
      }),
    },
    admin: {
      getProfile: makeBaseController({
        adapter: adapters.admin.getProfile,
      }),
      updateProfile: makeBaseController({
        adapter: adapters.admin.updateProfile,
      }),
    },
    media: {
      createUploadUrl: makeBaseController({
        adapter: adapters.media.createUploadUrl,
      }),
      get: makeBaseController({
        adapter: adapters.media.get,
      }),
    },
  };
}
