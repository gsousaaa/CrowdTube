import { z } from "zod";

import type {
  ControllerAdapter,
  ControllerResponse,
} from "../../controllers/controller-types";
import type { Campaign } from "../../entities/campaign";
import { AppError } from "../../errors/app-error";
import type { RecordCampaignCreationTransactionUseCase } from "../../usecases/campaign/record-campaign-creation-transaction-use-case";

const paramsSchema = z.object({ campaignId: z.uuid() }).strict();
const bodySchema = z.object({
  chainId: z.number().int().positive(),
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
}).strict();

export function makeRecordCampaignCreationTransactionAdapter({
  recordCampaignCreationTransaction,
}: {
  recordCampaignCreationTransaction: Pick<RecordCampaignCreationTransactionUseCase, "execute">;
}): ControllerAdapter<Campaign> {
  return async (request): Promise<ControllerResponse<Campaign>> => {
    if (!request.authenticatedUser) {
      throw new AppError(
        "A valid authentication session is required.",
        401,
        "UNAUTHENTICATED",
      );
    }

    const params = paramsSchema.safeParse(request.params);
    const body = bodySchema.safeParse(request.body);
    if (!params.success || !body.success) {
      throw new AppError(
        "A campaign ID, chain ID, contract address and transaction hash are required.",
        400,
        "INVALID_CAMPAIGN_CREATION_TRANSACTION",
      );
    }

    const campaign = await recordCampaignCreationTransaction.execute({
      campaignId: params.data.campaignId,
      creatorId: request.authenticatedUser.userId,
      ...body.data,
    });

    return {
      statusCode: campaign.status === "published" ? 200 : 202,
      body: campaign,
    };
  };
}
