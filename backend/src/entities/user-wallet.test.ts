import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { UserWallet, normalizeWalletAddress } from "./user-wallet";

const mixedCaseWallet = "0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD";

describe("UserWallet", () => {
  it("normalizes an Ethereum address before storing it", () => {
    const wallet = UserWallet.create({
      userId: "310d02fe-7f88-43d9-a06d-ed697e2936b2",
      walletAddress: mixedCaseWallet,
      isPrimary: true,
    });

    assert.equal(wallet.walletAddress, mixedCaseWallet.toLowerCase());
    assert.equal(wallet.isPrimary, true);
  });

  it("rejects an invalid Ethereum address", () => {
    assert.throws(
      () => normalizeWalletAddress("not-a-wallet"),
      /Invalid Ethereum wallet address/,
    );
  });
});
