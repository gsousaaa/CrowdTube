export type SessionToken = {
  raw: string;
  hash: string;
};

export interface SessionTokenManager {
  create(): SessionToken;
  hash(rawToken: string): string;
}
