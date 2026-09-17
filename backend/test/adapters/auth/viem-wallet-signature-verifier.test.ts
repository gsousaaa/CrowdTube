import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ViemWalletSignatureVerifier } from "../../../common/lib/viem/viem-wallet-signature-verifier";

describe("ViemWalletSignatureVerifier", () => {
  it("accepts a message signed by the expected wallet", async () => {
    const { privateKeyToAccount } = await import("viem/accounts");
    const account = privateKeyToAccount(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    );
    const message = "Sign in to CrowdTube";
    const signature = await account.signMessage({ message });
    const verifier = new ViemWalletSignatureVerifier();

    const result = await verifier.verify({
      walletAddress: account.address,
      message,
      signature,
    });

    assert.equal(result, true);
  });

  it("rejects a signature when the message was changed", async () => {
    const { privateKeyToAccount } = await import("viem/accounts");
    const account = privateKeyToAccount(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    );
    const signature = await account.signMessage({
      message: "Original message",
    });
    const verifier = new ViemWalletSignatureVerifier();

    const result = await verifier.verify({
      walletAddress: account.address,
      message: "Changed message",
      signature,
    });

    assert.equal(result, false);
  });
});
