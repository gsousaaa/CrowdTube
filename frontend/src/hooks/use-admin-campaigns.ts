"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useActiveAccount } from "thirdweb/react";

import { useAdminWalletAuth } from "@/components/wallet/admin-wallet-auth-provider";
import { listMyCampaigns, type ApiCampaign } from "@/lib/api/campaigns";
import { ApiError } from "@/lib/api/client";
import { CAMPAIGNS_UPDATED_EVENT } from "@/lib/api/events";

type AdminCampaignsStatus = "loading" | "disconnected" | "sign-in-required" | "ready" | "error";

export function useAdminCampaigns() {
  const account = useActiveAccount();
  const address = account?.address;
  const adminAuth = useAdminWalletAuth();
  const authStatus = adminAuth.status;
  const authError = adminAuth.error;
  const markSessionExpired = adminAuth.markSessionExpired;
  const requestVersion = useRef(0);
  const [campaigns, setCampaigns] = useState<ApiCampaign[]>([]);
  const [loadedAddress, setLoadedAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<AdminCampaignsStatus>("loading");
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    if (!address) {
      setCampaigns([]);
      setLoadedAddress(null);
      setStatus("disconnected");
      return;
    }
    if (authStatus !== "ready") {
      setCampaigns([]);
      setLoadedAddress(null);
      setStatus(authStatus === "authenticating" ? "loading" : "sign-in-required");
      setError(authError);
      return;
    }

    try {
      const mine = await listMyCampaigns();
      if (version !== requestVersion.current) return;
      setCampaigns(mine);
      setLoadedAddress(address.toLowerCase());
      setError(undefined);
      setStatus("ready");
    } catch (cause) {
      if (version !== requestVersion.current) return;
      setCampaigns([]);
      setLoadedAddress(null);
      if (cause instanceof ApiError && cause.status === 401) {
        markSessionExpired();
        setStatus("sign-in-required");
      } else {
        setStatus("error");
        setError(cause instanceof Error ? cause.message : "Não foi possível carregar as campanhas.");
      }
    }
  }, [address, authStatus, authError, markSessionExpired]);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => { void refresh(); }, 0);
    const onUpdate = () => { void refresh(); };
    window.addEventListener(CAMPAIGNS_UPDATED_EVENT, onUpdate);
    const timer = window.setInterval(onUpdate, 10_000);
    return () => {
      requestVersion.current += 1;
      window.clearTimeout(initialRefresh);
      window.removeEventListener(CAMPAIGNS_UPDATED_EVENT, onUpdate);
      window.clearInterval(timer);
    };
  }, [refresh]);

  const isCurrentWalletLoaded = authStatus === "ready" &&
    loadedAddress === address?.toLowerCase();
  const visibleStatus: AdminCampaignsStatus = !address
    ? "disconnected"
    : authStatus === "authenticating"
      ? "loading"
      : authStatus === "error"
        ? "sign-in-required"
        : status === "ready" && !isCurrentWalletLoaded
          ? "loading"
          : status;

  return {
    campaigns: isCurrentWalletLoaded ? campaigns : [],
    status: visibleStatus,
    error: authStatus === "error" ? authError : error,
    refresh,
  };
}
