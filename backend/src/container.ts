import type { AppConfig } from "../config/env";
import { makeS3Client } from "../common/lib/aws/s3/s3-client";
import { S3MediaStorage } from "../common/lib/aws/s3/s3-media-storage";
import { ViemWalletSignatureVerifier } from "../common/lib/viem/viem-wallet-signature-verifier";
import { makeCreateMediaUploadUrlAdapter } from "./adapters/media/create-media-upload-url-adapter";
import { makeGetMediaAdapter } from "./adapters/media/get-media-adapter";
import { makeGetProfileAdapter } from "./adapters/profile/get-profile-adapter";
import { makeCheckHealthAdapter } from "./adapters/check-health-adapter";
import { makeUpdateProfileAdapter } from "./adapters/profile/update-profile-adapter";
import { makeAuthenticationGuard } from "./adapters/auth/authentication-guard";
import { makeCreateAuthChallengeAdapter } from "./adapters/auth/create-auth-challenge-adapter";
import { makeGetCurrentUserAdapter } from "./adapters/auth/get-current-user-adapter";
import { makeLogoutAdapter } from "./adapters/auth/logout-adapter";
import { makeVerifyAuthChallengeAdapter } from "./adapters/auth/verify-auth-challenge-adapter";
import { makeCreateCampaignAdapter } from "./adapters/campaign/create-campaign-adapter";
import { makeGetPublicCampaignByIdAdapter } from "./adapters/campaign/get-public-campaign-by-id-adapter";
import { makeListCreatorCampaignsAdapter } from "./adapters/campaign/list-creator-campaigns-adapter";
import { makeSearchPublicCampaignsAdapter } from "./adapters/campaign/search-public-campaigns-adapter";
import { makeRecordCampaignCreationTransactionAdapter } from "./adapters/campaign/record-campaign-creation-transaction-adapter";
import { makeListNotificationsAdapter } from "./adapters/notification/list-notifications-adapter";
import { makeMarkNotificationsReadAdapter } from "./adapters/notification/mark-notifications-read-adapter";
import { NodeSessionTokenManager } from "../common/lib/crypto/node-session-token-manager";
import { makeControllers } from "./controllers/controller-factory";
import { TypeOrmDatabaseHealthGateway } from "./database/typeorm-database-health-gateway";
import { TypeOrmAuthUnitOfWork } from "./database/typeorm-auth-unit-of-work";
import { makeTypeOrmDataSource } from "./database/typeorm-data-source";
import { AuthNonce } from "./entities/auth-nonce";
import { AuthSession } from "./entities/auth-session";
import { Campaign } from "./entities/campaign";
import { Notification } from "./entities/notification";
import { User } from "./entities/user";
import { UserWallet } from "./entities/user-wallet";
import { TypeOrmUserRepository } from "./repository/typeorm/typeorm-user-repository";
import { TypeOrmUserWalletRepository } from "./repository/typeorm/typeorm-user-wallet-repository";
import { TypeOrmAuthNonceRepository } from "./repository/typeorm/typeorm-auth-nonce-repository";
import { TypeOrmAuthSessionRepository } from "./repository/typeorm/typeorm-auth-session-repository";
import { TypeOrmCampaignRepository } from "./repository/typeorm/typeorm-campaign-repository";
import { TypeOrmNotificationRepository } from "./repository/typeorm/typeorm-notification-repository";
import { CheckHealthUseCase } from "./usecases/check-health-use-case";
import { AuthenticateSessionUseCase } from "./usecases/auth/authenticate-session-use-case";
import { CreateAuthChallengeUseCase } from "./usecases/auth/create-auth-challenge-use-case";
import { GetCurrentUserUseCase } from "./usecases/auth/get-current-user-use-case";
import { LogoutUseCase } from "./usecases/auth/logout-use-case";
import { VerifyAuthChallengeUseCase } from "./usecases/auth/verify-auth-challenge-use-case";
import { GetProfileUseCase } from "./usecases/profile/get-profile-use-case";
import { UpdateProfileUseCase } from "./usecases/profile/update-profile-use-case";
import { CreateMediaUploadUrlUseCase } from "./usecases/media/create-media-upload-url-use-case";
import { GetMediaUseCase } from "./usecases/media/get-media-use-case";
import { CreateCampaignUseCase } from "./usecases/campaign/create-campaign-use-case";
import { GetPublicCampaignByIdUseCase } from "./usecases/campaign/get-public-campaign-by-id-use-case";
import { ListCreatorCampaignsUseCase } from "./usecases/campaign/list-creator-campaigns-use-case";
import { SearchPublicCampaignsUseCase } from "./usecases/campaign/search-public-campaigns-use-case";
import { RecordCampaignCreationTransactionUseCase } from "./usecases/campaign/record-campaign-creation-transaction-use-case";
import { ListNotificationsUseCase } from "./usecases/notification/list-notifications-use-case";
import { MarkNotificationsReadUseCase } from "./usecases/notification/mark-notifications-read-use-case";

export function makeContainer(config: AppConfig) {
  const dataSource = makeTypeOrmDataSource(config);

  const databaseHealth = new TypeOrmDatabaseHealthGateway(dataSource);
  const authUnitOfWork = new TypeOrmAuthUnitOfWork(dataSource);
  const walletSignatureVerifier = new ViemWalletSignatureVerifier();
  const sessionTokens = new NodeSessionTokenManager();
  const mediaStorage = new S3MediaStorage(
    makeS3Client(config.AWS_REGION),
    config.AWS_S3_BUCKET_NAME,
  );

  const repositories = {
    authNonces: new TypeOrmAuthNonceRepository(
      dataSource.getRepository(AuthNonce),
    ),
    authSessions: new TypeOrmAuthSessionRepository(
      dataSource.getRepository(AuthSession),
    ),
    campaigns: new TypeOrmCampaignRepository(
      dataSource.getRepository(Campaign),
    ),
    notifications: new TypeOrmNotificationRepository(
      dataSource.getRepository(Notification),
    ),
    users: new TypeOrmUserRepository(dataSource.getRepository(User)),
    userWallets: new TypeOrmUserWalletRepository(
      dataSource.getRepository(UserWallet),
    ),
  };

  const getProfile = new GetProfileUseCase(
    repositories.users,
    repositories.userWallets,
  );

  const useCases = {
    checkHealth: new CheckHealthUseCase(databaseHealth),
    auth: {
      createAuthChallenge: new CreateAuthChallengeUseCase(
        repositories.authNonces,
        config,
      ),
      verifyAuthChallenge: new VerifyAuthChallengeUseCase(
        repositories.authNonces,
        authUnitOfWork,
        walletSignatureVerifier,
        sessionTokens,
        config,
      ),
      authenticateSession: new AuthenticateSessionUseCase(
        repositories.authSessions,
        repositories.userWallets,
        sessionTokens,
      ),
      getCurrentUser: new GetCurrentUserUseCase(
        repositories.users,
        repositories.userWallets,
      ),
      logout: new LogoutUseCase(repositories.authSessions, sessionTokens),
    },
    profile: {
      get: getProfile,
      update: new UpdateProfileUseCase(
        repositories.users,
        getProfile,
      ),
    },
    media: {
      createUploadUrl: new CreateMediaUploadUrlUseCase(
        mediaStorage,
        config.AWS_S3_UPLOAD_URL_TTL_SECONDS,
      ),
      getMedia: new GetMediaUseCase(
        mediaStorage,
        config.AWS_S3_READ_URL_TTL_SECONDS,
      ),
    },
    campaigns: {
      create: new CreateCampaignUseCase(repositories.campaigns),
      recordCreationTransaction: new RecordCampaignCreationTransactionUseCase(repositories.campaigns),
      getPublicById: new GetPublicCampaignByIdUseCase(repositories.campaigns),
      listMine: new ListCreatorCampaignsUseCase(repositories.campaigns),
      searchPublic: new SearchPublicCampaignsUseCase(repositories.campaigns),
    },
    notifications: {
      list: new ListNotificationsUseCase(repositories.notifications),
      markAllRead: new MarkNotificationsReadUseCase(
        repositories.notifications,
      ),
    },
  };

  const adapters = {
    checkHealth: makeCheckHealthAdapter({
      checkHealth: useCases.checkHealth,
    }),
    auth: {
      createAuthChallenge: makeCreateAuthChallengeAdapter({
        createAuthChallenge: useCases.auth.createAuthChallenge,
      }),
      verifyAuthChallenge: makeVerifyAuthChallengeAdapter({
        verifyAuthChallenge: useCases.auth.verifyAuthChallenge,
        config,
      }),
      getCurrentUser: makeGetCurrentUserAdapter({
        getCurrentUser: useCases.auth.getCurrentUser,
      }),
      logout: makeLogoutAdapter({
        logout: useCases.auth.logout,
        config,
      }),
    },
    profile: {
      get: makeGetProfileAdapter({
        getProfile: useCases.profile.get,
      }),
      update: makeUpdateProfileAdapter({
        updateProfile: useCases.profile.update,
      }),
    },
    media: {
      createUploadUrl: makeCreateMediaUploadUrlAdapter({
        createMediaUploadUrl: useCases.media.createUploadUrl,
      }),
      get: makeGetMediaAdapter({
        getMedia: useCases.media.getMedia,
      }),
    },
    campaigns: {
      create: makeCreateCampaignAdapter({
        createCampaign: useCases.campaigns.create,
      }),
      recordCreationTransaction: makeRecordCampaignCreationTransactionAdapter({
        recordCampaignCreationTransaction: useCases.campaigns.recordCreationTransaction,
      }),
      getPublicById: makeGetPublicCampaignByIdAdapter({
        getPublicCampaignById: useCases.campaigns.getPublicById,
      }),
      listMine: makeListCreatorCampaignsAdapter({
        listCreatorCampaigns: useCases.campaigns.listMine,
      }),
      searchPublic: makeSearchPublicCampaignsAdapter({
        searchPublicCampaigns: useCases.campaigns.searchPublic,
      }),
    },
    notifications: {
      list: makeListNotificationsAdapter({
        listNotifications: useCases.notifications.list,
      }),
      markAllRead: makeMarkNotificationsReadAdapter({
        markNotificationsRead: useCases.notifications.markAllRead,
      }),
    },
  };

  const controllers = makeControllers({ adapters });
  const authenticationGuard = makeAuthenticationGuard({
    authenticateSession: useCases.auth.authenticateSession,
    config,
  });

  return {
    controllers,
    authenticationGuard,
    dataSource,
    repositories,
  };
}

export type AppContainer = ReturnType<typeof makeContainer>;
