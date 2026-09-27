"use client";

import { useCallback, useEffect, useState } from "react";

import { useAdminWalletAuth } from "@/components/wallet/admin-wallet-auth-provider";
import { useLanguage } from "@/i18n/language-provider";
import { ApiError } from "@/lib/api/client";
import {
  getNotifications,
  markAllNotificationsAsRead,
  type DonationNotification,
} from "@/lib/api/notifications";

type NotificationStatus = "idle" | "loading" | "ready" | "error";

export function useNotifications() {
  const { t } = useLanguage();
  const adminAuth = useAdminWalletAuth();
  const [notifications, setNotifications] = useState<DonationNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [status, setStatus] = useState<NotificationStatus>("idle");
  const [error, setError] = useState<string>();

  const load = useCallback(async ({ silent = false } = {}) => {
    if (adminAuth.status !== "ready") return;
    if (!silent) setStatus("loading");

    try {
      const result = await getNotifications();
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setStatus("ready");
      setError(undefined);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        adminAuth.markSessionExpired();
      }
      if (!silent) {
        setStatus("error");
        setError(
          cause instanceof Error
            ? cause.message
            : t("notifications.loadError"),
        );
      }
    }
  }, [adminAuth, t]);

  useEffect(() => {
    if (adminAuth.status !== "ready") return;

    const initialTimer = window.setTimeout(() => void load(), 0);
    const pollingTimer = window.setInterval(
      () => void load({ silent: true }),
      15_000,
    );
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(pollingTimer);
    };
  }, [adminAuth.status, load]);

  const markAllRead = async () => {
    if (unreadCount === 0 || adminAuth.status !== "ready") return;

    try {
      const result = await markAllNotificationsAsRead();
      setUnreadCount(0);
      setNotifications((current) => current.map((notification) => ({
        ...notification,
        readAt: notification.readAt ?? result.readAt,
      })));
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        adminAuth.markSessionExpired();
      }
      await load({ silent: true });
    }
  };

  return {
    notifications,
    unreadCount,
    status,
    error,
    isAvailable: adminAuth.status === "ready",
    load,
    markAllRead,
  };
}
