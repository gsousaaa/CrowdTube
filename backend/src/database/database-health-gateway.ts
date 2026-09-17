export interface DatabaseHealthGateway {
  ping(): Promise<void>;
}
