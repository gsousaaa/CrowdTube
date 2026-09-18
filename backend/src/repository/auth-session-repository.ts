import type { AuthSession } from "../entities/auth-session";
import type { EntityRepository } from "./entity-repository";

export interface AuthSessionRepository
  extends EntityRepository<AuthSession, string> {
  findByTokenHash(tokenHash: string): Promise<AuthSession | null>;
}
