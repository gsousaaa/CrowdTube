"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAdminWalletAuth } from "@/components/wallet/admin-wallet-auth-provider";
import {
  getCreatorAnalytics,
  type CreatorAnalytics,
} from "@/lib/api/analytics";
import { ApiError } from "@/lib/api/client";

type AnalyticsStatus =
  | "idle"
  | "loading"
  | "ready"
  | "sign-in-required"
  | "error";

export function useCreatorAnalytics(period: { from: string; to: string }) {
  const adminAuth = useAdminWalletAuth();
  const authStatus = adminAuth.status;
  const markSessionExpired = adminAuth.markSessionExpired;
  const requestVersion = useRef(0);
  const [analytics, setAnalytics] = useState<CreatorAnalytics>();
  const [status, setStatus] = useState<AnalyticsStatus>("idle");
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    if (authStatus !== "ready") {
      setAnalytics(undefined);
      setStatus(
        authStatus === "authenticating" ? "loading" : "sign-in-required",
      );
      return;
    }

    setAnalytics(undefined);
    setStatus("loading");
    try {
      const result = await getCreatorAnalytics(period);
      if (version !== requestVersion.current) return;
      setAnalytics(result);
      setError(undefined);
      setStatus("ready");
    } catch (cause) {
      if (version !== requestVersion.current) return;
      if (cause instanceof ApiError && cause.status === 401) {
        markSessionExpired();
        setStatus("sign-in-required");
        return;
      }
      setStatus("error");
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível carregar os indicadores.",
      );
    }
  }, [authStatus, markSessionExpired, period]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => {
      requestVersion.current += 1;
      window.clearTimeout(timer);
    };
  }, [load]);

  return { analytics, status, error, refresh: load };
}
