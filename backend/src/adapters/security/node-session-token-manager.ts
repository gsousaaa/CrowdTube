import { createHash, randomBytes } from "node:crypto";

import type {
  SessionToken,
  SessionTokenManager,
} from "../../usecases/auth/session-token-manager";

export class NodeSessionTokenManager implements SessionTokenManager {
  create(): SessionToken {
    const raw = randomBytes(32).toString("base64url");

    return {
      raw,
      hash: this.hash(raw),
    };
  }

  hash(rawToken: string): string {
    return createHash("sha256").update(rawToken).digest("hex");
  }
}
