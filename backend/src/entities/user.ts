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
  createdAt!: number;
  updatedAt!: number;

  static create(input: CreateUserInput = {}): User {
    const now = Date.now();
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
