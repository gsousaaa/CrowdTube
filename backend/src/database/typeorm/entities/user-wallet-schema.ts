import { EntitySchema } from "typeorm";

import { UserWallet } from "../../../entities/user-wallet";

export const UserWalletSchema = new EntitySchema<UserWallet>({
  name: "UserWallet",
  target: UserWallet,
  tableName: "user_wallets",
  columns: {
    id: {
      type: "uuid",
      primary: true,
    },
    userId: {
      name: "user_id",
      type: "uuid",
    },
    walletAddress: {
      name: "wallet_address",
      type: "varchar",
      length: 42,
      unique: true,
    },
    label: {
      type: "varchar",
      length: 80,
      nullable: true,
    },
    isPrimary: {
      name: "is_primary",
      type: "boolean",
      default: false,
    },
    verifiedAt: {
      name: "verified_at",
      type: "timestamptz",
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
        foreignKeyConstraintName: "FK_user_wallets_user_id",
      },
      onDelete: "CASCADE",
    },
  },
  indices: [
    {
      name: "IDX_user_wallets_user_id",
      columns: ["userId"],
    },
    {
      name: "UQ_user_wallets_primary_per_user",
      columns: ["userId"],
      unique: true,
      where: '"is_primary" = true',
    },
  ],
});
