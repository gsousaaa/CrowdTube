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
      recordCreationTransaction: ControllerAdapter;
      getPublicById: ControllerAdapter;
      listMine: ControllerAdapter;
      searchPublic: ControllerAdapter;
      update: ControllerAdapter;
    };
    notifications: {
      list: ControllerAdapter;
      markAllRead: ControllerAdapter;
    };
    analytics: {
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
      recordCreationTransaction: makeBaseController({
        adapter: adapters.campaigns.recordCreationTransaction,
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
      update: makeBaseController({
        adapter: adapters.campaigns.update,
      }),
    },
    notifications: {
      list: makeBaseController({
        adapter: adapters.notifications.list,
      }),
      markAllRead: makeBaseController({
        adapter: adapters.notifications.markAllRead,
      }),
    },
    analytics: {
      get: makeBaseController({
        adapter: adapters.analytics.get,
      }),
    },
  };
}
