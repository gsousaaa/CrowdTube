import type { UpdateUserProfileInput } from "../../entities/user";
import { AppError } from "../../errors/app-error";
import type { UserRepository } from "../../repository/user-repository";
import type {
  AdminProfile,
  GetAdminProfileUseCase,
} from "./get-admin-profile-use-case";

export type UpdateAdminProfileInput = UpdateUserProfileInput & {
  userId: string;
  authenticatedWalletAddress: string;
};

export class UpdateAdminProfileUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly getAdminProfile: GetAdminProfileUseCase,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: UpdateAdminProfileInput): Promise<AdminProfile> {
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

    return this.getAdminProfile.execute({
      userId: user.id,
      authenticatedWalletAddress,
    });
  }
}
