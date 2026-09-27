import { randomUUID } from "node:crypto";

export type DonationEventStatus = "pending" | "processed";

export type CreateDonationEventInput = {
  chainId: number;
  contractAddress: string;
  onchainCampaignId: string;
  donorAddress: string;
  amountWei: string;
  transactionHash: string;
  logIndex: number;
  blockNumber: string;
};

export class DonationEvent {
  id!: string;
  chainId!: number;
  contractAddress!: string;
  onchainCampaignId!: string;
  donorAddress!: string;
  amountWei!: string;
  transactionHash!: string;
  logIndex!: number;
  blockNumber!: string;
  status!: DonationEventStatus;
  attemptCount!: number;
  lastAttemptedAt!: Date | null;
  processedAt!: Date | null;
  createdAt!: Date;

  static create(input: CreateDonationEventInput, now = new Date()): DonationEvent {
    const event = new DonationEvent();

    event.id = randomUUID();
    event.chainId = input.chainId;
    event.contractAddress = input.contractAddress.toLowerCase();
    event.onchainCampaignId = input.onchainCampaignId;
    event.donorAddress = input.donorAddress.toLowerCase();
    event.amountWei = input.amountWei;
    event.transactionHash = input.transactionHash.toLowerCase();
    event.logIndex = input.logIndex;
    event.blockNumber = input.blockNumber;
    event.status = "pending";
    event.attemptCount = 0;
    event.lastAttemptedAt = null;
    event.processedAt = null;
    event.createdAt = now;

    return event;
  }

  recordAttempt(now = new Date()): void {
    this.attemptCount += 1;
    this.lastAttemptedAt = now;
  }

  markProcessed(now = new Date()): void {
    if (this.status === "processed") return;
    this.status = "processed";
    this.processedAt = now;
  }
}
