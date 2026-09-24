"use client";

import { useEffect, useState } from "react";

import { getMediaUrl } from "@/lib/api/media";

type LoadedMedia = {
  objectKey: string;
  url: string;
};

export function useMediaUrl(objectKey: string | null | undefined) {
  const [loadedMedia, setLoadedMedia] = useState<LoadedMedia>();
  const url = loadedMedia && loadedMedia.objectKey === objectKey
    ? loadedMedia.url
    : undefined;

  useEffect(() => {
    if (!objectKey) return;

    let active = true;
    let renewalTimer: number | undefined;

    const renew = async () => {
      try {
        const result = await getMediaUrl(objectKey);
        if (!active) return;

        setLoadedMedia({ objectKey, url: result.mediaUrl });
        const remainingMs = new Date(result.expiresAt).getTime() - Date.now();
        renewalTimer = window.setTimeout(
          () => void renew(),
          Number.isFinite(remainingMs)
            ? Math.max(1_000, remainingMs - 30_000)
            : 30_000,
        );
      } catch {
        if (!active) return;
        renewalTimer = window.setTimeout(() => void renew(), 30_000);
      }
    };

    void renew();

    return () => {
      active = false;
      if (renewalTimer !== undefined) {
        window.clearTimeout(renewalTimer);
      }
    };
  }, [objectKey]);

  return {
    url,
    isLoading: Boolean(objectKey) && !url,
  };
}
