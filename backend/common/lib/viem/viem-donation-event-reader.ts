import type {
  DonationEventReader,
  DonationReceivedEvent,
} from "../../../src/usecases/notification/donation-event-reader";

export class ViemDonationEventReader implements DonationEventReader {
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

      return {
        chainId: this.chainId,
        contractAddress: this.contractAddress,
        campaignId: campaignId.toString(),
        donorAddress: donor,
        amountWei: amount.toString(),
        transactionHash: log.transactionHash,
        logIndex: log.logIndex,
        blockNumber: log.blockNumber.toString(),
        occurredAt: await getBlockTimestamp(log.blockNumber),
      };
    }));
  }
}
