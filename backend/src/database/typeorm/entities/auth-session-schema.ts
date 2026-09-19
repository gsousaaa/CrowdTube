import { EntitySchema } from "typeorm";

import { AuthSession } from "../../../entities/auth-session";

export const AuthSessionSchema = new EntitySchema<AuthSession>({
  name: "AuthSession",
  target: AuthSession,
  tableName: "auth_sessions",
  columns: {
    id: {
      type: "uuid",
      primary: true,
    },
    userId: {
      name: "user_id",
      type: "uuid",
    },
    walletId: {
      name: "wallet_id",
      type: "uuid",
    },
    tokenHash: {
      name: "token_hash",
      type: "varchar",
      length: 64,
      unique: true,
    },
    expiresAt: {
      name: "expires_at",
      type: "timestamptz",
    },
    revokedAt: {
      name: "revoked_at",
      type: "timestamptz",
      nullable: true,
    },
    createdAt: {
      name: "created_at",
      type: "timestamptz",
      createDate: true,
    },
  },
  relations: {
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "user_id",
        foreignKeyConstraintName: "FK_auth_sessions_user_id",
      },
      onDelete: "CASCADE",
    },
    wallet: {
      type: "many-to-one",
      target: "UserWallet",
      joinColumn: {
        name: "wallet_id",
        foreignKeyConstraintName: "FK_auth_sessions_wallet_id",
      },
      onDelete: "CASCADE",
    },
  },
  indices: [
    {
      name: "IDX_auth_sessions_user_id",
      columns: ["userId"],
    },
    {
      name: "IDX_auth_sessions_expires_at",
      columns: ["expiresAt"],
    },
  ],
});
