import { EntitySchema } from "typeorm";

import { AuthNonce } from "../../../entities/auth-nonce";

export const AuthNonceSchema = new EntitySchema<AuthNonce>({
  name: "AuthNonce",
  target: AuthNonce,
  tableName: "auth_nonces",
  columns: {
    id: {
      type: "uuid",
      primary: true,
    },
    userId: {
      name: "user_id",
      type: "uuid",
      nullable: true,
    },
    walletAddress: {
      name: "wallet_address",
      type: "varchar",
      length: 42,
    },
    purpose: {
      type: "varchar",
      length: 20,
    },
    nonce: {
      type: "varchar",
      length: 64,
      unique: true,
    },
    expiresAt: {
      name: "expires_at",
      type: "timestamptz",
    },
    usedAt: {
      name: "used_at",
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
        foreignKeyConstraintName: "FK_auth_nonces_user_id",
      },
      nullable: true,
      onDelete: "CASCADE",
    },
  },
  indices: [
    {
      name: "IDX_auth_nonces_wallet_purpose",
      columns: ["walletAddress", "purpose"],
    },
    {
      name: "IDX_auth_nonces_expires_at",
      columns: ["expiresAt"],
    },
  ],
  checks: [
    {
      name: "CHK_auth_nonces_purpose",
      expression: '"purpose" IN (\'login\', \'link_wallet\')',
    },
  ],
});
