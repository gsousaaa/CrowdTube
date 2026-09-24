import { AppError } from "../../errors/app-error";
import type { UserRepository } from "../../repository/user-repository";
import type { UserWalletRepository } from "../../repository/user-wallet-repository";

export type Profile = {
  id: string;
  displayName: string | null;
  bio: string | null;
  youtubeChannelUrl: string | null;
  avatarObjectKey: string | null;
  authenticatedWalletAddress: string;
  wallets: Array<{
    id: string;
    walletAddress: string;
    label: string | null;
    isPrimary: boolean;
    verifiedAt: string;
  }>;
};

export class GetProfileUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly userWallets: UserWalletRepository,
  ) {}

  async execute(input: {
    userId: string;
    authenticatedWalletAddress: string;
  }): Promise<Profile> {
    const user = await this.users.findById(input.userId);

    if (!user) {
      throw new AppError(
        "The authenticated user could not be found.",
        401,
        "AUTHENTICATED_USER_NOT_FOUND",
      );
    }

    const wallets = await this.userWallets.findByUserId(user.id);

    return {
      id: user.id,
      displayName: user.displayName,
      bio: user.bio,
      youtubeChannelUrl: user.youtubeChannelUrl,
      avatarObjectKey: user.avatarObjectKey,
      authenticatedWalletAddress: input.authenticatedWalletAddress,
      wallets: wallets.map((wallet) => ({
        id: wallet.id,
        walletAddress: wallet.walletAddress,
        label: wallet.label,
        isPrimary: wallet.isPrimary,
        verifiedAt: wallet.verifiedAt.toISOString(),
      })),
    };
  }
}
