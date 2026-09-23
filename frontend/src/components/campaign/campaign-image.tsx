"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { getCampaignImageUrl } from "@/lib/api/media";

export function CampaignImage({ objectKey, alt }: { objectKey: string | null; alt: string }) {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!objectKey) return;
    let active = true;
    let timer: number;
    const renew = async () => {
      try {
        const result = await getCampaignImageUrl(objectKey);
        if (!active) return;
        setUrl(result.mediaUrl);
        const remainingMs = new Date(result.expiresAt).getTime() - Date.now();
        timer = window.setTimeout(() => { void renew(); },
          Number.isFinite(remainingMs) ? Math.max(1_000, remainingMs - 30_000) : 30_000);
      } catch {
        if (!active) return;
        setUrl(undefined);
        timer = window.setTimeout(() => { void renew(); }, 30_000);
      }
    };
    void renew();
    return () => { active = false; window.clearInterval(timer); };
  }, [objectKey]);

  if (!url) {
    return <span className="text-xs text-zinc-400">{objectKey ? "Carregando imagem..." : "Sem imagem de capa"}</span>;
  }

  return <Image src={url} alt={alt} fill sizes="(max-width: 1024px) 100vw, 300px" unoptimized className="object-cover" />;
}
