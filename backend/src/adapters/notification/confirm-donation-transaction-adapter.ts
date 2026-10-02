import { z } from "zod";

import type {
  ControllerAdapter,
  ControllerResponse,
} from "../../controllers/controller-types";
import { AppError } from "../../errors/app-error";
import type {
  ConfirmDonationTransactionResult,
  ConfirmDonationTransactionUseCase,
} from "../../usecases/notification/confirm-donation-transaction-use-case";

const bodySchema = z.object({
  transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
}).strict();

export function makeConfirmDonationTransactionAdapter({
  confirmDonationTransaction,
}: {
  confirmDonationTransaction: Pick<
    ConfirmDonationTransactionUseCase,
    "execute"
  > | null;
}): ControllerAdapter<ConfirmDonationTransactionResult> {
  return async (request): Promise<
    ControllerResponse<ConfirmDonationTransactionResult>
  > => {
    const body = bodySchema.safeParse(request.body);
    if (!body.success) {
      throw new AppError(
        "A valid donation transaction hash is required.",
        400,
        "INVALID_DONATION_TRANSACTION",
      );
    }
    if (!confirmDonationTransaction) {
      throw new AppError(
        "Donation transaction confirmation is not configured.",
        503,
        "DONATION_CONFIRMATION_UNAVAILABLE",
      );
    }

    const result = await confirmDonationTransaction.execute(
      body.data.transactionHash,
    );
    return {
      statusCode: result.status === "confirmed" ? 200 : 202,
      body: result,
    };
  };
}
