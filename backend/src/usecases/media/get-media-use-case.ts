import { AppError } from "../../errors/app-error";
import type { MediaStorage } from "./media-storage";

const publicMediaKeyPattern =
  /^users\/[0-9a-f-]{36}\/(profile-avatar|campaign-image)\/[0-9a-f-]{36}-[a-z0-9-]+\.(jpg|png|webp)$/i;

export type MediaReadUrl = {
  mediaUrl: string;
  objectKey: string;
  expiresIn: number;
  expiresAt: string;
};

export class GetMediaUseCase {
  constructor(
    private readonly mediaStorage: MediaStorage,
    private readonly expiresInSeconds: number,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: { objectKey: string }): Promise<MediaReadUrl> {
    if (!publicMediaKeyPattern.test(input.objectKey)) {
      throw new AppError(
        "The requested object is not a public CrowdTube media key.",
        400,
        "INVALID_MEDIA_KEY",
      );
    }

    const mediaUrl = await this.mediaStorage.createReadUrl({
      objectKey: input.objectKey,
      expiresInSeconds: this.expiresInSeconds,
    });

    return {
      mediaUrl,
      objectKey: input.objectKey,
      expiresIn: this.expiresInSeconds,
      expiresAt: new Date(
        this.now().getTime() + this.expiresInSeconds * 1_000,
      ).toISOString(),
    };
  }
}
