import type { S3Client } from "@aws-sdk/client-s3";

import type { MediaStorage } from "../../../../src/usecases/media/media-storage";
import { getMedia } from "./get-media";
import { uploadMedia } from "./upload-media";

export class S3MediaStorage implements MediaStorage {
  constructor(
    private readonly client: S3Client,
    private readonly bucketName: string,
  ) {}

  createUploadUrl(input: {
    objectKey: string;
    contentType: string;
    expiresInSeconds: number;
  }): Promise<string> {
    return uploadMedia(this.client, {
      bucketName: this.bucketName,
      ...input,
    });
  }

  createReadUrl(input: {
    objectKey: string;
    expiresInSeconds: number;
  }): Promise<string> {
    return getMedia(this.client, {
      bucketName: this.bucketName,
      ...input,
    });
  }
}
