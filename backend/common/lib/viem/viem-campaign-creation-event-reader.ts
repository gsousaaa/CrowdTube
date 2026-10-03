import type { CampaignCreatedEvent } from "../../../src/usecases/campaign/apply-campaign-created-event-use-case";
import type {
  CampaignCreationEventReader,
  CampaignCreationTransactionReceipt,
} from "../../../src/usecases/campaign/campaign-creation-event-reader";

export class ViemCampaignCreationEventReader implements CampaignCreationEventReader {
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
  ): Promise<CampaignCreationTransactionReceipt | null> {
    const {
      decodeEventLog,
      parseAbiItem,
      TransactionReceiptNotFoundError,
    } = await import("viem");
    const campaignCreatedEvent = parseAbiItem(
      "event CampaignCreated(uint256 indexed campaignId, address indexed creator, bytes32 indexed metadataId, uint256 goal, uint256 deadline)",
    );

    try {
      const receipt = await (await this.getClient()).getTransactionReceipt({
        hash: transactionHash as `0x${string}`,
      });
      const events = receipt.logs.flatMap((log): CampaignCreatedEvent[] => {
        if (log.address.toLowerCase() !== this.contractAddress.toLowerCase()) {
          return [];
        }

        try {
          const decoded = decodeEventLog({
            abi: [campaignCreatedEvent],
            data: log.data,
            topics: log.topics,
            strict: true,
          });
          const { campaignId, creator, metadataId } = decoded.args;

          return [{
            chainId: this.chainId,
            contractAddress: this.contractAddress,
            campaignId: campaignId.toString(),
            creator,
            metadataId,
            transactionHash: receipt.transactionHash,
          }];
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

  async getCreatedEvents(
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<CampaignCreatedEvent[]> {
    const { parseAbiItem } = await import("viem");
    const campaignCreatedEvent = parseAbiItem(
      "event CampaignCreated(uint256 indexed campaignId, address indexed creator, bytes32 indexed metadataId, uint256 goal, uint256 deadline)",
    );
    const logs = await (await this.getClient()).getContractEvents({
      address: this.contractAddress,
      abi: [campaignCreatedEvent],
      eventName: "CampaignCreated",
      fromBlock,
      toBlock,
    });

    return logs.map((log) => {
      const { campaignId, creator, metadataId } = log.args;
      if (campaignId === undefined || creator === undefined || metadataId === undefined) {
        throw new Error("CampaignCreated log is missing required arguments.");
      }

      return {
        chainId: this.chainId,
        contractAddress: this.contractAddress,
        campaignId: campaignId.toString(),
        creator,
        metadataId,
        transactionHash: log.transactionHash,
      };
    });
  }
}
