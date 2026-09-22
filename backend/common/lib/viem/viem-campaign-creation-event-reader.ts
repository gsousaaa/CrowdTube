import type { CampaignCreatedEvent } from "../../../src/usecases/campaign/apply-campaign-created-event-use-case";
import type { CampaignCreationEventReader } from "../../../src/usecases/campaign/campaign-creation-event-reader";

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
