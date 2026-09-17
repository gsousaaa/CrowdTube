import type { User } from "../entities/user";
import type { EntityRepository } from "./entity-repository";

export type UserRepository = EntityRepository<User, string>;
