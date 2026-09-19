import { PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type UploadMediaInput = {
  bucketName: string;
  objectKey: string;
  contentType: string;
  expiresInSeconds: number;
};

export function uploadMedia(
  client: S3Client,
  input: UploadMediaInput,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: input.bucketName,
    Key: input.objectKey,
    ContentType: input.contentType,
  });

  return getSignedUrl(client, command, {
    expiresIn: input.expiresInSeconds,
  });
}
