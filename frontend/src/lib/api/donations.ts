import { apiRequest } from "./client";

export type DonationTransactionConfirmation = {
  status: "pending" | "confirmed";
  transactionHash: string;
  confirmations: number;
  requiredConfirmations: number;
  donationEvents: number;
  recordedEvents: number;
};

export function confirmDonationTransaction(
  transactionHash: string,
): Promise<DonationTransactionConfirmation> {
  return apiRequest("/donations/transactions", {
    method: "POST",
    body: JSON.stringify({ transactionHash }),
  });
}
