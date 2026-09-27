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
