import { randomUUID } from "node:crypto";

export type CreateUserInput = {
  displayName?: string | null;
  bio?: string | null;
  youtubeChannelUrl?: string | null;
  avatarObjectKey?: string | null;
};

export type UpdateUserProfileInput = Pick<
  CreateUserInput,
  "displayName" | "bio" | "youtubeChannelUrl" | "avatarObjectKey"
>;

export class User {
  id!: string;
  displayName!: string | null;
  bio!: string | null;
  youtubeChannelUrl!: string | null;
  avatarObjectKey!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  static create(input: CreateUserInput = {}): User {
    const now = new Date();
    const user = new User();

    user.id = randomUUID();
    user.displayName = input.displayName ?? null;
    user.bio = input.bio ?? null;
    user.youtubeChannelUrl = input.youtubeChannelUrl ?? null;
    user.avatarObjectKey = input.avatarObjectKey ?? null;
    user.createdAt = now;
    user.updatedAt = now;

    return user;
  }

  updateProfile(input: UpdateUserProfileInput, now = new Date()): void {
    if ("displayName" in input) {
      this.displayName = input.displayName?.trim() || null;
    }

    if ("bio" in input) {
      this.bio = input.bio?.trim() || null;
    }

    if ("youtubeChannelUrl" in input) {
      this.youtubeChannelUrl = input.youtubeChannelUrl?.trim() || null;
    }

    if ("avatarObjectKey" in input) {
      this.avatarObjectKey = input.avatarObjectKey?.trim() || null;
    }

    this.updatedAt = now;
  }
}
