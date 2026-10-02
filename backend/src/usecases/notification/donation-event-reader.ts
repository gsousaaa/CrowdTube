export type DonationReceivedEvent = {
  chainId: number;
  contractAddress: string;
  campaignId: string;
  donorAddress: string;
  amountWei: string;
  transactionHash: string;
  logIndex: number;
  blockNumber: string;
  occurredAt: Date;
};

export interface DonationEventReader {
  getChainId(): Promise<number>;
  getBlockNumber(): Promise<bigint>;
  hasContract(): Promise<boolean>;
  getDonationEvents(
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<DonationReceivedEvent[]>;
}

export type DonationTransactionReceipt = {
  blockNumber: bigint;
  status: "success" | "reverted";
  events: DonationReceivedEvent[];
};

export interface DonationTransactionReceiptReader {
  getChainId(): Promise<number>;
  getBlockNumber(): Promise<bigint>;
  getTransactionReceipt(
    transactionHash: string,
  ): Promise<DonationTransactionReceipt | null>;
}
