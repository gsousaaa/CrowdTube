export type VerifyWalletSignatureInput = {
  walletAddress: string;
  message: string;
  signature: string;
};

export interface WalletSignatureVerifier {
  verify(input: VerifyWalletSignatureInput): Promise<boolean>;
}
