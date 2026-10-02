import type {
  DonationEventReader,
  DonationReceivedEvent,
  DonationTransactionReceipt,
  DonationTransactionReceiptReader,
} from "../../../src/usecases/notification/donation-event-reader";

export class ViemDonationEventReader
  implements DonationEventReader, DonationTransactionReceiptReader
{
  constructor(
    private readonly rpcUrl: string,
    private readonly chainId: number,
    private readonly contractAddress: `0x${string}`,
  ) {}

  private async getClient() {
    const { createPublicClient, http } = await import("viem");
    return createPublicClient({ transport: http(this.rpcUrl) });
  }

  async getChainId(): Promise<number> {
    return (await this.getClient()).getChainId();
  }

  async getBlockNumber(): Promise<bigint> {
    return (await this.getClient()).getBlockNumber();
  }

  async hasContract(): Promise<boolean> {
    const bytecode = await (await this.getClient()).getCode({
      address: this.contractAddress,
    });
    return bytecode !== undefined && bytecode !== "0x";
  }

  async getTransactionReceipt(
    transactionHash: string,
  ): Promise<DonationTransactionReceipt | null> {
    const {
      decodeEventLog,
      parseAbiItem,
      TransactionReceiptNotFoundError,
    } = await import("viem");
    const client = await this.getClient();
    const donationReceivedEvent = parseAbiItem(
      "event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount)",
    );

    try {
      const receipt = await client.getTransactionReceipt({
        hash: transactionHash as `0x${string}`,
      });
      const block = await client.getBlock({ blockNumber: receipt.blockNumber });
      const occurredAt = new Date(Number(block.timestamp) * 1_000);
      const events = receipt.logs.flatMap((log): DonationReceivedEvent[] => {
        if (log.address.toLowerCase() !== this.contractAddress.toLowerCase()) {
          return [];
        }

        try {
          const decoded = decodeEventLog({
            abi: [donationReceivedEvent],
            data: log.data,
            topics: log.topics,
            strict: true,
          });
          const { campaignId, donor, amount } = decoded.args;

          return [this.toDonationEvent({
            campaignId,
            donorAddress: donor,
            amountWei: amount,
            transactionHash: receipt.transactionHash,
            logIndex: log.logIndex,
            blockNumber: receipt.blockNumber,
            occurredAt,
          })];
        } catch {
          return [];
        }
      });

      return {
        blockNumber: receipt.blockNumber,
        status: receipt.status,
        events,
      };
    } catch (error) {
      if (error instanceof TransactionReceiptNotFoundError) return null;
      throw error;
    }
  }

  async getDonationEvents(
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<DonationReceivedEvent[]> {
    const { parseAbiItem } = await import("viem");
    const client = await this.getClient();
    const donationReceivedEvent = parseAbiItem(
      "event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount)",
    );
    const logs = await client.getContractEvents({
      address: this.contractAddress,
      abi: [donationReceivedEvent],
      eventName: "DonationReceived",
      fromBlock,
      toBlock,
    });

    const blockTimestamps = new Map<bigint, Promise<Date>>();
    const getBlockTimestamp = (blockNumber: bigint): Promise<Date> => {
      const cached = blockTimestamps.get(blockNumber);
      if (cached) return cached;

      const timestamp = client
        .getBlock({ blockNumber })
        .then((block) => new Date(Number(block.timestamp) * 1_000));
      blockTimestamps.set(blockNumber, timestamp);
      return timestamp;
    };

    return Promise.all(logs.map(async (log) => {
      const { campaignId, donor, amount } = log.args;
      if (
        campaignId === undefined ||
        donor === undefined ||
        amount === undefined ||
        log.transactionHash === null ||
        log.logIndex === null ||
        log.blockNumber === null
      ) {
        throw new Error("DonationReceived log is missing required data.");
      }

      return this.toDonationEvent({
        campaignId,
        donorAddress: donor,
        amountWei: amount,
        transactionHash: log.transactionHash,
        logIndex: log.logIndex,
        blockNumber: log.blockNumber,
        occurredAt: await getBlockTimestamp(log.blockNumber),
      });
    }));
  }

  private toDonationEvent(input: {
    campaignId: bigint;
    donorAddress: `0x${string}`;
    amountWei: bigint;
    transactionHash: `0x${string}`;
    logIndex: number;
    blockNumber: bigint;
    occurredAt: Date;
  }): DonationReceivedEvent {
    return {
      chainId: this.chainId,
      contractAddress: this.contractAddress,
      campaignId: input.campaignId.toString(),
      donorAddress: input.donorAddress,
      amountWei: input.amountWei.toString(),
      transactionHash: input.transactionHash,
      logIndex: input.logIndex,
      blockNumber: input.blockNumber.toString(),
      occurredAt: input.occurredAt,
    };
  }
}
