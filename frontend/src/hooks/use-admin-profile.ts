"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useActiveAccount } from "thirdweb/react";

import { useAdminWalletAuth } from "@/components/wallet/admin-wallet-auth-provider";
import { ApiError } from "@/lib/api/client";
import {
  getAdminProfile,
  updateAdminProfile,
  type AdminProfile,
  type UpdateAdminProfileInput,
} from "@/lib/api/profile";

type ProfileStatus =
  | "disconnected"
  | "authenticating"
  | "loading"
  | "ready"
  | "error";

function getProfileErrorMessage(cause: unknown, fallback: string) {
  if (cause instanceof ApiError && cause.code === "INVALID_PROFILE_DATA") {
    return "Revise os dados informados. O canal precisa ser uma URL válida do YouTube.";
  }
  return cause instanceof Error ? cause.message : fallback;
}

export function useAdminProfile() {
  const account = useActiveAccount();
  const address = account?.address.toLowerCase() ?? null;
  const adminAuth = useAdminWalletAuth();
  const authStatus = adminAuth.status;
  const authError = adminAuth.error;
  const markSessionExpired = adminAuth.markSessionExpired;
  const requestVersion = useRef(0);
  const [profile, setProfile] = useState<AdminProfile>();
  const [loadedAddress, setLoadedAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<ProfileStatus>("disconnected");
  const [error, setError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    const version = ++requestVersion.current;

    if (!address) {
      setProfile(undefined);
      setLoadedAddress(null);
      setStatus("disconnected");
      return;
    }
    if (authStatus !== "ready") {
      setProfile(undefined);
      setLoadedAddress(null);
      setStatus("authenticating");
      setError(authError);
      return;
    }

    setStatus("loading");
    setError(undefined);

    try {
      const result = await getAdminProfile();
      if (version !== requestVersion.current) return;
      setProfile(result);
      setLoadedAddress(address);
      setStatus("ready");
    } catch (cause) {
      if (version !== requestVersion.current) return;
      setProfile(undefined);
      setLoadedAddress(null);
      if (cause instanceof ApiError && cause.status === 401) {
        markSessionExpired();
        setStatus("authenticating");
      } else {
        setStatus("error");
        setError(getProfileErrorMessage(cause, "Não foi possível carregar o perfil."));
      }
    }
  }, [address, authError, authStatus, markSessionExpired]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => {
      requestVersion.current += 1;
      window.clearTimeout(timer);
    };
  }, [load]);

  const save = async (input: UpdateAdminProfileInput) => {
    if (!address || authStatus !== "ready") {
      throw new Error("Autentique sua carteira antes de editar o perfil.");
    }

    setIsSaving(true);
    setError(undefined);

    try {
      const updatedProfile = await updateAdminProfile(input);
      setProfile(updatedProfile);
      setLoadedAddress(address);
      setStatus("ready");
      return updatedProfile;
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        markSessionExpired();
        setStatus("authenticating");
        throw new Error("Sua sessão expirou. Autentique a carteira novamente.");
      }

      const message = getProfileErrorMessage(
        cause,
        "Não foi possível atualizar o perfil.",
      );
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const isCurrentProfile = loadedAddress === address;
  const visibleStatus: ProfileStatus = !address
    ? "disconnected"
    : authStatus !== "ready"
      ? "authenticating"
      : status === "ready" && !isCurrentProfile
        ? "loading"
        : status;

  return {
    profile: isCurrentProfile ? profile : undefined,
    status: visibleStatus,
    error: authStatus === "error" ? authError : error,
    isSaving,
    load,
    save,
  };
}
