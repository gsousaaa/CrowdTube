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
    profile: {
      get: ControllerAdapter;
      update: ControllerAdapter;
    };
    media: {
      createUploadUrl: ControllerAdapter;
      get: ControllerAdapter;
    };
    campaigns: {
      create: ControllerAdapter;
      getPublicById: ControllerAdapter;
      listMine: ControllerAdapter;
      searchPublic: ControllerAdapter;
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
    profile: {
      get: makeBaseController({
        adapter: adapters.profile.get,
      }),
      update: makeBaseController({
        adapter: adapters.profile.update,
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
    campaigns: {
      create: makeBaseController({
        adapter: adapters.campaigns.create,
      }),
      getPublicById: makeBaseController({
        adapter: adapters.campaigns.getPublicById,
      }),
      listMine: makeBaseController({
        adapter: adapters.campaigns.listMine,
      }),
      searchPublic: makeBaseController({
        adapter: adapters.campaigns.searchPublic,
      }),
    },
  };
}
