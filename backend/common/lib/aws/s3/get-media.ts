import { GetObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type GetMediaInput = {
  bucketName: string;
  objectKey: string;
  expiresInSeconds: number;
};

export function getMedia(
  client: S3Client,
  input: GetMediaInput,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: input.bucketName,
    Key: input.objectKey,
  });

  return getSignedUrl(client, command, {
    expiresIn: input.expiresInSeconds,
  });
}
