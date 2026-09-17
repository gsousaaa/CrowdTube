import { randomUUID } from "node:crypto";

export type CreateUserInput = {
  displayName?: string | null;
  bio?: string | null;
  youtubeChannelUrl?: string | null;
  avatarUrl?: string | null;
};

export class User {
  id!: string;
  displayName!: string | null;
  bio!: string | null;
  youtubeChannelUrl!: string | null;
  avatarUrl!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  static create(input: CreateUserInput = {}): User {
    const now = new Date();
    const user = new User();

    user.id = randomUUID();
    user.displayName = input.displayName ?? null;
    user.bio = input.bio ?? null;
    user.youtubeChannelUrl = input.youtubeChannelUrl ?? null;
    user.avatarUrl = input.avatarUrl ?? null;
    user.createdAt = now;
    user.updatedAt = now;

    return user;
  }
}
