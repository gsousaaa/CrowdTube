import { apiRequest } from "./client";

export type ProfileWallet = {
  id: string;
  walletAddress: string;
  label: string | null;
  isPrimary: boolean;
  verifiedAt: string;
};

export type AdminProfile = {
  id: string;
  displayName: string | null;
  bio: string | null;
  youtubeChannelUrl: string | null;
  avatarObjectKey: string | null;
  authenticatedWalletAddress: string;
  wallets: ProfileWallet[];
};

export type UpdateAdminProfileInput = Partial<{
  displayName: string | null;
  bio: string | null;
  youtubeChannelUrl: string | null;
  avatarObjectKey: string | null;
}>;

export function getAdminProfile(): Promise<AdminProfile> {
  return apiRequest("/admin/profile");
}

export function updateAdminProfile(
  input: UpdateAdminProfileInput,
): Promise<AdminProfile> {
  return apiRequest("/admin/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
