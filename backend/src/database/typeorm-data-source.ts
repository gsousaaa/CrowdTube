import "reflect-metadata";
import { DataSource } from "typeorm";

import type { AppConfig } from "../../config/env";
import { CreateUsersAndUserWallets1770000000000 } from "./migrations/1770000000000-create-users-and-user-wallets";
import { CreateAuthNonces1789644794085 } from "./migrations/1789644794085-CreateAuthNonces";
import { AuthNonceSchema } from "./typeorm/entities/auth-nonce-schema";
import { UserSchema } from "./typeorm/entities/user-schema";
import { UserWalletSchema } from "./typeorm/entities/user-wallet-schema";

export function makeTypeOrmDataSource(config: AppConfig): DataSource {
  return new DataSource({
    type: "postgres",
    host: config.DB_HOST,
    port: config.DB_PORT,
    username: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    entities: [AuthNonceSchema, UserSchema, UserWalletSchema],
    migrations: [
      CreateUsersAndUserWallets1770000000000,
      CreateAuthNonces1789644794085,
    ],
    synchronize: false,
    logging: config.NODE_ENV === "dev" ? ["error", "warn"] : false,
  });
}
