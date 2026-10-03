import { EntitySchema } from "typeorm";

import { DonationEvent } from "../../../entities/donation-event";

export const DonationEventSchema = new EntitySchema<DonationEvent>({
  name: "DonationEvent",
  target: DonationEvent,
  tableName: "donation_events",
  columns: {
    id: { type: "uuid", primary: true },
    chainId: { name: "chain_id", type: "integer" },
    contractAddress: {
      name: "contract_address",
      type: "varchar",
      length: 42,
    },
    onchainCampaignId: {
      name: "onchain_campaign_id",
      type: "numeric",
      precision: 78,
      scale: 0,
    },
    donorAddress: {
      name: "donor_address",
      type: "varchar",
      length: 42,
    },
    amountWei: {
      name: "amount_wei",
      type: "numeric",
      precision: 78,
      scale: 0,
    },
    transactionHash: {
      name: "transaction_hash",
      type: "varchar",
      length: 66,
    },
    logIndex: { name: "log_index", type: "integer" },
    blockNumber: {
      name: "block_number",
      type: "numeric",
      precision: 78,
      scale: 0,
    },
    occurredAt: {
      name: "occurred_at",
      type: "timestamptz",
    },
    status: { type: "varchar", length: 32 },
    attemptCount: { name: "attempt_count", type: "integer", default: 0 },
    lastAttemptedAt: {
      name: "last_attempted_at",
      type: "timestamptz",
      nullable: true,
    },
    processedAt: {
      name: "processed_at",
      type: "timestamptz",
      nullable: true,
    },
    createdAt: {
      name: "created_at",
      type: "timestamptz",
      createDate: true,
    },
  },
  indices: [
    {
      name: "UQ_donation_events_source",
      unique: true,
      columns: ["chainId", "contractAddress", "transactionHash", "logIndex"],
    },
    {
      name: "IDX_donation_events_pending",
      columns: ["status", "createdAt"],
    },
    {
      name: "IDX_donation_events_occurred_at",
      columns: ["occurredAt"],
    },
    {
      name: "IDX_donation_events_campaign_history",
      columns: [
        "chainId",
        "contractAddress",
        "onchainCampaignId",
        "blockNumber",
        "logIndex",
      ],
    },
  ],
});
