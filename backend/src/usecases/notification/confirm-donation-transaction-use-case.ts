import { AppError } from "../../errors/app-error";
import type { DonationEventRepository } from "../../repository/donation-event-repository";
import type { DonationTransactionReceiptReader } from "./donation-event-reader";
import type { DispatchDonationNotificationsUseCase } from "./dispatch-donation-notifications-use-case";
import { RecordDonationEventsUseCase } from "./record-donation-events-use-case";

export type ConfirmDonationTransactionResult = {
  status: "pending" | "confirmed";
  transactionHash: string;
  confirmations: number;
  requiredConfirmations: number;
  donationEvents: number;
  recordedEvents: number;
};

export class ConfirmDonationTransactionUseCase {
  constructor(
    private readonly reader: DonationTransactionReceiptReader,
    private readonly donationEvents: DonationEventRepository,
    private readonly dispatchNotifications: Pick<
      DispatchDonationNotificationsUseCase,
      "execute"
    >,
    private readonly config: {
      chainId: number;
      confirmations: number;
    },
  ) {}

  async execute(transactionHash: string): Promise<ConfirmDonationTransactionResult> {
    const normalizedHash = transactionHash.toLowerCase();
    const actualChainId = await this.reader.getChainId();
    if (actualChainId !== this.config.chainId) {
      throw new AppError(
        "The donation RPC is connected to an unexpected network.",
        503,
        "DONATION_RPC_NETWORK_MISMATCH",
      );
    }

    const receipt = await this.reader.getTransactionReceipt(normalizedHash);
    if (!receipt) return this.pendingResult(normalizedHash, 0);

    if (receipt.status === "reverted") {
      throw new AppError(
        "The donation transaction was reverted.",
        422,
        "DONATION_TRANSACTION_REVERTED",
      );
    }

    const head = await this.reader.getBlockNumber();
    const confirmations = head >= receipt.blockNumber
      ? Number(head - receipt.blockNumber + 1n)
      : 0;
    if (confirmations < this.config.confirmations) {
      return this.pendingResult(normalizedHash, confirmations);
    }

    const events = receipt.events.filter(
      (event) => event.transactionHash.toLowerCase() === normalizedHash,
    );
    if (events.length === 0) {
      throw new AppError(
        "The transaction does not contain a valid donation event.",
        422,
        "DONATION_EVENT_NOT_FOUND",
      );
    }

    const recordedEvents = await new RecordDonationEventsUseCase(
      this.donationEvents,
    ).execute(events);
    await this.dispatchNotifications.execute();

    return {
      status: "confirmed",
      transactionHash: normalizedHash,
      confirmations,
      requiredConfirmations: this.config.confirmations,
      donationEvents: events.length,
      recordedEvents,
    };
  }

  private pendingResult(
    transactionHash: string,
    confirmations: number,
  ): ConfirmDonationTransactionResult {
    return {
      status: "pending",
      transactionHash,
      confirmations,
      requiredConfirmations: this.config.confirmations,
      donationEvents: 0,
      recordedEvents: 0,
    };
  }
}
