import type {
  VerifyWalletSignatureInput,
  WalletSignatureVerifier,
} from "../../../src/usecases/auth/wallet-signature-verifier";

export class ViemWalletSignatureVerifier implements WalletSignatureVerifier {
  async verify(input: VerifyWalletSignatureInput): Promise<boolean> {
    try {
      const { verifyMessage } = await import("viem");

      return await verifyMessage({
        address: input.walletAddress as `0x${string}`,
        message: input.message,
        signature: input.signature as `0x${string}`,
      });
    } catch {
      return false;
    }
  }
}
