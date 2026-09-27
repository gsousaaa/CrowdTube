import "reflect-metadata";
import { DataSource } from "typeorm";

import type { AppConfig } from "../../config/env";
import { CreateAuthSessions1789720000000 } from "./migrations/1789720000000-CreateAuthSessions";
import { CreateUsersAndUserWallets1770000000000 } from "./migrations/1770000000000-create-users-and-user-wallets";
import { CreateAuthNonces1789644794085 } from "./migrations/1789644794085-CreateAuthNonces";
import { CreateCampaigns1790000000000 } from "./migrations/1790000000000-CreateCampaigns";
import { CreateChainSyncState1790000000001 } from "./migrations/1790000000001-CreateChainSyncState";
import { RenameUserAvatarToObjectKey1790208000000 } from "./migrations/1790208000000-RenameUserAvatarToObjectKey";
import { CreateDonationNotifications1790294400000 } from "./migrations/1790294400000-CreateDonationNotifications";
import { AddDonationEventOccurredAt1790380800000 } from "./migrations/1790380800000-AddDonationEventOccurredAt";
import { AuthSessionSchema } from "./typeorm/entities/auth-session-schema";
import { AuthNonceSchema } from "./typeorm/entities/auth-nonce-schema";
import { UserSchema } from "./typeorm/entities/user-schema";
import { UserWalletSchema } from "./typeorm/entities/user-wallet-schema";
import { CampaignSchema } from "./typeorm/entities/campaign-schema";
import { DonationEventSchema } from "./typeorm/entities/donation-event-schema";
import { NotificationSchema } from "./typeorm/entities/notification-schema";

export function makeTypeOrmDataSource(config: AppConfig): DataSource {
  return new DataSource({
    type: "postgres",
    host: config.DB_HOST,
    port: config.DB_PORT,
    username: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    entities: [
      AuthNonceSchema,
      AuthSessionSchema,
      CampaignSchema,
      DonationEventSchema,
      NotificationSchema,
      UserSchema,
      UserWalletSchema,
    ],
    migrations: [
      CreateUsersAndUserWallets1770000000000,
      CreateAuthNonces1789644794085,
      CreateAuthSessions1789720000000,
      CreateCampaigns1790000000000,
      CreateChainSyncState1790000000001,
      RenameUserAvatarToObjectKey1790208000000,
      CreateDonationNotifications1790294400000,
      AddDonationEventOccurredAt1790380800000,
    ],
    synchronize: false,
    logging: config.NODE_ENV === "dev" ? ["error", "warn"] : false,
  });
}
