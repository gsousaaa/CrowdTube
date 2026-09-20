import { EntitySchema } from "typeorm";

import { Campaign } from "../../../entities/campaign";

export const CampaignSchema = new EntitySchema<Campaign>({
  name: "Campaign",
  target: Campaign,
  tableName: "campaigns",
  columns: {
    id: { type: "uuid", primary: true },
    creatorId: { name: "creator_id", type: "uuid" },
    metadataId: {
      name: "metadata_id",
      type: "varchar",
      length: 66,
      unique: true,
    },
    chainId: { name: "chain_id", type: "integer", nullable: true },
    contractAddress: {
      name: "contract_address",
      type: "varchar",
      length: 42,
      nullable: true,
    },
    onchainCampaignId: {
      name: "onchain_campaign_id",
      type: "numeric",
      precision: 78,
      scale: 0,
      nullable: true,
    },
    creationTransactionHash: {
      name: "creation_transaction_hash",
      type: "varchar",
      length: 66,
      nullable: true,
    },
    title: { type: "varchar", length: 80 },
    category: { type: "varchar", length: 32 },
    description: { type: "varchar", length: 500 },
    youtubeUrl: {
      name: "youtube_url",
      type: "varchar",
      length: 500,
    },
    imageObjectKey: {
      name: "image_object_key",
      type: "varchar",
      length: 1_024,
      nullable: true,
    },
    searchText: {
      name: "search_text",
      type: "varchar",
      length: 700,
    },
    status: { type: "varchar", length: 32 },
    createdAt: {
      name: "created_at",
      type: "timestamptz",
      createDate: true,
    },
    updatedAt: {
      name: "updated_at",
      type: "timestamptz",
      updateDate: true,
    },
  },
  relations: {
    creator: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "creator_id",
        foreignKeyConstraintName: "FK_campaigns_creator_id",
      },
      onDelete: "CASCADE",
    },
  },
  indices: [
    { name: "IDX_campaigns_creator_id", columns: ["creatorId"] },
    { name: "IDX_campaigns_status", columns: ["status"] },
    { name: "IDX_campaigns_search_text", columns: ["searchText"] },
  ],
});
