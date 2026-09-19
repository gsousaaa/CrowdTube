export type CreateMediaUploadUrlInput = {
  objectKey: string;
  contentType: string;
  expiresInSeconds: number;
};

export type CreateMediaReadUrlInput = {
  objectKey: string;
  expiresInSeconds: number;
};

export interface MediaStorage {
  createUploadUrl(input: CreateMediaUploadUrlInput): Promise<string>;
  createReadUrl(input: CreateMediaReadUrlInput): Promise<string>;
}
