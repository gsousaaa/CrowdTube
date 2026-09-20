import type { UpdateUserProfileInput } from "../../entities/user";
import { AppError } from "../../errors/app-error";
import type { UserRepository } from "../../repository/user-repository";
import type {
  Profile,
  GetProfileUseCase,
} from "./get-profile-use-case";

export type UpdateProfileInput = UpdateUserProfileInput & {
  userId: string;
  authenticatedWalletAddress: string;
};

export class UpdateProfileUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly getProfile: GetProfileUseCase,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: UpdateProfileInput): Promise<Profile> {
    const { userId, authenticatedWalletAddress, ...profileFields } = input;
    const user = await this.users.findById(userId);

    if (!user) {
      throw new AppError(
        "The authenticated user could not be found.",
        401,
        "AUTHENTICATED_USER_NOT_FOUND",
      );
    }

    user.updateProfile(profileFields, this.now());
    await this.users.save(user);

    return this.getProfile.execute({
      userId: user.id,
      authenticatedWalletAddress,
    });
  }
}
