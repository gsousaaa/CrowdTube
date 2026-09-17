import type { AuthNonce } from "../entities/auth-nonce";
import type { EntityRepository } from "./entity-repository";

export interface AuthNonceRepository
  extends EntityRepository<AuthNonce, string> {
  findByNonce(nonce: string): Promise<AuthNonce | null>;
}
