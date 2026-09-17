import { EntitySchema } from "typeorm";

import { User } from "../../../entities/user";

export const UserSchema = new EntitySchema<User>({
  name: "User",
  target: User,
  tableName: "users",
  columns: {
    id: {
      type: "uuid",
      primary: true,
    },
    displayName: {
      name: "display_name",
      type: "varchar",
      length: 100,
      nullable: true,
    },
    bio: {
      type: "varchar",
      length: 500,
      nullable: true,
    },
    youtubeChannelUrl: {
      name: "youtube_channel_url",
      type: "varchar",
      length: 500,
      nullable: true,
    },
    avatarUrl: {
      name: "avatar_url",
      type: "varchar",
      length: 500,
      nullable: true,
    },
    createdAt: {
      name: "created_at",
      type: "timestamptz",
      createDate: true,
    },
    updatedAt: {
      name: "updated_at",
      type: "timestamptz",
      updateDate: true,
    },
  },
});
